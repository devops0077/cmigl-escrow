"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FadeIn } from "@/components/animations/fade-in";
import { useSession } from "next-auth/react";
import { useTransaction } from "@/hooks/use-transaction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function TransactionDetails({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const { data: transaction, isLoading, isError } = useTransaction(id);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiClient.patch(`/transactions/${id}/status`, {
        status: newStatus,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync(newStatus);

      toast.success("Status updated", {
        description: `Transaction status updated to ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Update failed", {
        description:
          error instanceof Error
            ? error.message
            : "There was a problem updating the status.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-6 w-40" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-px w-full" />
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
            <div className="px-6 pb-6">
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <>
        <DashboardHeader
          heading="Transaction Not Found"
          text="The transaction you're looking for doesn't exist or you don't have permission to view it."
        />
        <Button onClick={() => router.push("/dashboard/transactions")}>
          Back to Transactions
        </Button>
      </>
    );
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const canMarkAsShipped =
    transaction.isSeller && transaction.status === "PENDING";
  const canConfirmReceipt =
    transaction.isBuyer && transaction.status === "SHIPPED";
  const canCompleteTransaction = isAdmin && transaction.status === "CONFIRMED";
  const canMarkAsFailed =
    isAdmin && ["PENDING", "SHIPPED", "CONFIRMED"].includes(transaction.status);

  return (
    <>
      <DashboardHeader
        heading={`Transaction #${transaction.id.slice(0, 8)}`}
        text={`Created on ${formatDate(transaction.createdAt)}`}
      >
        <Badge
          variant="outline"
          className={`${getStatusColor(transaction.status)} text-white`}
        >
          {transaction.status}
        </Badge>
      </DashboardHeader>
      <FadeIn>
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Details about this escrow transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-lg">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Escrow Fee</p>
                  <p className="text-lg">
                    {formatCurrency(transaction.escrowFee)}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Product Category</p>
                <p>{transaction.productCategory}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Product Details</p>
                <p className="whitespace-pre-wrap">
                  {transaction.productDetails}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p>{formatDate(transaction.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>Buyer and seller information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Buyer</p>
                <p>{transaction.buyer.name || transaction.buyer.username}</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.buyer.email}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Seller</p>
                <p>{transaction.seller.name || transaction.seller.username}</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.seller.email}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="w-full space-y-2">
                {canMarkAsShipped && (
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate("SHIPPED")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Mark as Shipped"}
                  </Button>
                )}
                {canConfirmReceipt && (
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate("CONFIRMED")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Confirm Receipt"}
                  </Button>
                )}
                {canCompleteTransaction && (
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate("COMPLETED")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Release Funds to Seller"}
                  </Button>
                )}
                {canMarkAsFailed && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleStatusUpdate("FAILED")}
                    disabled={isUpdating}
                  >
                    {isUpdating
                      ? "Updating..."
                      : "Mark as Failed (Refund Buyer)"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </FadeIn>
    </>
  );
}
