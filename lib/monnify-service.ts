import { _escrowConfig } from "@/config";
import { MonnifyGetTransactionStatusResponse } from "@/types/monnify";
import axios, { AxiosError, AxiosInstance } from "axios";
import { logger } from "./logger";
import Redis from "ioredis";

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

// Interface for disbursement request
interface DisbursementRequest {
  amount: number;
  reference: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
  narration: string;
  currency: string;
}

// Interface for disbursement response

export interface DisbursementStatus {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: DisbursementStatusResponseBody;
}

export interface DisbursementStatusResponseBody {
  amount: number;
  reference: string;
  status: string;
  dateCreated: string;
  totalFee: number;
  destinationAccountName: string;
  destinationBankName: string;
  destinationAccountNumber: string;
  destinationBankCode: string;
}

// Interface for disbursement status response
export interface DisbursementStatus {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: DisbursementStatusResponseBody;
}

export interface DisbursementStatusResponseBody {
  amount: number;
  reference: string;
  narration: string;
  currency: string;
  fee: number;
  twoFaEnabled: boolean;
  status: string;
  transactionDescription: string;
  transactionReference: string;
  createdOn: string;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  destinationBankCode: string;
  destinationBankName: string;
}

export class MonnifyService {
  private axiosInstance: AxiosInstance;
  private credentials: MonnifyCredentials;
  private redis: Redis;
  private readonly ACCESS_TOKEN_KEY = "monnify:access_token";

  constructor(credentials: MonnifyCredentials, redisClient: Redis) {
    this.credentials = credentials;
    this.redis = redisClient;

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
        config.url?.startsWith("/api/v2/transactions") ||
        config.url?.startsWith("/api/v1/disbursements")
      ) {
        const accessToken = await this.getCachedAccessToken();
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Clear cached token and retry the request
          await this.redis.del(this.ACCESS_TOKEN_KEY);
          const accessToken = await this.getAccessToken();
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return this.axiosInstance(error.config);
        }
        throw error;
      }
    );
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
      logger.error("Error initiating payment", { error, paymentData });
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

  // Method to initiate a disbursement
  async initiateDisbursement(
    disbursementData: DisbursementRequest
  ): Promise<DisbursementResponse> {
    try {
      const response = await this.axiosInstance.post(
        "/api/v1/disbursements/single",
        {
          ...disbursementData,
          sourceAccountNumber: "3934178936",
          accountNumber: disbursementData.destinationAccountNumber,
          bankCode: disbursementData.destinationBankCode,
          // sourceAccountNumber: _escrowConfig.monnifySourceAccountNumber,
          walletId: _escrowConfig.monnifyWalletId,
        }
      );

      return {
        transactionReference: response.data.transactionReference,
        paymentReference: response.data.paymentReference,
        status: response.data.status,
        amount: response.data.amount,
        destinationAccountNumber: response.data.destinationAccountNumber,
        bankCode: response.data.bankCode,
      };
    } catch (error: any) {
      if (error instanceof AxiosError && error.response) {
        logger.error("Error initiating disbursement", {
          status: error.response.status,
          data: error.response.data,
          disbursementData,
        });
      } else {
        logger.error("Error initiating disbursement", {
          error,
          disbursementData,
        });
      }
      throw new Error(`Failed to initiate disbursement: ${error.message}`);
    }
  }

  // Method to check disbursement status
  async getDisbursementStatus(
    transactionReference: string
  ): Promise<DisbursementStatus> {
    try {
      const response = await this.axiosInstance.get(
        `/api/v1/disbursements/single?transactionReference=${encodeURIComponent(transactionReference)}`
      );

      return {
        transactionReference: response.data.transactionReference,
        status: response.data.status,
        amount: response.data.amount,
        destinationAccountNumber: response.data.destinationAccountNumber,
        bankCode: response.data.bankCode,
        completedOn: response.data.completedOn,
      };
    } catch (error: any) {
      logger.error("Error getting disbursement status", {
        error,
        transactionReference,
      });
      throw new Error(`Failed to get disbursement status: ${error.message}`);
    }
  }

  // Method to get or refresh access token
  private async getAccessToken(): Promise<string> {
    try {
      const response = await this.axiosInstance.post<MonnifyAuthLoginResponse>(
        "/api/v1/auth/login",
        {
          apiKey: this.credentials.apiKey,
          clientSecret: this.credentials.clientSecret,
        }
      );

      const { accessToken, expiresIn } = response.data.responseBody;
      // Cache the token with expiry (subtracting 60 seconds to account for clock skew)
      await this.redis.set(
        this.ACCESS_TOKEN_KEY,
        accessToken,
        "EX",
        expiresIn - 60
      );
      return accessToken;
    } catch (error: any) {
      logger.error("Error getting access token", {
        error,
        apiKey: this.credentials.apiKey,
      });
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  // Method to get cached access token or fetch a new one
  private async getCachedAccessToken(): Promise<string> {
    const cachedToken = await this.redis.get(this.ACCESS_TOKEN_KEY);
    if (cachedToken) {
      logger.info("Using cached Monnify access token");
      return cachedToken;
    }
    logger.info("Cached Monnify access token not found, fetching new one");
    return this.getAccessToken();
  }
}

export const monnifyService = new MonnifyService(
  {
    baseUrl: _escrowConfig.monnifyBaseUrl,
    apiKey: _escrowConfig.monnifyApiKey,
    clientSecret: _escrowConfig.monnifySecretKey,
  },
  new Redis({
    host: _escrowConfig.redisHost,
    port: _escrowConfig.redisPort,
    password: _escrowConfig.redisPassword,
    db: _escrowConfig.redisDb,
  })
);
