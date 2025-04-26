import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"

interface WalletTransaction {
  id: string
  amount: number
  type: string
  status: string
  description: string
  reference: string
  createdAt: string
  updatedAt: string
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

interface UseWalletTransactionsParams {
  page?: number
  limit?: number
  type?: string
}

export function useWalletTransactions({ page = 1, limit = 10, type }: UseWalletTransactionsParams = {}) {
  return useQuery<PaginatedResponse<WalletTransaction>>({
    queryKey: ["wallet-transactions", { page, limit, type }],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      if (type) params.append("type", type)

      const response = await apiClient.get(`/wallet/transactions?${params.toString()}`)
      return response.data
    },
  })
}
