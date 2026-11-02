"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  User,
  Calendar,
  Wallet,
  CreditCard,
  Shield,
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  DollarSign,
  Ban,
  UserCheck,
  Edit,
  MessageSquare,
} from "lucide-react";
import { UserProfileSection } from "@/components/admin/user-profile-section";
import { UserAccountSection } from "@/components/admin/user-account-section";
import { UserWalletSection } from "@/components/admin/user-wallet-section";
import { UserTransactionsSection } from "@/components/admin/user-transactions-section";
import { UserActivitySection } from "@/components/admin/user-activity-section";
import { UserRestrictionsSection } from "@/components/admin/user-restrictions-section";
import { UserEditDialog } from "@/components/admin/user-edit-dialog";
import { UserRestrictionDialog } from "@/components/admin/user-restriction-dialog";
import { getInitials, formatCurrency } from "@/lib/utils";
import { UserMessagesSection } from "@/components/admin/user-messages-section";
import { RealTimeMessageCenter } from "@/components/messages/real-time-message-center";
import { EnhancedMessageCenter } from "@/components/messages/enhanced-message-center";
import { useUpdateParams } from "@/hooks/use-update-params";

interface UserDetails {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  image: string | null;
  role: string;
  status: string;
  isActive: boolean;
  restricted: boolean;
  emailVerified: boolean;
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  walletBalance: number;
  escrowBalance: number;
  transactionCount: number;
  registrationFee: {
    id: string;
    amount: number;
    paid: boolean;
    reference: string | null;
  } | null;
  lastLogin: string | null;
  bio: string | null;
  address: string | null;
}

export default function AdminUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "profile";
  const { updateParam } = useUpdateParams();

  const handleSetTab = (e: string) => {
    updateParam("tab", e);
  };

  // Fetch user details
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<UserDetails>({
    queryKey: ["admin-user-details", userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/details`);
      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }
      const data = await response.json();
      return data.user;
    },
  });

  // Manual email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/verify-email`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to verify email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Email verified successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin-user-details", userId],
      });
    },
    onError: (error) => {
      toast.error("Failed to verify email", {
        description: error.message,
      });
    },
  });

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/admin/users/${userId}/resend-verification`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to resend verification email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Verification email sent successfully");
    },
    onError: (error) => {
      toast.error("Failed to send verification email", {
        description: error.message,
      });
    },
  });

  // Toggle account activation mutation
  const toggleActivationMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const response = await fetch(`/api/admin/users/${userId}/activation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: activate }),
      });
      if (!response.ok) {
        throw new Error("Failed to update account status");
      }
      return response.json();
    },
    onSuccess: (_, activate) => {
      toast.success(
        `Account ${activate ? "activated" : "deactivated"} successfully`
      );
      queryClient.invalidateQueries({
        queryKey: ["admin-user-details", userId],
      });
    },
    onError: (error) => {
      toast.error("Failed to update account status", {
        description: error.message,
      });
    },
  });

  // Registration fee management mutation
  const updateRegistrationFeeMutation = useMutation({
    mutationFn: async (paid: boolean) => {
      const response = await fetch(
        `/api/admin/users/${userId}/registration-fee`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paid }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update registration fee status");
      }
      return response.json();
    },
    onSuccess: (_, paid) => {
      toast.success(`Registration fee marked as ${paid ? "paid" : "unpaid"}`);
      queryClient.invalidateQueries({
        queryKey: ["admin-user-details", userId],
      });
    },
    onError: (error) => {
      toast.error("Failed to update registration fee", {
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="container mx-auto py-6 px-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              User Not Found
            </CardTitle>
            <CardDescription>
              The requested user could not be found or you don't have permission
              to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => router.back()}>Return to User List</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = user.name || user.username || "Anonymous User";
  const isEmailVerified = !!user.emailVerified;
  const isRegistrationFeePaid = user.registrationFee?.paid || false;

  return (
    <div className="container mx-auto py-6 px-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
      </Button>

      {/* User Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              {user.username && (
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user.restricted ? "destructive" : "default"}>
                  {user.restricted ? "Restricted" : "Active"}
                </Badge>
                <Badge
                  variant={user.role === "ADMIN" ? "secondary" : "outline"}
                >
                  {user.role}
                </Badge>
                {isEmailVerified ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Unverified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
            {!user.restricted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRestrictionDialogOpen(true)}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Ban className="h-4 w-4 mr-2" />
                Restrict User
              </Button>
            )}
            <Button
              variant={user.isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => toggleActivationMutation.mutate(!user.isActive)}
              disabled={toggleActivationMutation.isPending}
            >
              {user.isActive ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Wallet Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(user.walletBalance)}
            </div>
            {user.escrowBalance > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(user.escrowBalance)} in escrow
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.transactionCount}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registration Fee
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(user.registrationFee?.amount || 500)}
              </div>
              <Badge
                variant={isRegistrationFeePaid ? "default" : "destructive"}
              >
                {isRegistrationFeePaid ? "Paid" : "Unpaid"}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() =>
                updateRegistrationFeeMutation.mutate(!isRegistrationFeePaid)
              }
              disabled={updateRegistrationFeeMutation.isPending}
            >
              Mark as {isRegistrationFeePaid ? "Unpaid" : "Paid"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {format(new Date(user.createdAt), "MMM dd, yyyy")}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(user.createdAt), {
                addSuffix: true,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Verification Actions */}
      {!isEmailVerified && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Email Not Verified
            </CardTitle>
            <CardDescription className="text-orange-700">
              This user's email address has not been verified. You can manually
              verify it or resend the verification email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => verifyEmailMutation.mutate()}
                disabled={verifyEmailMutation.isPending}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {verifyEmailMutation.isPending
                  ? "Verifying..."
                  : "Verify Email"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resendVerificationMutation.mutate()}
                disabled={resendVerificationMutation.isPending}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Send className="h-4 w-4 mr-2" />
                {resendVerificationMutation.isPending
                  ? "Sending..."
                  : "Resend Verification"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs
        defaultValue="profile"
        value={tab}
        onValueChange={handleSetTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="restrictions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Restrictions
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <UserProfileSection user={user} />
        </TabsContent>

        <TabsContent value="account">
          <UserAccountSection user={user} />
        </TabsContent>

        <TabsContent value="wallet">
          <UserWalletSection userId={userId} />
        </TabsContent>

        <TabsContent value="transactions">
          <UserTransactionsSection userId={userId} />
        </TabsContent>

        <TabsContent value="activity">
          <UserActivitySection userId={userId} />
        </TabsContent>

        <TabsContent value="restrictions">
          <UserRestrictionsSection userId={userId} />
        </TabsContent>

        <TabsContent value="messages">
          <EnhancedMessageCenter
            isAdminView={true}
            recipientName={displayName}
            recipientId={userId}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UserEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={user}
        onUserUpdated={() => {
          queryClient.invalidateQueries({
            queryKey: ["admin-user-details", userId],
          });
          setIsEditDialogOpen(false);
        }}
      />

      <UserRestrictionDialog
        isOpen={isRestrictionDialogOpen}
        onClose={() => setIsRestrictionDialogOpen(false)}
        userId={userId}
        userName={displayName}
        onRestrictionApplied={() => {
          queryClient.invalidateQueries({
            queryKey: ["admin-user-details", userId],
          });
          setIsRestrictionDialogOpen(false);
        }}
      />
    </div>
  );
}

