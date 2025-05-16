import { logger } from "../logger";
import { processScheduledRewards } from "../reward-actions";

export async function processRewards() {
  try {
    logger.info("Starting scheduled reward processing");

    const result = await processScheduledRewards();

    logger.info(`Processed ${result.processed} reward schedules`);

    return { success: true, processed: result.processed };
  } catch (error) {
    logger.error("Error processing scheduled rewards", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
