"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    <div className="space-y-4 w-full">
      <div className="rounded-md border w-full overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium line-clamp-1">
                    {transaction.type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    with {transaction.counterpartyName}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDate(transaction.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(transaction.status)} text-white`}
                  >
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/transactions/${transaction.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
