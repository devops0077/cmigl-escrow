"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
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
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getTransactionById,
  updateTransactionStatus,
} from "@/lib/data-actions";
import { toast } from "sonner";
import { TransactionStatus } from "@/lib/generated/prisma";

interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  escrowFee: number;
  productDetails: string;
  productCategory: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
  };
  seller: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
  };
  isBuyer: boolean;
  isSeller: boolean;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const transactionId = params.id as string;

  useEffect(() => {
    if (status === "authenticated") {
      const fetchTransaction = async () => {
        try {
          const data = await getTransactionById(transactionId);
          setTransaction(data);
        } catch (error) {
          console.error("Error fetching transaction:", error);
          toast.error("Error", {
            description: "Could not load transaction details.",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchTransaction();
    }
  }, [status, transactionId]);

  const handleStatusUpdate = async (newStatus: TransactionStatus) => {
    if (!transaction) return;

    setIsUpdating(true);
    try {
      await updateTransactionStatus({
        transactionId: transaction.id,
        status: newStatus,
      });

      toast.success("Status updated", {
        description: `Transaction status updated to ${newStatus.toLowerCase()}.`,
      });

      // Refresh transaction data
      const updatedTransaction = await getTransactionById(transactionId);
      setTransaction(updatedTransaction);
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

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect(`/auth/login?callbackUrl=/transactions/${transactionId}`);
  }

  if (!transaction) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Transaction Not Found"
          text="The transaction you're looking for doesn't exist or you don't have permission to view it."
        />
        <Button onClick={() => router.push("/transactions")}>
          Back to Transactions
        </Button>
      </DashboardShell>
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
      <div className="grid gap-6 md:grid-cols-2">
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
                <p className="text-lg">{formatCurrency(transaction.amount)}</p>
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
                  {isUpdating ? "Updating..." : "Mark as Failed (Refund Buyer)"}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
