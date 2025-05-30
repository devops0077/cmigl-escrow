export interface MonnifyResponse {
  amount: number;
  amountPaid: number;
  completed: boolean;
  completedOn: string;
  createdOn: string;
  currencyCode: string;
  customerEmail: string;
  customerName: string;
  fee: number;

  metaData: MetaData;
  payableAmount: number;
  paymentMethod: string;
  paymentReference: string;
  paymentStatus: string;
  transactionReference: string;
}

export interface MonnifyCancelledResponse {
  authorizedAmount: number;
  paymentStatus: string;
  redirectUrl: null;
  responseCode: string;
  responseMessage: string;
}

export interface MetaData {
  deviceType: string;
  ipAddress: string;
}

export interface MonnifyIncomeSplitConfig {
  subAccountCode: string;
  feePercentage: number;
  splitAmount: number;
  feeBearer: boolean;
}

export interface MonnifyMetadata {
  [key: string]: string | number | boolean | object;
}

export interface MonnifyPaymentConfig {
  amount: number;
  currency: string;
  reference: string;
  customerFullName: string;
  customerEmail: string;
  apiKey: string;
  contractCode: string;
  paymentDescription: string;
  paymentMethods?: ["CARD", "ACCOUNT_TRANSFER", "USSD", "PHONE_NUMBER"];
  metadata: MonnifyMetadata;
  incomeSplitConfig?: MonnifyIncomeSplitConfig[];
  onLoadStart: () => void;
  onLoadComplete: () => void;
  onComplete: (response: MonnifyResponse) => void;
  onClose: (data: MonnifyCancelledResponse) => void;
}

export interface MonnifyButtonProps
  extends Omit<
    MonnifyPaymentConfig,
    | "onLoadStart"
    | "onLoadComplete"
    | "apiKey"
    | "contractCode"
    | "incomeSplitConfig"
  > {
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}

export interface MonnifyGetTransactionStatusResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: ResponseBody;
}

export interface ResponseBody {
  transactionReference: string;
  paymentReference: string;
  amountPaid: string;
  totalPayable: string;
  settlementAmount: string;
  paidOn: string;
  paymentStatus: MonnifyPaymentStatus;
  paymentDescription: string;
  currency: string;
  paymentMethod: string;
  product: Product;
  cardDetails: CardDetails;
  accountDetails: null;
  accountPayments: any[];
  customer: Customer;
  metaData: MonnifyMetadata;
}

export enum MonnifyPaymentStatus {
  PENDING = "PENDING",
  FAILED = "FAILED",
  OVERPAID = "OVERPAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export interface CardDetails {
  cardType: string;
  last4: string;
  expMonth: string;
  expYear: string;
  bin: string;
  bankCode: null;
  bankName: null;
  reusable: boolean;
  countryCode: null;
  cardToken: null;
  supportsTokenization: boolean;
  maskedPan: string;
}

export interface Customer {
  email: string;
  name: string;
}

export interface Product {
  type: string;
  reference: string;
}
