import { _escrowConfig } from "@/config";
import { MonnifyGetTransactionStatusResponse } from "@/types/monnify";
import axios, { AxiosInstance } from "axios";
import { logger } from "./logger";

// Interface for Monnify API credentials
interface MonnifyCredentials {
  apiKey: string;
  clientSecret: string;
  baseUrl: string;
}

export interface MonnifyAuthLoginResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: ResponseBody;
}

export interface ResponseBody {
  accessToken: string;
  expiresIn: number;
}

// Interface for payment initiation request
interface PaymentRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  currencyCode: string;
  contractCode: string;
  redirectUrl: string;
}

// Interface for payment response
interface PaymentResponse {
  transactionReference: string;
  paymentReference: string;
  paymentUrl: string;
  status: string;
}

// Interface for transaction verification response
interface TransactionVerification {
  transactionReference: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  customerEmail: string;
}

export class MonnifyService {
  private axiosInstance: AxiosInstance;
  private credentials: MonnifyCredentials;

  constructor(credentials: MonnifyCredentials) {
    this.credentials = credentials;

    // Initialize Axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: credentials.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${credentials.apiKey}:${credentials.clientSecret}`
        ).toString("base64")}`,
      },
    });

    this.axiosInstance.interceptors.request.use(async (config) => {
      // Automatically add access token to headers for requests that require it
      if (
        config.url?.startsWith("/api/v1/merchant") ||
        config.url?.startsWith("/api/v2/transactions")
      ) {
        const accessToken = await this.getAccessToken();
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });
  }

  // Method to initiate a payment
  async initiatePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await this.axiosInstance.post(
        "/api/v1/merchant/transactions/initiate",
        {
          ...paymentData,
          paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
        }
      );

      return {
        transactionReference: response.data.transactionReference,
        paymentReference: response.data.paymentReference,
        paymentUrl: response.data.paymentUrl,
        status: response.data.status,
      };
    } catch (error: any) {
      throw new Error(`Failed to initiate payment: ${error.message}`);
    }
  }

  async getTransactionStatus(transactionReference: string) {
    try {
      const response =
        await this.axiosInstance.get<MonnifyGetTransactionStatusResponse>(
          `/api/v2/transactions/${encodeURIComponent(transactionReference)}`
        );
      return response.data;
    } catch (error: any) {
      logger.error("Error getting transaction status", {
        error,
        transactionReference,
      });
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  // Method to verify a transaction
  async verifyTransaction(
    transactionReference: string
  ): Promise<TransactionVerification> {
    try {
      const response = await this.axiosInstance.get(
        `/api/v1/merchant/transactions/query?transactionReference=${transactionReference}`
      );

      return {
        transactionReference: response.data.transactionReference,
        paymentStatus: response.data.paymentStatus,
        amount: response.data.amount,
        currency: response.data.currency,
        customerEmail: response.data.customerEmail,
      };
    } catch (error: any) {
      logger.error("Error verifying transaction", {
        error,
        transactionReference,
      });
      throw new Error(`Failed to verify transaction: ${error.message}`);
    }
  }

  // Method to get access token (for operations requiring OAuth)
  private async getAccessToken(): Promise<string> {
    try {
      const response = await this.axiosInstance.post<MonnifyAuthLoginResponse>(
        "/api/v1/auth/login",
        {
          apiKey: this.credentials.apiKey,
          clientSecret: this.credentials.clientSecret,
        }
      );

      return response.data.responseBody.accessToken;
    } catch (error: any) {
      logger.error("Error getting access token", {
        error,
        apiKey: this.credentials.apiKey,
      });
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }
}

export const monnifyService = new MonnifyService({
  baseUrl: _escrowConfig.monnifyBaseUrl,
  apiKey: _escrowConfig.monnifyApiKey,
  clientSecret: _escrowConfig.monnifySecretKey,
});
