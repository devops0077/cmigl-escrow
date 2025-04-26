import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface WalletData {
  balance: number;
}

export function useWallet() {
  return useQuery<WalletData>({
    queryKey: ["wallet"],
    queryFn: async () => {
      const response = await apiClient.get("/wallet");
      return response.data;
    },
  });
}
