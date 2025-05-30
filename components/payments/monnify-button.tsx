"use client";
import { _escrowConfig } from "@/config";
import { logger } from "@/lib/logger";
import { MonnifyButtonProps } from "@/types/monnify";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import axios from "axios";

export const MonnifyButton = ({
  amount,
  currency,
  reference,
  customerFullName,
  customerEmail,
  paymentDescription,
  metadata,
  onLoadStart,
  onLoadComplete,
  onComplete,
  onClose,
}: MonnifyButtonProps) => {
  const [isClient, setIsClient] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePayment = async () => {
    if (!isClient) return;
    try {
      window.MonnifySDK.initialize({
        amount,
        currency,
        reference,
        customerFullName,
        customerEmail,
        paymentDescription,
        metadata,
        // incomeSplitConfig: [],
        onLoadStart: () => {
          if (onLoadStart) onLoadStart();
        },
        onLoadComplete: () => {},
        // paymentMethods: ["CARD", "ACCOUNT_TRANSFER", "USSD", "PHONE_NUMBER"],
        onComplete: function (response) {
          setIsVerifying(true);
          logger.info("Payment response received:", { response });

          // Verify the payment
          axios
            .get(
              `/api/payments/verify/monnify/${encodeURIComponent(response.transactionReference)}`
            )
            .then((verificationResponse) => {
              const verificationResult = verificationResponse.data;
              logger.info("Payment verification result:", {
                verificationResult,
              });
              toast.success("Payment verified successfully!");
              if (onComplete) onComplete(response);
            })
            .catch((error) => {
              logger.error("Payment verification error:", { error });
              toast.error(
                "An error occurred while verifying your payment. Please try again."
              );
            })
            .finally(() => {
              setIsVerifying(false);
            });
        },
        onClose: (data) => {
          if (onClose && data.responseMessage) onClose(data);
        },
        apiKey: _escrowConfig.monnifyApiKey,
        contractCode: _escrowConfig.monnifyContractCode,
      });
    } catch (error: any) {
      logger.error("Payment initialization error:", { error });
      toast.error(
        "An error occurred while processing your payment. Please try again."
      );
    }
  };

  return (
    <Button onClick={handlePayment} disabled={!isClient || isVerifying}>
      {isVerifying ? "Verifying..." : "Pay with Monnify"}
    </Button>
  );
};
