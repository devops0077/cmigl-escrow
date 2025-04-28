"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PaystackButtonProps {
  amount: number; // amount in kobo
  email: string;
  reference: string;
  metadata: {};
  onSuccess?: (reference: string) => void;
  onClose?: () => void;
}

export function PaystackButton({
  amount,
  email,
  reference,
  onSuccess,
  onClose,
  metadata = {},
}: PaystackButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const initializePayment = () => {
    if (!isClient) return;

    try {
      // @ts-ignore - PaystackPop is loaded from the script
      const handler = window.PaystackPop?.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        amount: amount * 100,
        reference,
        metadata,
        onClose: () => {
          logger.info("Payment closed", { reference });
          if (onClose) onClose();
        },
        callback: function (response: { reference: string }) {
          setIsVerifying(true);
          console.log("RESPONSE", response);

          fetch(`/api/payments/verify/${response.reference}`, {
            method: "GET",
          })
            .then((verificationResponse) => {
              if (!verificationResponse.ok) {
                return verificationResponse.json().then((error) => {
                  throw new Error(error.error || "Failed to verify payment");
                });
              }
              return verificationResponse.json();
            })
            .then((data) => {
              if (data.data.status === "success") {
                if (onSuccess) onSuccess(response.reference);
                router.refresh();
              } else {
                toast.error("Payment verification failed", {
                  description: "Please contact support if funds were deducted.",
                });
              }
            })
            .catch((error) => {
              logger.error("Payment verification error", { error, reference });
              toast.error("Payment verification failed", {
                description: "Please contact support if funds were deducted.",
              });
            })
            .finally(() => {
              setIsVerifying(false);
            });
        },
      });

      handler.openIframe();
    } catch (error) {
      logger.error("Paystack initialization error", { error });
      toast.error("Payment initialization failed", {
        description: "Please try again later",
      });
    }
  };

  if (!isClient) {
    return <Button disabled>Loading...</Button>;
  }

  return (
    <Button onClick={initializePayment} disabled={isVerifying}>
      {isVerifying ? "Verifying Payment..." : "Pay with Paystack"}
    </Button>
  );
}
