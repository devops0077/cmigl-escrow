"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { getAllTransactions } from "@/lib/admin-actions"
import { Search } from "lucide-react"

interface Transaction {
  id: string
  amount: number
  escrowFee: number
  status: string
  createdAt: string
  productCategory: string
  buyerName: string
  sellerName: string
}

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getAllTransactions()
        setTransactions(data)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

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

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.productCategory.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || transaction.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

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
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium">
          <div>ID</div>
          <div>Buyer</div>
          <div>Seller</div>
          <div>Amount</div>
          <div>Fee</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="grid grid-cols-7 gap-4 p-4 text-sm">
              <div className="truncate">{transaction.id.slice(0, 8)}</div>
              <div className="truncate">{transaction.buyerName}</div>
              <div className="truncate">{transaction.sellerName}</div>
              <div>{formatCurrency(transaction.amount)}</div>
              <div>{formatCurrency(transaction.escrowFee)}</div>
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
    </div>
  )
}
