"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Settings,
  CreditCard,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Send,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface UserDetails {
  id: string;
  email: string | null;
  role: string;
  isActive: boolean;
  restricted: boolean;
  emailVerified: string | null;
  registrationFee: {
    id: string;
    amount: number;
    paid: boolean;
    reference: string | null;
  } | null;
}

interface UserAccountSectionProps {
  user: UserDetails;
}

export function UserAccountSection({ user }: UserAccountSectionProps) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Manual email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/users/${user.id}/verify-email`, {
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
        queryKey: ["admin-user-details", user.id],
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
        `/api/admin/users/${user.id}/resend-verification`,
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
      const response = await fetch(`/api/admin/users/${user.id}/activation`, {
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
        queryKey: ["admin-user-details", user.id],
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
        `/api/admin/users/${user.id}/registration-fee`,
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
        queryKey: ["admin-user-details", user.id],
      });
    },
    onError: (error) => {
      toast.error("Failed to update registration fee", {
        description: error.message,
      });
    },
  });

  const isEmailVerified = !!user.emailVerified;
  const isRegistrationFeePaid = user.registrationFee?.paid || false;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage account status and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Activation */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="account-active">Account Active</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable user account access
              </p>
            </div>
            <Switch
              id="account-active"
              checked={user.isActive}
              onCheckedChange={(checked) =>
                toggleActivationMutation.mutate(checked)
              }
              disabled={toggleActivationMutation.isPending}
            />
          </div>

          <Separator />

          {/* Role Display */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>User Role</Label>
              <p className="text-sm text-muted-foreground">
                Current user role and permissions
              </p>
            </div>
            <Badge variant={user.role === "ADMIN" ? "secondary" : "outline"}>
              {user.role}
            </Badge>
          </div>

          <Separator />

          {/* Restriction Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Account Status</Label>
              <p className="text-sm text-muted-foreground">
                Current restriction status
              </p>
            </div>
            <Badge variant={user.restricted ? "destructive" : "default"}>
              {user.restricted ? (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Restricted
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Email Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Verification
          </CardTitle>
          <CardDescription>Manage email verification status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Email Address</span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Verification Status</span>
            <Badge variant={isEmailVerified ? "default" : "destructive"}>
              {isEmailVerified ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Unverified
                </>
              )}
            </Badge>
          </div>

          {!isEmailVerified && (
            <div className="pt-4 space-y-2">
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  This user's email is not verified
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => verifyEmailMutation.mutate()}
                  disabled={verifyEmailMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {verifyEmailMutation.isPending
                    ? "Verifying..."
                    : "Verify Now"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resendVerificationMutation.mutate()}
                  disabled={resendVerificationMutation.isPending}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {resendVerificationMutation.isPending
                    ? "Sending..."
                    : "Resend Email"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Fee Management */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registration Fee Management
          </CardTitle>
          <CardDescription>Manage user registration fee status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fee Amount</span>
                <span className="text-sm font-bold">
                  {formatCurrency(user.registrationFee?.amount || 500)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Status</span>
                <Badge
                  variant={isRegistrationFeePaid ? "default" : "destructive"}
                >
                  {isRegistrationFeePaid ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Paid
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Unpaid
                    </>
                  )}
                </Badge>
              </div>
              {user.registrationFee?.reference && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Reference</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {user.registrationFee.reference}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <Button
                variant={isRegistrationFeePaid ? "destructive" : "default"}
                onClick={() =>
                  updateRegistrationFeeMutation.mutate(!isRegistrationFeePaid)
                }
                disabled={updateRegistrationFeeMutation.isPending}
                className="w-full"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {updateRegistrationFeeMutation.isPending
                  ? "Updating..."
                  : `Mark as ${isRegistrationFeePaid ? "Unpaid" : "Paid"}`}
              </Button>
              {!isRegistrationFeePaid && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Marking as paid will activate the user's account
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
