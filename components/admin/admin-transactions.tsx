"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Search, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "../ui/scroll-area";

interface Transaction {
  id: string;
  amount: number;
  escrowFee: number;
  status: string;
  createdAt: string;
  productCategory: string;
  buyerName: string;
  sellerName: string;
}

interface AdminTransactionsProps {
  showAll?: boolean;
  limit?: number;
}

export function AdminTransactions({
  showAll = false,
  limit = 5,
}: AdminTransactionsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = showAll ? 10 : limit;
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(e.target.value);
      setPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "admin-transactions",
      { page, pageSize, status: statusFilter, search: debouncedSearch },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await apiClient.get(
        `/admin/transactions?${params.toString()}`
      );
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "confirmed":
        return "bg-teal-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading && !showAll) {
    return (
      <div className="space-y-4">
        {Array.from({ length: pageSize }).map((_, i) => (
          <div
            key={i}
            className="flex justify-between items-center p-2 border-b"
          >
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center p-4">
        <p className="text-muted-foreground">Failed to load transactions</p>
      </div>
    );
  }

  // Mobile card view
  const renderMobileView = () => {
    if (!data?.data || data.data.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 md:hidden">
        {data.data.map((transaction: Transaction) => (
          <Card key={transaction.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between bg-muted/50 p-3 border-b">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Transaction ID
                  </span>
                  <span className="font-medium">
                    {transaction.id.slice(0, 8)}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(transaction.status)} text-white`}
                >
                  {transaction.status}
                </Badge>
              </div>
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Buyer</p>
                    <p className="truncate font-medium">
                      {transaction.buyerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Seller</p>
                    <p className="truncate font-medium">
                      {transaction.sellerName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fee</p>
                    <p className="font-medium">
                      {formatCurrency(transaction.escrowFee)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 flex justify-end border-t">
                  <Link href={`/dashboard/transactions/${transaction.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center"
                    >
                      View Details
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Desktop table view
  const renderDesktopView = () => {
    return (
      <div className="rounded-md border hidden md:block">
        <ScrollArea className="h-[400px] w-full overflow-auto">
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
            {data?.data.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              data?.data.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-7 gap-4 p-4 text-sm"
                >
                  <div className="truncate">{transaction.id.slice(0, 8)}</div>
                  <div className="truncate">{transaction.buyerName}</div>
                  <div className="truncate">{transaction.sellerName}</div>
                  <div>{formatCurrency(transaction.amount)}</div>
                  <div>{formatCurrency(transaction.escrowFee)}</div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(
                        transaction.status
                      )} text-white`}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <Link href={`/dashboard/transactions/${transaction.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {showAll && (
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transactions..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="md:hidden">
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          ))}
          <div className="hidden md:block">
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
                {Array.from({ length: pageSize }).map((_, i) => (
                  <div key={i} className="grid grid-cols-7 gap-4 p-4 text-sm">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                    <div className="text-right">
                      <Skeleton className="h-8 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {renderMobileView()}
          {renderDesktopView()}
        </>
      )}

      {showAll && data && data.meta.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
