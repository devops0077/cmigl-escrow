"use server";

import { revalidatePath } from "next/cache";
import cronJobService, { type CreateCronJobRequest } from "./cron-job-service";
import { logger } from "./logger";
import { auth } from "@/auth";

// Check if user is admin
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// Get all cron jobs
export async function getAllCronJobs() {
  try {
    if (!(await isAdmin())) {
      throw new Error("Unauthorized: Admin access required");
    }

    const jobs = await cronJobService.getAllJobs();
    return { success: true, data: jobs };
  } catch (error: any) {
    logger.error("Failed to fetch cron jobs", { error: error.message });
    return {
      success: false,
      error: error.message || "Failed to fetch cron jobs",
    };
  }
}

// Create a new cron job
export async function createCronJob(formData: FormData) {
  try {
    if (!(await isAdmin())) {
      throw new Error("Unauthorized: Admin access required");
    }

    const session = await auth();
    const id = formData.get("id") as string;
    const url = formData.get("url") as string;
    const schedule = formData.get("schedule") as string;
    const cronSecret = formData.get("cronSecret") as string;

    // Validate required fields
    if (!id || !url || !schedule) {
      throw new Error("Missing required fields");
    }

    // Validate cron schedule
    if (!cronJobService.validateCronSchedule(schedule)) {
      throw new Error("Invalid cron schedule format");
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    const jobData: CreateCronJobRequest = {
      id,
      url,
      schedule,
      cronSecret: cronSecret || undefined,
    };

    const result = await cronJobService.createJob(jobData);

    // Log the action
    logger.info("Cron job created", {
      jobId: id,
      adminId: session?.user?.id,
      adminEmail: session?.user?.email,
    });

    revalidatePath("/admin/cron-jobs");
    return { success: true, data: result };
  } catch (error: any) {
    logger.error("Failed to create cron job", { error: error.message });
    return {
      success: false,
      error: error.message || "Failed to create cron job",
    };
  }
}

// Delete a cron job
export async function deleteCronJob(id: string) {
  try {
    if (!(await isAdmin())) {
      throw new Error("Unauthorized: Admin access required");
    }

    const session = await auth();

    const result = await cronJobService.deleteJob(id);

    // Log the action
    logger.info("Cron job deleted", {
      jobId: id,
      adminId: session?.user?.id,
      adminEmail: session?.user?.email,
    });

    revalidatePath("/admin/cron-jobs");
    return { success: true, data: result };
  } catch (error: any) {
    logger.error("Failed to delete cron job", {
      jobId: id,
      error: error.message,
    });
    return {
      success: false,
      error: error.message || "Failed to delete cron job",
    };
  }
}

// Check cron server health
export async function checkCronServerHealth() {
  try {
    if (!(await isAdmin())) {
      throw new Error("Unauthorized: Admin access required");
    }

    const health = await cronJobService.checkHealth();
    return { success: true, data: health };
  } catch (error: any) {
    logger.error("Failed to check cron server health", {
      error: error.message,
    });
    return {
      success: false,
      error: error.message || "Failed to check cron server health",
    };
  }
}
