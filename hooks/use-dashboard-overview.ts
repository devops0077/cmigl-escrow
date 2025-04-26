import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface ChartDataPoint {
  name: string;
  total: number;
  isIncome?: boolean;
}

interface DashboardOverviewData {
  chartData: ChartDataPoint[];
  walletBalance: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalTransactions: number;
  inEscrow: number;
}

export function useDashboardOverview() {
  return useQuery<DashboardOverviewData>({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const response = await apiClient.get("/dashboard/overview");
      return response.data;
    },
  });
}
