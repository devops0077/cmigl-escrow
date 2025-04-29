"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PaystackButton } from "@/components/payments/paystack-button";
import { PaystackScript } from "@/components/payments/paystack-script";
import { _escrowConfig } from "@/config";

export default function PaymentPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<{
    reference: string;
    amount: number;
    email: string;
  } | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      if (!session?.user && !searchParams.get("userId")) return;

      try {
        const response = await fetch(
          `/api/auth/registration-fee?userId=${searchParams.get("userId")}`,
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to initialize payment");
        }

        const data = await response.json();
        const resoledEmail = session?.user?.email || data.email;
        setPaymentData({
          reference: data.reference,
          amount: _escrowConfig.registrationFee,
          email: resoledEmail as string,
        });
      } catch (error) {
        toast.error("Payment initialization failed", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user || searchParams.get("userId")) {
      initializePayment();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handlePaymentSuccess = async (reference: string) => {
    try {
      // Verify the payment on the server
      const verificationResponse = await fetch(
        `/api/payments/verify/${reference}`,
        {
          method: "GET",
        }
      );

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        throw new Error(error.error || "Failed to verify payment");
      }
      const res = await update({
        ...session,
        user: {
          ...session?.user,
          isActive: true,
          status: "ACTIVE",
        },
      });

      if (res?.user.status !== "ACTIVE") {
        throw new Error("Failed to update user status");
      }

      toast.success("Registration fee payment successful", {
        description: "Your account has been activated.",
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      toast.error("Payment verification failed", {
        description: "Please contact support if funds were deducted.",
      });
    }
  };

  const handlePaymentClose = () => {
    toast.info("Payment cancelled", {
      description: "You can try again later.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Initializing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PaystackScript />
      <div className="container flex items-center justify-center min-h-screen py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Registration Fee</CardTitle>
            <CardDescription>
              Pay a one-time registration fee to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-3xl font-bold">
                {_escrowConfig.registrationFeeString}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                One-time registration fee
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <p>Benefits include:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access to escrow services</li>
                <li>Secure transactions</li>
                <li>Dispute resolution</li>
                <li>24/7 customer support</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            {paymentData ? (
              <PaystackButton
                amount={paymentData.amount}
                email={paymentData.email}
                reference={paymentData.reference}
                onSuccess={handlePaymentSuccess}
                onClose={handlePaymentClose}
                metadata={
                  {
                    type: "registration_fee",
                    userId: searchParams.get("userId"),
                  } as any
                }
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Button disabled>Unable to initialize payment</Button>
                {session?.user.id && (
                  <Button
                    variant="link"
                    className="text-sm text-muted-foreground mt-4"
                    onClick={async () => await signOut()}
                  >
                    Signout
                  </Button>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
