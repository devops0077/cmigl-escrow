"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Plus, Search } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "../ui/button";
import Link from "next/link";

export function TransactionsOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <FadeIn>
      <div className="space-y-4">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transactions..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className=" w-full md:w-fit flex flex-row items-center justify-between space-x-2 md:space-x-0 md:justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild variant="outline" className="inline-flex md:hidden">
              <Link href="/dashboard/transactions/new">
                <Plus className="mr-2 h-4 w-4" />
                New Transaction
              </Link>
            </Button>
          </div>
        </div>
        <RecentTransactions showAll />
      </div>
    </FadeIn>
  );
}
