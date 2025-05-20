"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

export interface RegistrationFeeData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: string;
  reference: string;
  createdAt: string;
  paidAt: string | null;
}

export const columns: ColumnDef<RegistrationFeeData>[] = [
  {
    accessorKey: "userName",
    header: "User",
    cell: ({ row }) => {
      return (
        <span className="font-medium truncate max-w-[120px] block">
          {row.getValue("userName")}
        </span>
      );
    },
  },
  {
    accessorKey: "userEmail",
    header: "Email",
    cell: ({ row }) => {
      return (
        <span className="truncate max-w-[180px] block">
          {row.getValue("userEmail")}
        </span>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      return formatCurrency(row.getValue("amount"));
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
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => {
      const reference = row.getValue("reference") as string;
      return reference ? (
        <span className="font-mono text-xs">{reference.slice(0, 10)}...</span>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      return formatDate(row.getValue("createdAt"));
    },
  },
  {
    accessorKey: "paidAt",
    header: "Paid Date",
    cell: ({ row }) => {
      const paidAt = row.getValue("paidAt");
      return paidAt ? formatDate(paidAt as string) : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const userId = row.getValue("userId") as string;
      return (
        <Link href={`/admin/users/${userId}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View User
          </Button>
        </Link>
      );
    },
  },
];
