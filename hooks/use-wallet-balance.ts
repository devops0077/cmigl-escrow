import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface WalletBalanceResponse {
  balance: number;
  escrowAmount: number;
}

export function useWalletBalance() {
  return useQuery<WalletBalanceResponse>({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      const response = await apiClient.get("/wallet/balance");
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}
