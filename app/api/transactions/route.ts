import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get pagination parameters from URL
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || undefined
    const search = searchParams.get("search") || undefined

    // Calculate skip value for pagination
    const skip = (page - 1) * limit

    // Build the where clause for filtering. Ownership is ALWAYS scoped
    // to the signed-in user as buyer or seller. A previous version of
    // this filter overwrote the ownership OR-clause with the search
    // OR-clause whenever a search term was present, which returned
    // other users' transactions — the search terms are now an
    // additional AND group instead, so results stay own-transactions
    // only. Search covers product text, the transaction id, and the
    // counterparty's name/username.
    const where: any = {
      AND: [{ OR: [{ buyerId: user.id }, { sellerId: user.id }] }],
    }

    // Add status filter if provided
    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }

    // Add search filter if provided
    if (search) {
      where.AND.push({
        OR: [
          { productDetails: { contains: search, mode: "insensitive" } },
          { productCategory: { contains: search, mode: "insensitive" } },
          { id: { contains: search } },
          { buyer: { name: { contains: search, mode: "insensitive" } } },
          { buyer: { username: { contains: search, mode: "insensitive" } } },
          { seller: { name: { contains: search, mode: "insensitive" } } },
          { seller: { username: { contains: search, mode: "insensitive" } } },
        ],
      })
    }

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({ where })

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    // Transform transactions for response
    const formattedTransactions = transactions.map((transaction) => {
      const isBuyer = transaction.buyerId === user.id
      const type = isBuyer ? "Purchase" : "Sale"
      const counterpartyName = isBuyer
        ? transaction.seller.name || transaction.seller.username || "Unknown"
        : transaction.buyer.name || transaction.buyer.username || "Unknown"

      return {
        id: transaction.id,
        amount: transaction.amount,
        escrowFee: transaction.escrowFee,
        status: transaction.status,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
        productCategory: transaction.productCategory,
        productDetails: transaction.productDetails,
        type,
        counterpartyName,
        isBuyer,
        isSeller: !isBuyer,
      }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      data: formattedTransactions,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
