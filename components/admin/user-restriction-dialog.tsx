"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import type { RestrictionReason } from "@/types/restrictions";

interface UserRestrictionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onRestrictionApplied: () => void;
}

export function UserRestrictionDialog({
  isOpen,
  onClose,
  userId,
  userName,
  onRestrictionApplied,
}: UserRestrictionDialogProps) {
  const [reason, setReason] = useState<RestrictionReason>(
    "SUSPICIOUS_ACTIVITY"
  );
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason for the restriction");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/users/restrictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          reason,
          details,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply restriction");
      }

      toast.success("User restricted successfully");
      onRestrictionApplied();
      onClose();
    } catch (error) {
      console.error("Error applying restriction:", error);
      toast.error("Failed to apply restriction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Restrict User Account
          </DialogTitle>
          <DialogDescription>
            This will restrict {userName}'s access to the platform. They will be
            notified of this action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Restriction</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as RestrictionReason)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="SUSPICIOUS_ACTIVITY">
                  Suspicious Activity
                </SelectItem>
                <SelectItem value="PAYMENT_FRAUD">Payment Fraud</SelectItem>
                <SelectItem value="TERMS_VIOLATION">
                  Terms of Service Violation
                </SelectItem>
                <SelectItem value="IDENTITY_VERIFICATION">
                  Failed Identity Verification
                </SelectItem>
                <SelectItem value="MULTIPLE_ACCOUNTS">
                  Multiple Account Creation
                </SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details</Label>
            <Textarea
              id="details"
              placeholder="Provide specific details about the restriction..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? "Restricting..." : "Restrict Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
