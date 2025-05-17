// Types for cron job management

export interface CronJob {
  id: string;
  url: string;
  schedule: string;
  cronSecret?: string;
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

export interface CronJobResponse {
  message: string;
  job: CronJob;
}

export interface ServerHealthResponse {
  status: string;
  timestamp: string;
  activeJobs: number;
}

export interface CronJobActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
