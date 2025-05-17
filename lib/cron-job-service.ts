// Types for cron job management
export interface CronJob {
  id: string;
  url: string;
  schedule: string;
  createdAt: string;
  createdBy: string;
  lastRun?: string;
  lastStatus?: "success" | "error";
  lastError?: string;
}

export interface CreateCronJobRequest {
  id: string;
  url: string;
  schedule: string;
  cronSecret?: string;
}

// Service for interacting with the cron job server
export class CronJobService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.CRON_SERVER_URL as string;
    this.apiKey = process.env.CRON_SERVER_API_KEY as string;
  }

  // Helper method to make authenticated requests to the cron server
  private async request<T>(
    endpoint: string,
    method = "GET",
    body?: any
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        "Content-Type": "application/json",
        "x-api-Key": String(this.apiKey),
      };

      const options: RequestInit = {
        method,
        headers,
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Cron job server request failed:", error);
      throw error;
    }
  }

  // Get all cron jobs
  async getAllJobs(): Promise<Record<string, CronJob>> {
    return this.request<Record<string, CronJob>>("/jobs");
  }

  // Create a new cron job
  async createJob(
    job: CreateCronJobRequest
  ): Promise<{ message: string; job: CronJob }> {
    return this.request<{ message: string; job: CronJob }>(
      "/jobs",
      "POST",
      job
    );
  }

  // Delete a cron job
  async deleteJob(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/jobs/${id}`, "DELETE");
  }

  // Check server health
  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    activeJobs: number;
  }> {
    return this.request<{
      status: string;
      timestamp: string;
      activeJobs: number;
    }>("/health");
  }

  // Validate cron schedule format
  validateCronSchedule(schedule: string): boolean {
    // Basic validation for cron schedule format
    const cronRegex =
      /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    return cronRegex.test(schedule);
  }
}

// Create a singleton instance
const cronJobService = new CronJobService();
export default cronJobService;
