"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getUserTransactions } from "@/lib/data-actions"

interface Transaction {
  id: string
  amount: number
  status: string
  createdAt: string
  type: string
  counterpartyName: string
}

interface RecentTransactionsProps {
  showAll?: boolean
}

export function RecentTransactions({ showAll = false }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getUserTransactions(showAll ? 100 : 5)
        setTransactions(data)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [showAll])

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
      case "shipped":
        return "bg-purple-500"
      case "confirmed":
        return "bg-teal-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading transactions...</div>
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="mb-2 text-muted-foreground">No transactions found</p>
        <Link href="/transactions/new">
          <Button size="sm">Start a new transaction</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium">
          <div>Type</div>
          <div>Amount</div>
          <div className="hidden md:block">Date</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="grid grid-cols-5 gap-4 p-4 text-sm">
              <div className="truncate">
                <span className="font-medium">{transaction.type}</span>
                <span className="block text-xs text-muted-foreground">with {transaction.counterpartyName}</span>
              </div>
              <div>{formatCurrency(transaction.amount)}</div>
              <div className="hidden md:block">{formatDate(transaction.createdAt)}</div>
              <div>
                <Badge variant="outline" className={`${getStatusColor(transaction.status)} text-white`}>
                  {transaction.status}
                </Badge>
              </div>
              <div className="text-right">
                <Link href={`/transactions/${transaction.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      {!showAll && transactions.length > 0 && (
        <div className="text-center">
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              View all transactions
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
