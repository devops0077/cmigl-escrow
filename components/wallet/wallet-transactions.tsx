"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useWalletTransactions } from "@/hooks/use-wallet-transactions"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function WalletTransactions() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [type, setType] = useState<string | undefined>(undefined)

  const { data, isLoading, isError } = useWalletTransactions({ page, limit, type })

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "deposit":
        return "bg-green-500"
      case "withdrawal":
        return "bg-blue-500"
      case "escrow_payment":
        return "bg-yellow-500"
      case "escrow_refund":
        return "bg-purple-500"
      case "escrow_release":
        return "bg-teal-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      case "processing":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-muted-foreground">Failed to load transactions</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Select value={type || "all"} onValueChange={(value) => setType(value === "all" ? undefined : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="DEPOSIT">Deposit</SelectItem>
            <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
            <SelectItem value="ESCROW_PAYMENT">Escrow Payment</SelectItem>
            <SelectItem value="ESCROW_REFUND">Escrow Refund</SelectItem>
            <SelectItem value="ESCROW_RELEASE">Escrow Release</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium">
          <div>Type</div>
          <div>Amount</div>
          <div className="hidden md:block">Date</div>
          <div>Status</div>
          <div>Description</div>
        </div>
        <div className="divide-y">
          {isLoading ? (
            Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 p-4 text-sm">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32 hidden md:block" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))
          ) : data?.data.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            data?.data.map((transaction) => (
              <div key={transaction.id} className="grid grid-cols-5 gap-4 p-4 text-sm">
                <div>
                  <Badge variant="outline" className={`${getTypeColor(transaction.type)} text-white`}>
                    {transaction.type.replace("_", " ")}
                  </Badge>
                </div>
                <div className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(transaction.amount)}
                </div>
                <div className="hidden md:block">{formatDate(transaction.createdAt)}</div>
                <div>
                  <Badge variant="outline" className={`${getStatusColor(transaction.status)} text-white`}>
                    {transaction.status}
                  </Badge>
                </div>
                <div className="truncate">{transaction.description}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {data && data.meta.totalPages > 1 && (
        <Pagination currentPage={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
