"use client";

import type React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { Download, Filter, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "@/lib/api-client";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { columns as escrowFeeColumns } from "@/components/admin/columns/escrow-fee-columns";
import { columns as registrationFeeColumns } from "@/components/admin/columns/registration-fee-columns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

export function AdminRevenueManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [feeType, setFeeType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch revenue summary data
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["admin-revenue-summary"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/revenue/summary");
      return response.data;
    },
  });

  // Fetch revenue details with filters
  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: [
      "admin-revenue",
      { page, pageSize, feeType, dateRange, searchQuery, statusFilter },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      if (feeType !== "all") params.append("type", feeType);
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);

      if (dateRange.from) {
        params.append("startDate", dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.append("endDate", dateRange.to.toISOString());
      }

      const response = await apiClient.get(
        `/admin/revenue?${params.toString()}`
      );
      return response.data;
    },
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setDateRange({});
    setFeeType("all");
    setStatusFilter("all");
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleExportData = async () => {
    try {
      const params = new URLSearchParams();

      if (feeType !== "all") params.append("type", feeType);
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);

      if (dateRange.from) {
        params.append("startDate", dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.append("endDate", dateRange.to.toISOString());
      }

      const response = await apiClient.get(
        `/admin/revenue/export?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `revenue-report-${new Date().toISOString().split("T")[0]}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const renderSummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <span className="h-4 w-4 text-muted-foreground">₦</span>
        </CardHeader>
        <CardContent>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData?.totalRevenue || 0)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Escrow Fees</CardTitle>
          <PercentIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData?.totalEscrowFees || 0)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Registration Fees
          </CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData?.totalRegistrationFees || 0)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData?.currentMonthRevenue || 0)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="grid gap-4 md:gap-8 px-4 md:px-8">
      {renderSummaryCards()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 gap-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="escrow-fees">Escrow Fees</TabsTrigger>
            <TabsTrigger value="registration-fees">
              Registration Fees
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="">
                <SheetHeader>
                  <SheetTitle>Filter Revenue</SheetTitle>
                  <SheetDescription>
                    Apply filters to narrow down revenue data
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 px-4 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="fee-type" className="text-sm font-medium">
                      Fee Type
                    </label>
                    <Select value={feeType} onValueChange={setFeeType}>
                      <SelectTrigger className="w-full" id="fee-type">
                        <SelectValue
                          className="w-full"
                          placeholder="Select fee type"
                        />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="all">All Fee Types</SelectItem>
                        <SelectItem value="escrow">Escrow Fees</SelectItem>
                        <SelectItem value="registration">
                          Registration Fees
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">
                      Status
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full" id="status">
                        <SelectValue
                          className="w-full"
                          placeholder="Select status"
                        />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <DatePickerWithRange
                      date={dateRange}
                      setDate={setDateRange}
                    />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline" onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button>Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={handleExportData}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-sm items-center mb-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by transaction ID or user..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" variant="ghost" className="ml-2">
            Search
          </Button>
        </form>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>
                Monthly breakdown of platform revenue
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {isSummaryLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <RevenueChart data={summaryData?.chartData || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escrow-fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escrow Fee Details</CardTitle>
              <CardDescription>
                All escrow fees collected from transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRevenueLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                revenueData?.escrowFees && (
                  <DataTable
                    columns={escrowFeeColumns}
                    data={revenueData.escrowFees}
                    pagination={{
                      currentPage: page,
                      totalPages: revenueData.meta?.totalPages || 1,
                      onPageChange: setPage,
                    }}
                  />
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration-fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Fee Details</CardTitle>
              <CardDescription>
                All registration fees collected from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRevenueLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                revenueData?.registrationFees && (
                  <DataTable
                    columns={registrationFeeColumns}
                    data={revenueData.registrationFees}
                    pagination={{
                      currentPage: page,
                      totalPages: revenueData.meta?.totalPages || 1,
                      onPageChange: setPage,
                    }}
                  />
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DollarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="2" x2="12" y2="22"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}

function PercentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" x2="5" y1="5" y2="19"></line>
      <circle cx="6.5" cy="6.5" r="2.5"></circle>
      <circle cx="17.5" cy="17.5" r="2.5"></circle>
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
      <line x1="16" x2="16" y1="2" y2="6"></line>
      <line x1="8" x2="8" y1="2" y2="6"></line>
      <line x1="3" x2="21" y1="10" y2="10"></line>
    </svg>
  );
}
