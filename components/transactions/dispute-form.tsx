"use client";

import type React from "react";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const disputeFormSchema = z.object({
  reason: z.string().min(1, "Please select a reason for the dispute"),
  description: z
    .string()
    .min(10, "Please provide a detailed description of at least 10 characters"),
  evidenceFile: z.instanceof(File).optional(),
});

type DisputeFormValues = z.infer<typeof disputeFormSchema>;

interface DisputeFormProps {
  transactionId: string;
  onClose: () => void;
}

export function DisputeForm({ transactionId, onClose }: DisputeFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeFormSchema),
    defaultValues: {
      reason: "",
      description: "",
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiClient.post(
        `/transactions/${transactionId}/disputes`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transaction", transactionId],
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Dispute submitted", {
        description:
          "Your dispute has been submitted and will be reviewed by an administrator.",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error submitting dispute:", error);
      toast.error("Submission failed", {
        description:
          "There was a problem submitting your dispute. Please try again.",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "The maximum file size is 5MB.",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please upload an image file (JPEG, PNG, etc.).",
      });
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Set form value
    form.setValue("evidenceFile", file);
  };

  const clearFile = () => {
    form.setValue("evidenceFile", undefined);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const onSubmit = async (values: DisputeFormValues) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("reason", values.reason);
      formData.append("description", values.description);

      // If there's an evidence file, upload it first
      let evidenceUrl = null;
      if (values.evidenceFile) {
        try {
          const uploadResult = await uploadMutation.mutateAsync(
            values.evidenceFile
          );
          evidenceUrl = uploadResult.url;
          formData.append("evidenceUrl", evidenceUrl);
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error("Upload failed", {
            description:
              "There was a problem uploading your evidence. Please try again.",
          });
          setIsUploading(false);
          return;
        }
      }

      // Submit the dispute
      await disputeMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Error in dispute submission:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Reason for Dispute</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="w-full">
                  <SelectTrigger className="w-full">
                    <SelectValue
                      className="w-full"
                      placeholder="Select a reason"
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="w-full">
                  <SelectItem value="ITEM_NOT_RECEIVED">
                    Item Not Received
                  </SelectItem>
                  <SelectItem value="ITEM_NOT_AS_DESCRIBED">
                    Item Not As Described
                  </SelectItem>
                  <SelectItem value="DAMAGED_ITEM">Damaged Item</SelectItem>
                  <SelectItem value="WRONG_ITEM">
                    Wrong Item Received
                  </SelectItem>
                  <SelectItem value="SELLER_NOT_RESPONDING">
                    Seller Not Responding
                  </SelectItem>
                  <SelectItem value="BUYER_NOT_RESPONDING">
                    Buyer Not Responding
                  </SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please provide details about your dispute..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include all relevant details to help us resolve your dispute
                quickly.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="evidenceFile"
          render={() => (
            <FormItem>
              <FormLabel>Evidence (Optional)</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {!previewUrl ? (
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="evidence-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG or JPEG (MAX. 5MB)
                          </p>
                        </div>
                        <Input
                          id="evidence-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative h-48 w-full rounded-lg overflow-hidden">
                        <Image
                          src={previewUrl || "/placeholder.svg"}
                          alt="Evidence preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={clearFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Upload a photo or screenshot as evidence for your dispute
                (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isUploading || disputeMutation.isPending}
          >
            {(isUploading || disputeMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Dispute
          </Button>
        </div>
      </form>
    </Form>
  );
}
