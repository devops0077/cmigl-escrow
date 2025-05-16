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
import { Switch } from "@/components/ui/switch";
import { createRewardProgram, updateRewardProgram } from "@/lib/reward-actions";
import { toast } from "sonner";

const formSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: "Name must be at least 3 characters.",
    })
    .max(100, {
      message: "Name must not exceed 100 characters.",
    }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type RewardProgramFormProps = {
  program?: any;
  onSuccess?: () => void;
};

export function RewardProgramForm({
  program,
  onSuccess,
}: RewardProgramFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: program?.name || "",
      description: program?.description || "",
      isActive: program?.isActive ?? true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      if (program) {
        // Update existing program
        await updateRewardProgram(program.id, values);
        toast.success("Program updated", {
          description: "The reward program has been updated successfully.",
        });
      } else {
        // Create new program
        await createRewardProgram(values);
        toast.success("Program created", {
          description: "The new reward program has been created successfully.",
        });
        form.reset({
          name: "",
          description: "",
          isActive: true,
        });
      }

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
        <CardTitle>
          {program ? "Edit Reward Program" : "Create New Reward Program"}
        </CardTitle>
        <CardDescription>
          {program
            ? "Update the details of this reward program"
            : "Define a new reward program for your users"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Monthly Active User Rewards"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this reward program
                  </FormDescription>
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
                      placeholder="Rewards for users who complete at least 5 transactions per month"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of the reward program and its purpose
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Enable or disable this reward program
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : program
                  ? "Update Program"
                  : "Create Program"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
