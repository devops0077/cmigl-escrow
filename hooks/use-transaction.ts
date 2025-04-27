import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  escrowFee: number;
  productDetails: string;
  productCategory: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
  };
  seller: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
  };
  isBuyer: boolean;
  isSeller: boolean;
}

export function useTransaction(id: string) {
  return useQuery<Transaction>({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const response = await apiClient.get(`/transactions/${id}`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true,
  });
}
