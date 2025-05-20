"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

export interface EscrowFeeData {
  id: string;
  transactionId: string;
  amount: number;
  feeAmount: number;
  status: string;
  createdAt: string;
  buyerName: string;
  sellerName: string;
}

export const columns: ColumnDef<EscrowFeeData>[] = [
  {
    accessorKey: "transactionId",
    header: "Transaction ID",
    cell: ({ row }) => {
      const id = row.getValue("transactionId") as string;
      return <span className="font-medium">{id.slice(0, 8)}</span>;
    },
  },
  {
    accessorKey: "buyerName",
    header: "Buyer",
    cell: ({ row }) => {
      return (
        <span className="truncate max-w-[120px] block">
          {row.getValue("buyerName")}
        </span>
      );
    },
  },
  {
    accessorKey: "sellerName",
    header: "Seller",
    cell: ({ row }) => {
      return (
        <span className="truncate max-w-[120px] block">
          {row.getValue("sellerName")}
        </span>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Transaction Amount",
    cell: ({ row }) => {
      return formatCurrency(row.getValue("amount"));
    },
  },
  {
    accessorKey: "feeAmount",
    header: "Fee Amount",
    cell: ({ row }) => {
      return formatCurrency(row.getValue("feeAmount"));
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "PAID"
              ? "success"
              : status === "PENDING"
                ? "outline"
                : "default"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      return formatDate(row.getValue("createdAt"));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transactionId = row.getValue("transactionId") as string;
      return (
        <Link href={`/dashboard/transactions/${transactionId}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>
      );
    },
  },
];
