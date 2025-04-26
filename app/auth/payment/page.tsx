"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { FadeIn } from "@/components/animations/fade-in";

export default function RegistrationPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.push("/auth/login");
    }
  }, [userId, router]);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would integrate with Paystack
      // For now, we'll simulate a successful payment
      const paymentReference = `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const response = await fetch("/api/auth/registration-fee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          paymentReference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      toast.success("Registration complete!", {
        description: "Your account has been activated. You can now log in.",
      });

      router.push("/auth/login?registered=true");
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed", {
        description:
          error instanceof Error
            ? error.message
            : "There was a problem processing your payment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className=" flex  flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Registration Fee
            </CardTitle>
            <CardDescription>
              Pay the one-time registration fee to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-center">
                <p className="text-4xl font-bold">₦500</p>
                <p className="text-sm text-muted-foreground">
                  One-time registration fee
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4 mt-4">
                <h3 className="font-medium mb-2">What you get:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Full access to Vokun Escrow platform</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Secure transactions with our escrow service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Wallet management for easy payments</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Transaction history and notifications</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Pay ₦500"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
