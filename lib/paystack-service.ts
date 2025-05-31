import { AppError } from "./error-class";
import { calculateTotalWithAllFees } from "./fee-calculator";
import { PaymentStatus } from "./generated/prisma";
import { logger } from "./logger";

export type PaystackTransactionInitializeParams = {
  email: string;
  amount: number; // amount in kobo (multiply by 100 for Naira)
  reference?: string;
  callback_url?: string;
  includeFees?: boolean;
  metadata?: Record<string, any>;
  currency?: string;
  channels?: string[];
};

export type PaystackTransactionVerifyResponse = {
  status: string;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    fees: number;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      metadata: any;
      customer_code: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
    metadata: any;
  };
};

export type PaystackTransactionInitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type PaystackTransferRecipientResponse = {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    name: string;
    recipient_code: string;
    type: string;
    updatedAt: string;
    is_deleted: boolean;
    details: {
      account_number: string;
      account_name: string;
      bank_code: string;
      bank_name: string;
    };
  };
};

export type PaystackTransferResponse = {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    transfer_code: string;
    transferred_at: string | null;
    created_at: string;
    updated_at: string;
  };
};

export class PaystackService {
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl: string = "https://api.paystack.co";

  constructor() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!secretKey || !publicKey) {
      throw new Error("Paystack API keys are not configured");
    }

    this.secretKey = secretKey;
    this.publicKey = publicKey;
  }

  /**
   * Initialize a transaction with Paystack
   *
   * @param params - Transaction initialization parameters
   * @param includeFees - Whether to include Paystack fees in the amount
   * @returns The Paystack initialization response
   */
  async initializeTransaction(
    params: PaystackTransactionInitializeParams
  ): Promise<PaystackTransactionInitializeResponse> {
    try {
      // If includeFees is true, calculate the amount with Paystack fees included
      let amount = params.amount;

      if (params.includeFees) {
        const isInternational = params.currency !== "NGN";
        const feeCalculation = calculateTotalWithAllFees(
          amount,
          isInternational
        );
        amount = feeCalculation.totalAmount;

        // Add fee breakdown to metadata
        if (!params.metadata) params.metadata = {};
        params.metadata.feeBreakdown = {
          baseAmount: feeCalculation.baseAmount,
          escrowFee: feeCalculation.escrowFee,
          paystackFee: feeCalculation.paystackFee,
          totalAmount: feeCalculation.totalAmount,
        };
      }

      // Convert amount to kobo (smallest currency unit)
      const amountInKobo = Math.round(params.amount * 100);

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...params,
          amount: amountInKobo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack transaction initialization failed", {
          status: response.status,
          error: errorData,
        });
        throw new AppError(
          "Payment initialization failed",
          response.status,
          errorData
        );
      }

      const data = await response.json();
      logger.info("Paystack transaction initialized", {
        reference: data.data.reference,
      });
      return data;
    } catch (error) {
      logger.error("Paystack transaction initialization error", { error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to initialize payment",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Verify a transaction
   * @param reference Transaction reference
   * @returns Promise with transaction verification data
   */
  async verifyTransaction(
    reference: string
  ): Promise<PaystackTransactionVerifyResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack transaction verification failed", {
          reference,
          status: response.status,
          error: errorData,
        });
        throw new AppError(
          "Payment verification failed",
          response.status,
          errorData
        );
      }

      const data = await response.json();
      logger.info("Paystack transaction verified", {
        reference,
        status: data.data.status,
      });
      return data;
    } catch (error) {
      logger.error("Paystack transaction verification error", {
        reference,
        error,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to verify payment",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * List transactions
   * @param params Query parameters
   * @returns Promise with transactions list
   */
  async listTransactions(params?: {
    perPage?: number;
    page?: number;
    from?: string;
    to?: string;
    status?: "failed" | "success" | "abandoned";
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const url = `${this.baseUrl}/transaction?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack list transactions failed", {
          status: response.status,
          error: errorData,
        });
        throw new AppError(
          "Failed to list transactions",
          response.status,
          errorData
        );
      }

      const data = await response.json();
      logger.info("Paystack transactions listed", {
        count: data.data.length,
      });
      return data;
    } catch (error) {
      logger.error("Paystack list transactions error", { error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to list transactions",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Create a customer
   * @param params Customer parameters
   * @returns Promise with customer data
   */
  async createCustomer(params: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/customer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack customer creation failed", {
          email: params.email,
          status: response.status,
          error: errorData,
        });
        throw new AppError(
          "Customer creation failed",
          response.status,
          errorData
        );
      }

      const data = await response.json();
      logger.info("Paystack customer created", {
        email: params.email,
        customerId: data.data.id,
      });
      return data;
    } catch (error) {
      logger.error("Paystack customer creation error", {
        email: params.email,
        error,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create customer",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Create a subscription plan
   * @param params Plan parameters
   * @returns Promise with plan data
   */
  async createPlan(params: {
    name: string;
    amount: number;
    interval: "daily" | "weekly" | "monthly" | "quarterly" | "annually";
    description?: string;
    currency?: string;
  }) {
    try {
      // Convert amount to kobo
      const amountInKobo = Math.round(params.amount * 100);

      const response = await fetch(`${this.baseUrl}/plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...params,
          amount: amountInKobo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack plan creation failed", {
          name: params.name,
          status: response.status,
          error: errorData,
        });
        throw new AppError("Plan creation failed", response.status, errorData);
      }

      const data = await response.json();
      logger.info("Paystack plan created", {
        name: params.name,
        planId: data.data.id,
      });
      return data;
    } catch (error) {
      logger.error("Paystack plan creation error", {
        name: params.name,
        error,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create plan",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Create a subscription
   * @param params Subscription parameters
   * @returns Promise with subscription data
   */
  async createSubscription(params: {
    customer: string;
    plan: string;
    authorization?: string;
    start_date?: string;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/subscription`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack subscription creation failed", {
          customer: params.customer,
          plan: params.plan,
          status: response.status,
          error: errorData,
        });
        throw new AppError(
          "Subscription creation failed",
          response.status,
          errorData
        );
      }

      const data = await response.json();
      logger.info("Paystack subscription created", {
        customer: params.customer,
        plan: params.plan,
        subscriptionId: data.data.id,
      });
      return data;
    } catch (error) {
      logger.error("Paystack subscription creation error", {
        customer: params.customer,
        plan: params.plan,
        error,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create subscription",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Verify webhook signature
   * @param signature Signature from header
   * @param body Request body as string
   * @returns boolean indicating if signature is valid
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    try {
      const crypto = require("crypto");
      const hash = crypto
        .createHmac("sha512", this.secretKey)
        .update(body)
        .digest("hex");
      return hash === signature;
    } catch (error) {
      logger.error("Paystack webhook signature verification error", { error });
      return false;
    }
  }

  /**
   * List banks
   */
  async listBanks(country = "nigeria"): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/bank?country=${country}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack bank listing failed", {
          country,
          status: response.status,
          error: errorData,
        });
        throw new Error(
          `Paystack API error: ${errorData.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      logger.error("Error listing Paystack banks", { country, error });
      throw error;
    }
  }

  /**
   * Resolve account number
   */
  async resolveAccountNumber(
    accountNumber: string,
    bankCode: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack account resolution failed", {
          accountNumber,
          bankCode,
          status: response.status,
          error: errorData,
        });
        throw new Error(`${errorData.message || "Unknown error"}`);
      }

      const data = await response.json();
      logger.info("Paystack account resolved", {
        accountNumber,
        accountName: data.data.account_name,
      });

      return data.data;
    } catch (error) {
      logger.error("Error resolving account number", {
        accountNumber,
        bankCode,
        error,
      });
      throw error;
    }
  }

  /**
   * Create a transfer recipient
   * @param params Recipient parameters
   * @returns Promise with recipient data
   */
  async createTransferRecipient(params: {
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
    currency?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<PaystackTransferRecipientResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transferrecipient`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack transfer recipient creation failed", {
          accountNumber: params.account_number,
          bankCode: params.bank_code,
          status: response.status,
          error: errorData,
        });
        throw new AppError(
          errorData.message || "Failed to create transfer recipient",
          response.status,
          errorData
        );
      }

      const data = await response.json();
      logger.info("Paystack transfer recipient created", {
        accountNumber: params.account_number.slice(-4).padStart(10, "*"), // Log only last 4 digits
        recipientCode: data.data.recipient_code,
      });

      return data;
    } catch (error) {
      logger.error("Paystack transfer recipient creation error", {
        accountNumber: params.account_number.slice(-4).padStart(10, "*"),
        error,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create transfer recipient",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Initiate a transfer
   * @param params Transfer parameters
   * @returns Promise with transfer data
   */
  async initiateTransfer(params: {
    source: string;
    amount: number;
    recipient: string;
    reason?: string;
    reference?: string;
    currency?: string;
  }): Promise<PaystackTransferResponse> {
    try {
      // Convert amount to kobo
      const amountInKobo = Math.round(params.amount * 100);

      const response = await fetch(`${this.baseUrl}/transfer`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...params,
          amount: amountInKobo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack transfer initiation failed", {
          recipient: params.recipient,
          amount: params.amount,
          status: response.status,
          error: errorData,
        });
        throw new AppError(
          errorData.message || "Failed to initiate transfer",
          response.status,
          errorData
        );
      }

      const data = await response.json();
      logger.info("Paystack transfer initiated", {
        recipient: params.recipient,
        amount: params.amount,
        reference: data.data.reference,
        transferCode: data.data.transfer_code,
      });

      return data;
    } catch (error) {
      logger.error("Paystack transfer initiation error", {
        recipient: params.recipient,
        amount: params.amount,
        error,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to initiate transfer",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Verify a transfer
   * @param reference Transfer reference
   * @returns Promise with transfer verification data
   */
  async verifyTransfer(reference: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/transfer/verify/${reference}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Paystack transfer verification failed", {
          reference,
          status: response.status,
          error: errorData,
        });
        throw new AppError(
          errorData.message || "Failed to verify transfer",
          response.status,
          errorData
        );
      }

      const data = await response.json();
      logger.info("Paystack transfer verified", {
        reference,
        status: data.data.status,
      });

      return data;
    } catch (error) {
      logger.error("Paystack transfer verification error", {
        reference,
        error,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to verify transfer",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Map Paystack transaction status to our PaymentStatus enum
   */
  mapTransactionStatus(paystackStatus: string): PaymentStatus {
    switch (paystackStatus.toLowerCase()) {
      case "success":
        return PaymentStatus.SUCCESS;
      case "failed":
        return PaymentStatus.FAILED;
      case "abandoned":
        return PaymentStatus.ABANDONED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Get request headers
   */
  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Generate a unique transaction reference
   * @returns Unique transaction reference
   */
  generateTransactionReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    return `ESCROW-CMIGL-${timestamp}-${random}`;
  }
}

// Export a singleton instance
export const paystackService = new PaystackService();
