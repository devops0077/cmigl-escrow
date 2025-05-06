"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import apiClient from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
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
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface DisputeResolutionFormProps {
  dispute: any;
  transactionAmount: number;
}

const FormSchema = z.object({
  sellerAmount: z.number().min(0),
  buyerAmount: z.number().min(0),
  adminNotes: z.string().optional(),
});

export function DisputeResolutionForm({
  dispute,
  transactionAmount,
}: DisputeResolutionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sliderValue, setSliderValue] = useState(50); // Default to 50% for each party

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      sellerAmount: transactionAmount * 0.5,
      buyerAmount: transactionAmount * 0.5,
      adminNotes: "",
    },
  });

  const sellerAmount = form.watch("sellerAmount");
  const buyerAmount = form.watch("buyerAmount");

  // Update amounts when slider changes
  const handleSliderChange = (value: number[]) => {
    const percentage = value[0];
    setSliderValue(percentage);

    const newSellerAmount = (transactionAmount * percentage) / 100;
    const newBuyerAmount = transactionAmount - newSellerAmount;

    form.setValue(
      "sellerAmount",
      Number.parseFloat(newSellerAmount.toFixed(2))
    );
    form.setValue("buyerAmount", Number.parseFloat(newBuyerAmount.toFixed(2)));
  };

  // Update slider when amounts change
  const updateSliderFromAmounts = (sellerAmt: number) => {
    const percentage = (sellerAmt / transactionAmount) * 100;
    setSliderValue(percentage);
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setIsSubmitting(true);

      // Validate that the total amount doesn't exceed the transaction amount
      const total = data.sellerAmount + data.buyerAmount;
      if (total > transactionAmount) {
        toast.error("Invalid amounts", {
          description:
            "The total allocated amount exceeds the transaction amount",
        });
        return;
      }

      await apiClient.post(`/admin/disputes/${dispute.id}/resolve`, data);

      toast.success("Dispute resolved", {
        description: "The dispute has been successfully resolved",
      });

      // Refresh the page to show the updated status
      router.refresh();
    } catch (error: any) {
      toast.error("Error", {
        description: error.response?.data?.error || "Failed to resolve dispute",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <AlertDescription>
            Allocate the transaction amount ({formatCurrency(transactionAmount)}
            ) between the buyer and seller to resolve this dispute. The total
            allocated amount cannot exceed the original transaction amount.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">
              Seller: {formatCurrency(sellerAmount)}
            </p>
            <p className="font-medium">Buyer: {formatCurrency(buyerAmount)}</p>
          </div>

          <FormField
            control={form.control}
            name="sellerAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Allocation</FormLabel>
                <FormControl>
                  <Slider
                    defaultValue={[50]}
                    max={100}
                    step={1}
                    value={[sliderValue]}
                    onValueChange={handleSliderChange}
                    className="py-4"
                  />
                </FormControl>
                <FormDescription className="flex justify-between text-xs">
                  <span>100% to Buyer</span>
                  <span>100% to Seller</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sellerAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seller Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={transactionAmount}
                      {...field}
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value) || 0;
                        field.onChange(value);

                        // Update buyer amount
                        const newBuyerAmount = Math.max(
                          0,
                          transactionAmount - value
                        );
                        form.setValue(
                          "buyerAmount",
                          Number.parseFloat(newBuyerAmount.toFixed(2))
                        );

                        // Update slider
                        updateSliderFromAmounts(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buyerAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buyer Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={transactionAmount}
                      {...field}
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value) || 0;
                        field.onChange(value);

                        // Update seller amount
                        const newSellerAmount = Math.max(
                          0,
                          transactionAmount - value
                        );
                        form.setValue(
                          "sellerAmount",
                          Number.parseFloat(newSellerAmount.toFixed(2))
                        );

                        // Update slider
                        updateSliderFromAmounts(newSellerAmount);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Transaction Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Original Amount:</span>
                <span>{formatCurrency(transactionAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To Seller:</span>
                <span>{formatCurrency(sellerAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To Buyer:</span>
                <span>{formatCurrency(buyerAmount)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Allocated:</span>
                <span>{formatCurrency(sellerAmount + buyerAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="adminNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add notes about your decision (will be shared with both parties)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                These notes will be included in the resolution notification sent
                to both parties.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resolving..." : "Resolve Dispute"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
