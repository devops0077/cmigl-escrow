"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addRewardCriteria } from "@/lib/reward-actions";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

const formSchema = z.object({
  programId: z.string(),
  criteriaType: z.enum([
    "TRANSACTION_COUNT",
    "TRANSACTION_VOLUME",
    "ACCOUNT_AGE",
    "USER_ROLE",
    "CUSTOM",
  ]),
  minTransactions: z.coerce.number().optional(),
  minVolume: z.coerce.number().optional(),
  minAccountAge: z.coerce.number().optional(),
  userRole: z.enum(["USER", "ADMIN"]).optional(),
  customQuery: z.string().optional(),
});

type RewardCriteriaFormProps = {
  programId: string;
  onSuccess?: () => void;
};

export function RewardCriteriaForm({
  programId,
  onSuccess,
}: RewardCriteriaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      programId,
      criteriaType: "TRANSACTION_COUNT",
      minTransactions: undefined,
      minVolume: undefined,
      minAccountAge: undefined,
      userRole: undefined,
      customQuery: undefined,
    },
  });

  const criteriaType = form.watch("criteriaType");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      await addRewardCriteria(values);

      toast.success("Criteria added", {
        description: "The reward criteria has been added successfully.",
      });

      form.reset({
        programId,
        criteriaType: "TRANSACTION_COUNT",
        minTransactions: undefined,
        minVolume: undefined,
        minAccountAge: undefined,
        userRole: undefined,
        customQuery: undefined,
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
        <CardTitle>Add Eligibility Criteria</CardTitle>
        <CardDescription>
          Define who is eligible to receive rewards from this program
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="criteriaType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Criteria Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select criteria type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full">
                      <SelectItem value="TRANSACTION_COUNT">
                        Transaction Count
                      </SelectItem>
                      <SelectItem value="TRANSACTION_VOLUME">
                        Transaction Volume
                      </SelectItem>
                      <SelectItem value="ACCOUNT_AGE">Account Age</SelectItem>
                      <SelectItem value="USER_ROLE">User Role</SelectItem>
                      <SelectItem value="CUSTOM">Custom Query</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of criteria to apply for eligibility
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {criteriaType === "TRANSACTION_COUNT" && (
              <FormField
                control={form.control}
                name="minTransactions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Transactions</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Minimum number of completed transactions required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {criteriaType === "TRANSACTION_VOLUME" && (
              <FormField
                control={form.control}
                name="minVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Transaction Volume (₦)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Minimum total transaction amount required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {criteriaType === "ACCOUNT_AGE" && (
              <FormField
                control={form.control}
                name="minAccountAge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Account Age (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Minimum age of user account in days
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {criteriaType === "USER_ROLE" && (
              <FormField
                control={form.control}
                name="userRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USER">Regular User</SelectItem>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Target users with this specific role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {criteriaType === "CUSTOM" && (
              <FormField
                control={form.control}
                name="customQuery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Query (JSON)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Advanced: Enter a JSON query for custom filtering
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Criteria"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
