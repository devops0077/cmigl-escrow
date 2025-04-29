import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface ChartDataPoint {
  name: string;
  total: number;
}

interface AdminDashboardOverviewData {
  chartData: ChartDataPoint[];
  totalUsers: number;
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalEscrowFees: number;
  totalRegistrationFees: number;
  newUsers: number;
}

export function useAdminDashboardOverview() {
  return useQuery<AdminDashboardOverviewData>({
    queryKey: ["admin-dashboard-overview"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/dashboard/overview");
      return response.data;
    },
  });
}
