"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const disputeReasons = [
  "Product not as described",
  "Product not received",
  "Damaged product",
  "Incomplete order",
  "Counterfeit product",
  "Other",
];

export function DisputeForm({
  transactionId,
  onClose,
}: {
  transactionId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createDisputeMutation = useMutation({
    mutationFn: async (data: {
      reason: string;
      description: string;
      evidence?: string;
    }) => {
      const response = await apiClient.post(
        `/transactions/${transactionId}/disputes`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transaction", transactionId],
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Dispute submitted", {
        description: "Your dispute has been submitted and is under review.",
      });
      onClose();
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to submit dispute", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidence(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create form data for the file upload
      const formData = new FormData();
      formData.append("file", file);

      // Simulate upload progress (in a real app, you might use XHR for actual progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);

      // Upload the file to our API endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setUploadProgress(100);

      return data.url;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload evidence", {
        description: "Please try again or submit without evidence.",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error("Please select a reason for your dispute");
      return;
    }

    try {
      let evidenceUrl: string | undefined;

      if (evidence) {
        evidenceUrl = await uploadFile(evidence);
      }

      await createDisputeMutation.mutateAsync({
        reason,
        description,
        evidence: evidenceUrl,
      });
    } catch (error) {
      // Error is handled in the mutation callbacks
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reason">Reason for dispute</Label>
        <Select value={reason} onValueChange={setReason} required>
          <SelectTrigger className="w-full" id="reason">
            <SelectValue className="w-full" placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent className="w-full">
            {disputeReasons.map((reason) => (
              <SelectItem className="w-full" key={reason} value={reason}>
                {reason}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Please provide details about your dispute"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evidence">Evidence (optional)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="evidence"
            type="file"
            onChange={handleFileChange}
            className="flex-1"
            accept="image/*,.pdf"
          />
          {evidence && (
            <div className="text-sm text-muted-foreground truncate max-w-[150px]">
              {evidence.name}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload images or documents as evidence for your dispute (max 5MB)
        </p>

        {isUploading && (
          <div className="mt-2">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-center mt-1">
              Uploading: {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createDisputeMutation.isPending || isUploading}
        >
          {(createDisputeMutation.isPending || isUploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Submit Dispute
        </Button>
      </div>
    </form>
  );
}
