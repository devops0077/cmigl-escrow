import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"

interface Transaction {
  id: string
  amount: number
  escrowFee: number
  status: string
  createdAt: string
  updatedAt: string
  productCategory: string
  productDetails: string
  type: string
  counterpartyName: string
  isBuyer: boolean
  isSeller: boolean
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

interface UseTransactionsParams {
  page?: number
  limit?: number
  status?: string
  search?: string
}

export function useTransactions({ page = 1, limit = 10, status, search }: UseTransactionsParams = {}) {
  return useQuery<PaginatedResponse<Transaction>>({
    queryKey: ["transactions", { page, limit, status, search }],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      if (status) params.append("status", status)
      if (search) params.append("search", search)

      const response = await apiClient.get(`/transactions?${params.toString()}`)
      return response.data
    },
  })
}
