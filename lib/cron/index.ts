import { processRewards } from "./reward-processor";
import { recoverStuckWithdrawals } from "./withdrawal-recovery";
import { logger } from "@/lib/logger";

/**
 * Run all scheduled tasks
 * This function should be called by a cron job scheduler
 */
export async function runScheduledTasks() {
  try {
    logger.info("Starting scheduled tasks");

    // Run withdrawal recovery process
    const withdrawalResults = await recoverStuckWithdrawals();

    // Run reward processing
    const rewardResult = await processRewards();
    logger.info("Reward processing completed", rewardResult);

    logger.info("Scheduled tasks completed", { withdrawalResults });
    return {
      success: true,
      results: {
        withdrawalRecovery: withdrawalResults,
        rewardProcessing: rewardResult,
      },
    };
  } catch (error) {
    logger.error("Error running scheduled tasks", { error });
    throw error;
  }
}
