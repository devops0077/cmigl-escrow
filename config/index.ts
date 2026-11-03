export const _escrowConfig = {
  escrowFee: 0.045, // 4.5% escrow fee
  minEscrowAmount: 100, // Minimum amount for escrow
  maxEscrowAmount: 10000, // Maximum amount for escrow
  transactionFee: 0.02, // 2% transaction fee
  minTransactionAmount: 10, // Minimum amount for transaction
  maxTransactionAmount: 5000, // Maximum amount for transaction
  publicUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || "",

  monnifyApiKey: process.env.NEXT_PUBLIC_MONNIFY_API_KEY || "",
  monnifySecretKey: process.env.MONNIFY_SECRET_KEY || "",
  monnifyBaseUrl:
    process.env.NEXT_PUBLIC_MONNIFY_BASE_URL ||
    "https://sandbox.monnify.com/api/v1",
  monnifyContractCode: process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE || "",
  monnifySourceAccountNumber:
    process.env.NEXT_PUBLIC_MONNIFY_SOURCE_ACCOUNT_NUMBER || "",
  monnifyWalletId: "8000022521",

  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  redisPassword: process.env.REDIS_PASSWORD || "",
  redisDb: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  // Set REDIS_TLS=true when Redis is TLS-only (e.g. the box Redis, which
  // takes no plaintext connections). REDIS_TLS_CA_B64 optionally carries a
  // base64-encoded PEM of the CA that signed the Redis server certificate
  // (needed for a private/self-signed CA); omit it for publicly trusted
  // certificates, where the default verification applies.
  redisTls: process.env.REDIS_TLS === "true",
  redisTlsCaB64: process.env.REDIS_TLS_CA_B64 || "",

  zohomailClientId: process.env.ZOHOMAIL_CLIENT_ID || "",
  zohomailClientSecret: process.env.ZOHOMAIL_CLIENT_SECRET || "",
  zohomailGrantToken: process.env.ZOHOMAIL_GRANT_TOKEN || "",

  mails: {
    noreply: process.env.NEXT_PUBLIC_EMAIL_NO_REPLY || "no-reply@cmigl.org",
    support: process.env.NEXT_PUBLIC_EMAIL_SUPPORT || "support@cmigl.org",
    info: process.env.NEXT_PUBLIC_EMAIL_INFO || "info@cmigl.org",
  },
};

