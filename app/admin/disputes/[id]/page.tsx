import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDisputeById } from "@/lib/admin-actions";
import { DisputeResolutionForm } from "@/components/admin/dispute-resolution-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getTransactionById } from "@/lib/data-actions";

interface AdminDisputePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: AdminDisputePageProps): Promise<Metadata> {
  try {
    let dispute;
    dispute = await getDisputeById((await params).id);
    if (!dispute) {
      const trx = await getTransactionById((await params).id);
      dispute = await getDisputeById(trx.dispute?.id as string);
    }
    return {
      title: `Dispute #${dispute.id.slice(0, 8)} | Admin | CMIGL Escrow`,
      description: `Resolve dispute for transaction #${dispute.transaction.id.slice(0, 8)}`,
    };
  } catch (error) {
    return {
      title: "Dispute Not Found | Admin | CMIGL Escrow",
      description: "The requested dispute could not be found",
    };
  }
}

export default async function AdminDisputePage({
  params,
}: AdminDisputePageProps) {
  let dispute;

  try {
    dispute = await getDisputeById((await params).id);
    if (!dispute) {
      const trx = await getTransactionById((await params).id);
      dispute = await getDisputeById(trx.dispute?.id as string);
    }
  } catch (error) {
    console.log("Dispute LOG: ", error);
    notFound();
  }

  const { transaction, initiator } = dispute;
  const { buyer, seller } = transaction;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const isInitiatorBuyer = initiator.id === buyer.id;

  return (
    <>
      <DashboardHeader
        heading={`Dispute Resolution`}
        text={`Review and resolve dispute for transaction #
          ${transaction.id.slice(0, 8)}`}
      >
        <Badge
          variant="outline"
          className={`${getStatusColor(dispute.status)} text-white`}
        >
          {transaction.status}
        </Badge>
      </DashboardHeader>
      {/*  */}
      <div className="px-4 md:px-6 gap-4 flex flex-col">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Information about the disputed transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Transaction ID
                  </p>
                  <p className="font-medium">{transaction.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Amount
                  </p>
                  <p className="font-medium">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Escrow Fee
                  </p>
                  <p className="font-medium">
                    {formatCurrency(transaction.escrowFee)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    variant="outline"
                    className={getStatusColor(transaction.status)}
                  >
                    {transaction.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="font-medium">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Updated
                  </p>
                  <p className="font-medium">
                    {formatDate(transaction.updatedAt)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Product Details
                </p>
                <p className="font-medium">
                  {transaction.productDetails || "No details provided"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Product Category
                </p>
                <p className="font-medium">
                  {transaction.productCategory || "Not specified"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dispute Information</CardTitle>
              <CardDescription>Details about the dispute</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Dispute ID
                  </p>
                  <p className="font-medium">{dispute.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    variant="outline"
                    className={getStatusColor(dispute.status)}
                  >
                    {dispute.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="font-medium">{formatDate(dispute.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Initiated By
                  </p>
                  <p className="font-medium">
                    {isInitiatorBuyer ? "Buyer" : "Seller"} (
                    {initiator.name || initiator.username})
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Reason
                </p>
                <p className="font-medium">{dispute.reason}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="whitespace-pre-wrap">
                  {dispute.description || "No description provided"}
                </p>
              </div>

              {dispute.evidence && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Evidence
                  </p>
                  <div className="mt-2">
                    <a
                      href={dispute.evidence}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <img
                        src={dispute.evidence || "/placeholder.svg"}
                        alt="Dispute evidence"
                        className="max-h-40 rounded-md border object-cover"
                      />
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Buyer Information</CardTitle>
              <CardDescription>Details about the buyer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="font-medium">{buyer.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Username
                  </p>
                  <p className="font-medium">
                    {buyer.username || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="font-medium">{buyer.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="font-medium">{buyer.phone || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
              <CardDescription>Details about the seller</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="font-medium">{seller.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Username
                  </p>
                  <p className="font-medium">
                    {seller.username || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="font-medium">{seller.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="font-medium">
                    {seller.phone || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {dispute.status !== "RESOLVED" && (
          <Card>
            <CardHeader>
              <CardTitle>Resolve Dispute</CardTitle>
              <CardDescription>
                Determine how to resolve this dispute by allocating funds
                between the buyer and seller
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DisputeResolutionForm
                dispute={dispute}
                transactionAmount={transaction.amount}
              />
            </CardContent>
          </Card>
        )}

        {dispute.status === "RESOLVED" && dispute.resolvedAt && (
          <Card>
            <CardHeader>
              <CardTitle>Resolution Details</CardTitle>
              <CardDescription>This dispute has been resolved</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Resolved On
                  </p>
                  <p className="font-medium">
                    {formatDate(dispute.resolvedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Amount to Seller
                  </p>
                  <p className="font-medium">
                    {formatCurrency(dispute.sellerAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Amount to Buyer
                  </p>
                  <p className="font-medium">
                    {formatCurrency(dispute.buyerAmount || 0)}
                  </p>
                </div>
              </div>

              {dispute.adminNotes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Admin Notes
                  </p>
                  <p className="whitespace-pre-wrap">{dispute.adminNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
