"use client";

import { useState, useEffect } from "react";
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
import { TransactionFeedback } from "./transaction-feedback";
import { DisputeForm } from "./dispute-form";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

export function TransactionDetails({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: transaction, isLoading, isError } = useTransaction(id);

  // Check if we should show feedback prompt when transaction is completed
  useEffect(() => {
    if (transaction?.status === "COMPLETED" && !transaction?.feedback) {
      // Show feedback prompt after a short delay
      const timer = setTimeout(() => {
        setShowFeedbackPrompt(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [transaction]);

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

      // If transaction was completed, show feedback prompt
      if (updateStatusMutation.variables === "COMPLETED") {
        setShowFeedbackPrompt(true);
      }
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
      case "disputed":
        return "bg-orange-500";
      case "resolved":
        return "bg-emerald-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleOpenFeedback = () => {
    setFeedbackOpen(true);
    setShowFeedbackPrompt(false);
  };

  const handleOpenDispute = () => {
    setDisputeOpen(true);
  };

  const handleOpenImagePreview = (url: string) => {
    setImagePreviewUrl(url);
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
  const canAdminMarkAsConfirmed = isAdmin && transaction.status === "SHIPPED";
  const canInitiateDispute =
    (transaction.isBuyer || transaction.isSeller) &&
    ["PENDING", "SHIPPED", "CONFIRMED"].includes(transaction.status) &&
    !transaction.hasDispute;
  const canResolveDispute = isAdmin && transaction.status === "DISPUTED";

  // Determine which party to show feedback for
  const feedbackReceiverId = transaction.isBuyer
    ? transaction.sellerId
    : transaction.buyerId;

  // Check if this transaction has a resolved dispute
  const hasResolvedDispute =
    transaction.dispute && transaction.dispute.status === "RESOLVED";

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
        {/* Dispute Resolution Alert - Show if dispute was resolved */}
        {hasResolvedDispute && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">
              Dispute Resolved
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              This transaction had a dispute that has been resolved by an
              administrator.
            </AlertDescription>
          </Alert>
        )}

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

              {transaction.hasDispute && !hasResolvedDispute && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-orange-500">
                      Dispute Status
                    </p>
                    <p className="text-orange-500">
                      This transaction is currently under dispute
                    </p>
                  </div>
                </>
              )}
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
                {/* {canCompleteTransaction && (
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate("COMPLETED")}
                    disabled={isUpdating}
                  >
                    {isUpdating
                      ? "Updating..."
                      : "Release Funds to Seller (Admin Only)"}
                  </Button>
                )} */}
                {canMarkAsFailed && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleStatusUpdate("FAILED")}
                    disabled={isUpdating}
                  >
                    {isUpdating
                      ? "Updating..."
                      : "Mark as Failed (Refund Buyer) (Admin Only)"}
                  </Button>
                )}
                {canAdminMarkAsConfirmed && (
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate("CONFIRMED")}
                    disabled={isUpdating}
                  >
                    {isUpdating
                      ? "Updating..."
                      : "Mark as Confirmed (Admin Only)"}
                  </Button>
                )}
                {canInitiateDispute && (
                  <Button
                    variant="outline"
                    className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                    onClick={handleOpenDispute}
                  >
                    Initiate Dispute
                  </Button>
                )}
                {canResolveDispute && (
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() =>
                      router.push(`/admin/disputes/${transaction.dispute.id}`)
                    }
                  >
                    Resolve Dispute (Admin)
                  </Button>
                )}
                {transaction.status === "COMPLETED" &&
                  !transaction.feedback && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleOpenFeedback}
                    >
                      Leave Feedback
                    </Button>
                  )}
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Dispute Resolution Details - Show if dispute was resolved */}
        {hasResolvedDispute && transaction.dispute && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Dispute Resolution</CardTitle>
              <CardDescription>
                Details about how this dispute was resolved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Dispute Reason</h4>
                <p className="text-sm">{transaction.dispute.reason}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">
                  Dispute Description
                </h4>
                <p className="text-sm whitespace-pre-wrap">
                  {transaction.dispute.description}
                </p>
              </div>

              {transaction.dispute.evidence && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Evidence</h4>
                  <div
                    className="relative h-40 w-40 cursor-pointer border rounded-md overflow-hidden"
                    onClick={() =>
                      handleOpenImagePreview(transaction.dispute.evidence!)
                    }
                  >
                    <Image
                      src={transaction.dispute.evidence || "/placeholder.svg"}
                      alt="Dispute evidence"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Resolution Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Buyer Allocation</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(transaction.dispute.buyerAmount || 0)}
                    </p>
                    {transaction.dispute.buyerAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(
                          (transaction.dispute.buyerAmount /
                            transaction.amount) *
                          100
                        ).toFixed(0)}
                        % of transaction amount
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">
                      Seller Allocation
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(transaction.dispute.sellerAmount || 0)}
                    </p>
                    {transaction.dispute.sellerAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(
                          (transaction.dispute.sellerAmount /
                            transaction.amount) *
                          100
                        ).toFixed(0)}
                        % of transaction amount
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {transaction.dispute.adminNotes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Admin Notes</h4>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Resolution Notes</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap">
                      {transaction.dispute.adminNotes}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">
                  Resolution Timeline
                </h4>
                <div className="text-sm space-y-2">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      Disputed
                    </Badge>
                    <span>{formatDate(transaction.dispute.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge
                      variant="outline"
                      className="mr-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    >
                      Resolved
                    </Badge>
                    <span>
                      {formatDate(
                        transaction.dispute.resolvedAt ||
                          transaction.dispute.updatedAt
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </FadeIn>

      {/* Feedback UI - Responsive (Drawer for mobile, Dialog for desktop) */}
      {isMobile ? (
        <Drawer
          open={feedbackOpen || showFeedbackPrompt}
          onOpenChange={setFeedbackOpen}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Transaction Feedback</DrawerTitle>
              <DrawerDescription>
                Share your experience with this transaction
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <TransactionFeedback
                transactionId={transaction.id}
                receiverId={feedbackReceiverId}
                onClose={() => {
                  setFeedbackOpen(false);
                  setShowFeedbackPrompt(false);
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={feedbackOpen || showFeedbackPrompt}
          onOpenChange={setFeedbackOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Feedback</DialogTitle>
              <DialogDescription>
                Share your experience with this transaction
              </DialogDescription>
            </DialogHeader>
            <TransactionFeedback
              transactionId={transaction.id}
              receiverId={feedbackReceiverId}
              onClose={() => {
                setFeedbackOpen(false);
                setShowFeedbackPrompt(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dispute UI - Responsive (Drawer for mobile, Dialog for desktop) */}
      {isMobile ? (
        <Drawer open={disputeOpen} onOpenChange={setDisputeOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Initiate Dispute</DrawerTitle>
              <DrawerDescription>
                Please provide details about your dispute
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <DisputeForm
                transactionId={transaction.id}
                onClose={() => setDisputeOpen(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate Dispute</DialogTitle>
              <DialogDescription>
                Please provide details about your dispute
              </DialogDescription>
            </DialogHeader>
            <DisputeForm
              transactionId={transaction.id}
              onClose={() => setDisputeOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!imagePreviewUrl}
        onOpenChange={() => setImagePreviewUrl(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Evidence Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-[60vh] w-full">
            {imagePreviewUrl && (
              <Image
                src={imagePreviewUrl || "/placeholder.svg"}
                alt="Dispute evidence"
                fill
                className="object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
