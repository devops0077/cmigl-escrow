import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import Redis, { RedisOptions } from "ioredis";

// Types and Interfaces
interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface ZohoMailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiDomain?: string;
  redisUrl?: string;
  redisConfig?: RedisOptions;
}

interface EmailAddress {
  user_name: string;
  email: string;
}

interface SendEmailOptions {
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  reply_to?: EmailAddress;
  subject: string;
  content: string;
  mail_format?: "html" | "text";
  attachments?: Array<{ id: string }>;
  scheduled_time?: string;
  org_email?: boolean;
  template?: { id: string };
  in_reply_to?: {
    message_id: string;
    owner?: { id: string };
  };
}

interface EmailListOptions {
  folder?: string;
  limit?: number;
  offset?: number;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
}

interface EmailSearchOptions {
  searchTerm: string;
  folder?: string;
  limit?: number;
  offset?: number;
}

interface UpdateEmailOptions {
  messageIds: string[];
  operation:
    | "read"
    | "unread"
    | "archive"
    | "unarchive"
    | "delete"
    | "spam"
    | "not_spam";
  folderId?: string;
  flag?: "important" | "urgent" | "high" | "low";
  tags?: string[];
}

interface CachedToken {
  access_token: string;
  refresh_token?: string;
  api_domain: string;
  expires_at: number;
  scope?: string;
}

export class ZohoMailClient {
  private config: ZohoMailConfig;
  private redis: Redis;
  private httpClient: AxiosInstance;
  private tokenCacheKey: string;

  constructor(config: ZohoMailConfig) {
    this.config = {
      apiDomain: "https://www.zohoapis.com",
      ...config,
    };

    // Initialize Redis client
    this.redis = config.redisUrl
      ? new Redis(config.redisUrl)
      : new Redis(config.redisConfig || {});
    this.tokenCacheKey = `zoho_mail_token:${this.config.clientId}`;

    // Initialize HTTP client
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Set up request interceptor to automatically add auth token
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.getValidAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Zoho-oauthtoken ${token}`;
      }
      return config;
    });

    // Set up response interceptor to handle token refresh
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            const newToken = await this.getValidAccessToken();

            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Zoho-oauthtoken ${newToken}`;
            }

            return this.httpClient(originalRequest);
          } catch (refreshError) {
            await this.clearTokenCache();
            throw new Error("Token refresh failed. Please re-authenticate.");
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate OAuth 2.0 authorization URL
   */
  generateAuthUrl(
    scopes: string[] = ["ZohoMail.messages.CREATE", "ZohoMail.messages.READ"]
  ): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(","),
      access_type: "offline",
    });

    return `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    authorizationCode: string
  ): Promise<ZohoTokenResponse> {
    try {
      const response = await axios.post(
        "https://accounts.zoho.com/oauth/v2/token",
        null,
        {
          params: {
            code: authorizationCode,
            grant_type: "authorization_code",
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            redirect_uri: this.config.redirectUri,
          },
        }
      );

      const tokenData = response.data;
      await this.cacheToken(tokenData);

      return tokenData;
    } catch (error: any) {
      throw new Error(
        `Failed to exchange code for token: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Get valid access token from cache or refresh if expired
   */
  private async getValidAccessToken(): Promise<string | null> {
    try {
      const cachedTokenStr = await this.redis.get(this.tokenCacheKey);

      if (!cachedTokenStr) {
        return null;
      }

      const cachedToken: CachedToken = JSON.parse(cachedTokenStr);
      const now = Date.now();

      // Check if token expires within the next 5 minutes (buffer for safety)
      if (cachedToken.expires_at - now < 5 * 60 * 1000) {
        if (cachedToken.refresh_token) {
          await this.refreshAccessToken();
          const refreshedTokenStr = await this.redis.get(this.tokenCacheKey);
          if (refreshedTokenStr) {
            const refreshedToken: CachedToken = JSON.parse(refreshedTokenStr);
            return refreshedToken.access_token;
          }
        }
        return null;
      }

      return cachedToken.access_token;
    } catch (error) {
      console.error("Error getting valid access token:", error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const cachedTokenStr = await this.redis.get(this.tokenCacheKey);

      if (!cachedTokenStr) {
        throw new Error("No cached token found");
      }

      const cachedToken: CachedToken = JSON.parse(cachedTokenStr);

      if (!cachedToken.refresh_token) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(
        "https://accounts.zoho.com/oauth/v2/token",
        null,
        {
          params: {
            refresh_token: cachedToken.refresh_token,
            grant_type: "refresh_token",
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
          },
        }
      );

      const newTokenData = {
        ...response.data,
        refresh_token: cachedToken.refresh_token, // Preserve refresh token
      };

      await this.cacheToken(newTokenData);
    } catch (error: any) {
      throw new Error(
        `Failed to refresh token: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Cache token in Redis with expiration
   */
  private async cacheToken(tokenData: ZohoTokenResponse): Promise<void> {
    const expiresAt = Date.now() + tokenData.expires_in * 1000;

    const cachedToken: CachedToken = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      api_domain: tokenData.api_domain,
      expires_at: expiresAt,
      scope: tokenData.scope,
    };

    // Cache with TTL slightly longer than token expiry for safety
    const ttlSeconds = tokenData.expires_in + 300; // 5 minutes buffer

    await this.redis.setex(
      this.tokenCacheKey,
      ttlSeconds,
      JSON.stringify(cachedToken)
    );
  }

  /**
   * Clear token cache
   */
  private async clearTokenCache(): Promise<void> {
    await this.redis.del(this.tokenCacheKey);
  }

  /**
   * Get account information
   */
  async getAccounts(): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `${this.config.apiDomain}/mail/v1/accounts`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to get accounts: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Send an email
   */
  async sendEmail(
    accountId: string,
    emailOptions: SendEmailOptions
  ): Promise<any> {
    try {
      const response = await this.httpClient.post(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/messages`,
        emailOptions
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to send email: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get emails from a folder
   */
  async getEmails(
    accountId: string,
    options: EmailListOptions = {}
  ): Promise<any> {
    try {
      const params: any = {
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      if (options.searchTerm) params.searchTerm = options.searchTerm;
      if (options.fromDate) params.fromDate = options.fromDate;
      if (options.toDate) params.toDate = options.toDate;

      const response = await this.httpClient.get(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/messages/view`,
        { params }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to get emails: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Search emails
   */
  async searchEmails(
    accountId: string,
    options: EmailSearchOptions
  ): Promise<any> {
    try {
      const params = {
        searchTerm: options.searchTerm,
        limit: options.limit || 20,
        offset: options.offset || 0,
        folder: options.folder,
      };

      const response = await this.httpClient.get(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/messages/search`,
        { params }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to search emails: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get email content
   */
  async getEmailContent(
    accountId: string,
    folderId: string,
    messageId: string
  ): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/folders/${folderId}/messages/${messageId}/content`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to get email content: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get email headers
   */
  async getEmailHeaders(
    accountId: string,
    folderId: string,
    messageId: string
  ): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/folders/${folderId}/messages/${messageId}/header`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to get email headers: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get email attachments info
   */
  async getEmailAttachments(
    accountId: string,
    folderId: string,
    messageId: string
  ): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachmentinfo`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to get email attachments: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Download email attachment
   */
  async downloadAttachment(
    accountId: string,
    folderId: string,
    messageId: string,
    attachmentId: string
  ): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}`,
        { responseType: "stream" }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to download attachment: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Update email status (mark as read/unread, archive, etc.)
   */
  async updateEmails(
    accountId: string,
    options: UpdateEmailOptions
  ): Promise<any> {
    try {
      const requestBody: any = {
        messageId: options.messageIds,
      };

      switch (options.operation) {
        case "read":
          requestBody.action = "read";
          break;
        case "unread":
          requestBody.action = "unread";
          break;
        case "archive":
          requestBody.action = "archive";
          break;
        case "unarchive":
          requestBody.action = "unarchive";
          break;
        case "delete":
          requestBody.action = "delete";
          break;
        case "spam":
          requestBody.action = "spam";
          break;
        case "not_spam":
          requestBody.action = "notspam";
          break;
      }

      if (options.folderId) requestBody.folderId = options.folderId;
      if (options.flag) requestBody.flag = options.flag;
      if (options.tags) requestBody.tags = options.tags;

      const response = await this.httpClient.put(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/updatemessage`,
        requestBody
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to update emails: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Reply to an email
   */
  async replyToEmail(
    accountId: string,
    messageId: string,
    replyOptions: Omit<SendEmailOptions, "from"> & { from?: EmailAddress }
  ): Promise<any> {
    try {
      const response = await this.httpClient.post(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/messages/${messageId}`,
        replyOptions
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to reply to email: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(
    accountId: string,
    file: Buffer,
    filename: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", new Blob([file]), filename);

      const response = await this.httpClient.post(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/messages/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to upload attachment: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get folders
   */
  async getFolders(accountId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/folders`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to get folders: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Create folder
   */
  async createFolder(
    accountId: string,
    folderName: string,
    parentFolderId?: string
  ): Promise<any> {
    try {
      const requestBody: any = {
        folderName,
      };

      if (parentFolderId) {
        requestBody.parentFolderId = parentFolderId;
      }

      const response = await this.httpClient.post(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/folders`,
        requestBody
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to create folder: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(accountId: string, folderId: string): Promise<any> {
    try {
      const response = await this.httpClient.delete(
        `${this.config.apiDomain}/mail/v1/accounts/${accountId}/folders/${folderId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to delete folder: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeToken(): Promise<void> {
    try {
      const cachedTokenStr = await this.redis.get(this.tokenCacheKey);

      if (cachedTokenStr) {
        const cachedToken: CachedToken = JSON.parse(cachedTokenStr);

        if (cachedToken.refresh_token) {
          await axios.post(
            "https://accounts.zoho.com/oauth/v2/token/revoke",
            null,
            {
              params: {
                token: cachedToken.refresh_token,
              },
            }
          );
        }
      }

      await this.clearTokenCache();
    } catch (error: any) {
      throw new Error(
        `Failed to revoke token: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Check if client is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidAccessToken();
    return token !== null;
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
