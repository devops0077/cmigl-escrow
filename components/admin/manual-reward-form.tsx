"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { issueManualReward } from "@/lib/reward-actions";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

const formSchema = z.object({
  userId: z.string().min(1, {
    message: "User ID is required.",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number.",
  }),
  reason: z
    .string()
    .min(3, {
      message: "Reason must be at least 3 characters.",
    })
    .max(200, {
      message: "Reason must not exceed 200 characters.",
    }),
});

type ManualRewardFormProps = {
  programId: string;
  onSuccess?: () => void;
};

export function ManualRewardForm({
  programId,
  onSuccess,
}: ManualRewardFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      amount: undefined,
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      await issueManualReward(
        programId,
        values.userId,
        values.amount,
        values.reason
      );

      toast.success("Reward issued", {
        description: "The manual reward has been issued successfully.",
      });

      form.reset({
        userId: "",
        amount: undefined,
        reason: "",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Manual Reward</CardTitle>
        <CardDescription>
          Manually issue a reward to a specific user
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    The ID of the user to reward
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward Amount (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="1000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Amount to reward the user</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Exceptional customer service"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Reason for issuing this reward
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Issuing..." : "Issue Reward"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
