"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentTransactionsProps {
  showAll?: boolean;
  limit?: number;
}

export function RecentTransactions({
  showAll = false,
  limit = 5,
}: RecentTransactionsProps) {
  const [page, setPage] = useState(1);
  const pageSize = showAll ? 10 : limit;

  const { data, isLoading, isError } = useTransactions({
    page,
    limit: pageSize,
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-muted-foreground">Failed to load transactions</p>
        <Link href="/dashboard/transactions/new">
          <Button size="sm" className="mt-2">
            Start a new transaction
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium">
            <div>Type</div>
            <div>Amount</div>
            <div className="hidden md:block">Date</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 p-4 text-sm">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-32 hidden md:block" />
                <Skeleton className="h-5 w-20" />
                <div className="text-right">
                  <Skeleton className="h-8 w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data?.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="mb-2 text-muted-foreground">No transactions found</p>
        <Link href="/dashboard/transactions/new">
          <Button size="sm">Start a new transaction</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium">
          <div>Type</div>
          <div>Amount</div>
          <div className="hidden md:block">Date</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y">
          {data?.data.map((transaction) => (
            <div
              key={transaction.id}
              className="grid grid-cols-5 gap-4 p-4 text-sm"
            >
              <div className="truncate">
                <span className="font-medium">{transaction.type}</span>
                <span className="block text-xs text-muted-foreground">
                  with {transaction.counterpartyName}
                </span>
              </div>
              <div>{formatCurrency(transaction.amount)}</div>
              <div className="hidden md:block">
                {formatDate(transaction.createdAt)}
              </div>
              <div>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(transaction.status)} text-white`}
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
          ))}
        </div>
      </div>

      {showAll && data && data.meta.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {!showAll && data && data.data.length > 0 && (
        <div className="text-center">
          <Link href="/dashboard/transactions">
            <Button variant="outline" size="sm">
              View all transactions
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
