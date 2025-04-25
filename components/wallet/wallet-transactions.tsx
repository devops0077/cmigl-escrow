"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getWalletTransactions } from "@/lib/wallet-actions"

interface WalletTransaction {
  id: string
  amount: number
  type: string
  status: string
  description: string
  createdAt: string
}

export function WalletTransactions() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getWalletTransactions()
        setTransactions(data)
      } catch (error) {
        console.error("Error fetching wallet transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

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

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading transactions...</div>
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-muted-foreground">No transactions found</p>
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
          <div>Description</div>
        </div>
        <div className="divide-y">
          {transactions.map((transaction) => (
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
          ))}
        </div>
      </div>
    </div>
  )
}
