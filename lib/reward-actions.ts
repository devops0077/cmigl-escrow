"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { auth } from "@/auth";
import { AppError } from "./error-class";
import { logger } from "./logger";
import { createNotification } from "./notification-service";
import { z } from "zod";
import { formatCurrency } from "./utils";

// Validation schemas
const rewardProgramSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const rewardCriteriaSchema = z.object({
  programId: z.string(),
  criteriaType: z.enum([
    "TRANSACTION_COUNT",
    "TRANSACTION_VOLUME",
    "ACCOUNT_AGE",
    "USER_ROLE",
    "CUSTOM",
  ]),
  minTransactions: z.number().optional(),
  minVolume: z.number().optional(),
  minAccountAge: z.number().optional(),
  userRole: z.enum(["USER", "ADMIN"]).optional(),
  customQuery: z.string().optional(),
});

const rewardScheduleSchema = z.object({
  programId: z.string(),
  scheduleType: z.enum(["ONE_TIME", "RECURRING"]),
  amount: z.number().positive(),
  currency: z.string().default("NGN"),
  startDate: z.date(),
  endDate: z.date().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  maxRewards: z.number().optional(),
});

// Helper function to check admin permissions
async function checkAdminPermission() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    throw new AppError("Unauthorized: Admin access required", 403);
  }

  return user;
}

// Log reward-related actions for audit
async function logRewardAction(
  programId: string,
  actionType: string,
  details: any,
  adminId: string,
  req?: Request
) {
  try {
    const ipAddress =
      req?.headers.get("x-forwarded-for") ||
      req?.headers.get("x-real-ip") ||
      null;
    const userAgent = req?.headers.get("user-agent") || null;

    await prisma.rewardAuditLog.create({
      data: {
        programId,
        actionType: actionType as any,
        performedById: adminId,
        details,
        ipAddress: ipAddress as string,
        userAgent: userAgent as string,
      },
    });
  } catch (error) {
    logger.error("Failed to log reward action", {
      error,
      programId,
      actionType,
    });
  }
}

// Create a new reward program
export async function createRewardProgram(
  data: z.infer<typeof rewardProgramSchema>,
  req?: Request
) {
  try {
    const admin = await checkAdminPermission();

    // Validate input data
    const validatedData = rewardProgramSchema.parse(data);

    // Create the reward program
    const program = await prisma.rewardProgram.create({
      data: {
        ...validatedData,
        createdById: admin.id,
      },
    });

    // Log the action
    await logRewardAction(
      program.id,
      "PROGRAM_CREATED",
      { programData: validatedData },
      admin.id,
      req
    );

    revalidatePath("/admin/rewards");
    return program;
  } catch (error) {
    logger.error("Error creating reward program", { error });
    if (error instanceof z.ZodError) {
      throw new AppError(
        "Invalid input data: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }
    throw error;
  }
}

// Update an existing reward program
export async function updateRewardProgram(
  id: string,
  data: z.infer<typeof rewardProgramSchema>,
  req?: Request
) {
  try {
    const admin = await checkAdminPermission();

    // Validate input data
    const validatedData = rewardProgramSchema.parse(data);

    // Check if program exists
    const existingProgram = await prisma.rewardProgram.findUnique({
      where: { id },
    });

    if (!existingProgram) {
      throw new AppError("Reward program not found", 404);
    }

    // Update the program
    const updatedProgram = await prisma.rewardProgram.update({
      where: { id },
      data: validatedData,
    });

    // Log the action
    await logRewardAction(
      id,
      "PROGRAM_UPDATED",
      {
        previousData: existingProgram,
        newData: validatedData,
      },
      admin.id,
      req
    );

    revalidatePath("/admin/rewards");
    return updatedProgram;
  } catch (error) {
    logger.error("Error updating reward program", { error, programId: id });
    if (error instanceof z.ZodError) {
      throw new AppError(
        "Invalid input data: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }
    throw error;
  }
}

// Add criteria to a reward program
export async function addRewardCriteria(
  data: z.infer<typeof rewardCriteriaSchema>,
  req?: Request
) {
  try {
    const admin = await checkAdminPermission();

    // Validate input data
    const validatedData = rewardCriteriaSchema.parse(data);

    // Check if program exists
    const program = await prisma.rewardProgram.findUnique({
      where: { id: validatedData.programId },
    });

    if (!program) {
      throw new AppError("Reward program not found", 404);
    }

    // Create the criteria
    const criteria = await prisma.rewardCriteria.create({
      data: validatedData,
    });

    // Log the action
    await logRewardAction(
      validatedData.programId,
      "CRITERIA_ADDED",
      { criteriaData: validatedData },
      admin.id,
      req
    );

    revalidatePath("/admin/rewards");
    return criteria;
  } catch (error) {
    logger.error("Error adding reward criteria", { error });
    if (error instanceof z.ZodError) {
      throw new AppError(
        "Invalid input data: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }
    throw error;
  }
}

// Add schedule to a reward program
export async function addRewardSchedule(
  data: z.infer<typeof rewardScheduleSchema>,
  req?: Request
) {
  try {
    const admin = await checkAdminPermission();

    // Validate input data
    const validatedData = rewardScheduleSchema.parse(data);

    // Check if program exists
    const program = await prisma.rewardProgram.findUnique({
      where: { id: validatedData.programId },
    });

    if (!program) {
      throw new AppError("Reward program not found", 404);
    }

    // Calculate next run date
    const nextRun = new Date(validatedData.startDate);

    // Create the schedule
    const schedule = await prisma.rewardSchedule.create({
      data: {
        ...validatedData,
        nextRun,
      },
    });

    // Log the action
    await logRewardAction(
      validatedData.programId,
      "SCHEDULE_ADDED",
      { scheduleData: validatedData },
      admin.id,
      req
    );

    revalidatePath("/admin/rewards");
    return schedule;
  } catch (error) {
    logger.error("Error adding reward schedule", { error });
    if (error instanceof z.ZodError) {
      throw new AppError(
        "Invalid input data: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }
    throw error;
  }
}

// Get all reward programs (admin only)
export async function getRewardPrograms() {
  try {
    await checkAdminPermission();

    const programs = await prisma.rewardProgram.findMany({
      include: {
        criteria: true,
        schedules: true,
        _count: {
          select: {
            distributions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return programs;
  } catch (error) {
    logger.error("Error getting reward programs", { error });
    throw error;
  }
}

// Get a specific reward program with details
export async function getRewardProgram(id: string) {
  try {
    await checkAdminPermission();

    const program = await prisma.rewardProgram.findUnique({
      where: { id },
      include: {
        criteria: true,
        schedules: true,
        distributions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
          orderBy: {
            distributedAt: "desc",
          },
          take: 100,
        },
        auditLogs: {
          orderBy: {
            timestamp: "desc",
          },
          take: 50,
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!program) {
      throw new AppError("Reward program not found", 404);
    }

    return program;
  } catch (error) {
    logger.error("Error getting reward program details", {
      error,
      programId: id,
    });
    throw error;
  }
}

// Delete a reward program
export async function deleteRewardProgram(id: string, req?: Request) {
  try {
    const admin = await checkAdminPermission();

    // Check if program exists
    const program = await prisma.rewardProgram.findUnique({
      where: { id },
    });

    if (!program) {
      throw new AppError("Reward program not found", 404);
    }

    // Store program data for audit log before deletion
    const programData = { ...program };

    // Delete the program (cascades to criteria, schedules, etc.)
    await prisma.rewardProgram.delete({
      where: { id },
    });

    // Log the action
    await logRewardAction(
      id,
      "PROGRAM_DELETED",
      { deletedProgram: programData },
      admin.id,
      req
    );

    revalidatePath("/admin/rewards");
    return { success: true };
  } catch (error) {
    logger.error("Error deleting reward program", { error, programId: id });
    throw error;
  }
}

// Manually issue a reward to a specific user
export async function issueManualReward(
  programId: string,
  userId: string,
  amount: number,
  reason: string,
  req?: Request
) {
  try {
    const admin = await checkAdminPermission();

    // Check if program exists
    const program = await prisma.rewardProgram.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new AppError("Reward program not found", 404);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.wallet) {
      throw new AppError("User wallet not found", 404);
    }

    // Create a transaction in the user's wallet
    const walletTransaction = await prisma.walletTransaction.create({
      data: {
        walletId: user.wallet.id,
        amount,
        type: "REWARD",
        status: "COMPLETED",
        description: `Reward: ${program.name} - ${reason}`,
        metadata: {
          programId,
          manuallyIssued: true,
          issuedBy: admin.id,
          reason,
        },
      },
    });

    // Update the user's wallet balance
    await prisma.wallet.update({
      where: { id: user.wallet.id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    // Create a reward distribution record
    const distribution = await prisma.rewardDistribution.create({
      data: {
        programId,
        userId,
        amount,
        currency: "NGN",
        status: "PROCESSED",
        transactionId: walletTransaction.id,
        processedAt: new Date(),
        metadata: {
          manuallyIssued: true,
          issuedBy: admin.id,
          reason,
        },
      },
    });

    // Log the action
    await logRewardAction(
      programId,
      "MANUAL_REWARD_ISSUED",
      {
        userId,
        amount,
        reason,
        transactionId: walletTransaction.id,
        distributionId: distribution.id,
      },
      admin.id,
      req
    );

    // Create a notification for the user
    await createNotification({
      userId,
      type: "SYSTEM_NOTIFICATION",
      title: "Reward Received",
      message: `You have received a reward of ₦${amount.toFixed(2)} for ${reason}`,
      data: {
        programId,
        amount,
        reason,
      },
    });

    revalidatePath("/admin/rewards");
    return { success: true, distribution };
  } catch (error) {
    logger.error("Error issuing manual reward", { error, programId, userId });
    throw error;
  }
}

// Process scheduled rewards
export async function processScheduledRewards() {
  try {
    // Find all active schedules that are due to run
    const now = new Date();
    const dueSchedules = await prisma.rewardSchedule.findMany({
      where: {
        isActive: true,
        nextRun: {
          lte: now,
        },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        AND: [
          {
            OR: [
              { maxRewards: null },
              {
                maxRewards: {
                  gt: prisma.rewardSchedule.fields.rewardsIssued,
                },
              },
            ],
          },
        ],
      },
      include: {
        program: {
          include: {
            criteria: true,
          },
        },
      },
    });

    logger.info(`Found ${dueSchedules.length} reward schedules to process`);

    for (const schedule of dueSchedules) {
      await processRewardSchedule(schedule);
    }

    return { processed: dueSchedules.length };
  } catch (error) {
    logger.error("Error processing scheduled rewards", { error });
    throw error;
  }
}

// Process a single reward schedule
async function processRewardSchedule(schedule: any) {
  try {
    logger.info(`Processing reward schedule: ${schedule.id}`, {
      programName: schedule.program.name,
    });

    // Find eligible users based on criteria
    const eligibleUsers = await findEligibleUsers(schedule.program.criteria);

    logger.info(`Found ${eligibleUsers.length} eligible users for reward`, {
      scheduleId: schedule.id,
      programId: schedule.programId,
    });

    // Calculate how many rewards we can issue
    let rewardsToIssue = eligibleUsers.length;
    if (schedule.maxRewards) {
      const remainingRewards = schedule.maxRewards - schedule.rewardsIssued;
      rewardsToIssue = Math.min(rewardsToIssue, remainingRewards);
    }

    // Issue rewards to eligible users
    const distributions = [];
    for (let i = 0; i < rewardsToIssue; i++) {
      const user = eligibleUsers[i];
      try {
        const distribution = await issueReward(
          schedule.programId,
          user.id,
          schedule.amount,
          `Scheduled reward: ${schedule.program.name}`
        );
        distributions.push(distribution);
      } catch (error) {
        logger.error(`Failed to issue reward to user ${user.id}`, {
          error,
          scheduleId: schedule.id,
        });
      }
    }

    // Update schedule information
    const nextRun = calculateNextRunDate(schedule);
    await prisma.rewardSchedule.update({
      where: { id: schedule.id },
      data: {
        lastRun: new Date(),
        nextRun,
        rewardsIssued: {
          increment: distributions.length,
        },
      },
    });

    const firstAdmin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (!firstAdmin) {
      throw new AppError("No admin user on platform.");
    }

    // Log the action
    await logRewardAction(
      schedule.programId,
      "REWARDS_DISTRIBUTED",
      {
        scheduleId: schedule.id,
        eligibleUsers: eligibleUsers.length,
        rewardsIssued: distributions.length,
        nextRun,
      },
      firstAdmin.id // System-initiated action
    );

    return {
      success: true,
      rewardsIssued: distributions.length,
      nextRun,
    };
  } catch (error) {
    logger.error("Error processing reward schedule", {
      error,
      scheduleId: schedule.id,
    });
    throw error;
  }
}

// Find eligible users based on criteria
async function findEligibleUsers(criteria: any[]) {
  // Start with a base query to find active users
  const userQuery: any = {
    where: {
      isActive: true,
      restricted: false,
      status: "ACTIVE",
      wallet: {
        isNot: null,
      },
    },
    include: {
      wallet: true,
    },
  };

  // Apply each criterion
  for (const criterion of criteria) {
    switch (criterion.criteriaType) {
      case "TRANSACTION_COUNT":
        if (criterion.minTransactions) {
          userQuery.where.sentTransactions = {
            some: {
              status: "COMPLETED",
            },
          };
          userQuery.include.sentTransactions = {
            where: {
              status: "COMPLETED",
            },
          };
          // We'll filter by count after fetching
        }
        break;

      case "TRANSACTION_VOLUME":
        if (criterion.minVolume) {
          userQuery.where.sentTransactions = {
            some: {
              status: "COMPLETED",
            },
          };
          userQuery.include.sentTransactions = {
            where: {
              status: "COMPLETED",
            },
          };
          // We'll filter by volume after fetching
        }
        break;

      case "ACCOUNT_AGE":
        if (criterion.minAccountAge) {
          const minDate = new Date();
          minDate.setDate(minDate.getDate() - criterion.minAccountAge);
          userQuery.where.createdAt = {
            lte: minDate,
          };
        }
        break;

      case "USER_ROLE":
        if (criterion.userRole) {
          userQuery.where.role = criterion.userRole;
        }
        break;

      case "CUSTOM":
        if (criterion.customQuery) {
          try {
            const customConditions = JSON.parse(criterion.customQuery);
            userQuery.where = {
              ...userQuery.where,
              ...customConditions,
            };
          } catch (error) {
            logger.error("Invalid custom query in reward criteria", {
              error,
              criterionId: criterion.id,
              customQuery: criterion.customQuery,
            });
          }
        }
        break;
    }
  }

  // Execute the query
  const users = await prisma.user.findMany(userQuery);

  // Apply post-query filters
  return users.filter((user) => {
    for (const criterion of criteria) {
      switch (criterion.criteriaType) {
        case "TRANSACTION_COUNT":
          if (
            criterion.minTransactions &&
            (!user.sentTransactions ||
              user.sentTransactions.length < criterion.minTransactions)
          ) {
            return false;
          }
          break;

        case "TRANSACTION_VOLUME":
          if (criterion.minVolume) {
            const totalVolume =
              user.sentTransactions?.reduce((sum, tx) => sum + tx.amount, 0) ||
              0;
            if (totalVolume < criterion.minVolume) {
              return false;
            }
          }
          break;
      }
    }
    return true;
  });
}

// Issue a reward to a user
async function issueReward(
  programId: string,
  userId: string,
  amount: number,
  description: string
) {
  // Get user and wallet
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user || !user.wallet) {
    throw new AppError("User or wallet not found", 404);
  }

  // Create a transaction in the user's wallet
  const walletTransaction = await prisma.walletTransaction.create({
    data: {
      walletId: user.wallet.id,
      amount,
      type: "REWARD",
      status: "COMPLETED",
      description,
      metadata: {
        programId,
        automated: true,
      },
    },
  });

  // Update the user's wallet balance
  await prisma.wallet.update({
    where: { id: user.wallet.id },
    data: {
      balance: {
        increment: amount,
      },
    },
  });

  // Create a reward distribution record
  const distribution = await prisma.rewardDistribution.create({
    data: {
      programId,
      userId,
      amount,
      currency: "NGN",
      status: "PROCESSED",
      transactionId: walletTransaction.id,
      processedAt: new Date(),
      metadata: {
        automated: true,
      },
    },
  });

  // Create a notification for the user
  await createNotification({
    userId,
    type: "SYSTEM_NOTIFICATION",
    title: "Reward Received",
    message: `You have received a reward of ${formatCurrency(amount)}`,
    data: {
      programId,
      amount,
    },
  });

  return distribution;
}

// Calculate the next run date for a recurring schedule
function calculateNextRunDate(schedule: any) {
  if (schedule.scheduleType === "ONE_TIME") {
    return null;
  }

  const now = new Date();
  const nextRun = new Date(now);

  switch (schedule.frequency) {
    case "DAILY":
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
      break;

    case "WEEKLY":
      // Set to next occurrence of the specified day of week
      const dayOfWeek = schedule.dayOfWeek || 0; // Default to Sunday
      nextRun.setDate(
        nextRun.getDate() + ((dayOfWeek + 7 - nextRun.getDay()) % 7)
      );
      if (nextRun.getTime() <= now.getTime()) {
        nextRun.setDate(nextRun.getDate() + 7);
      }
      nextRun.setHours(0, 0, 0, 0);
      break;

    case "MONTHLY":
      // Set to the specified day of month
      const dayOfMonth = schedule.dayOfMonth || 1; // Default to 1st
      nextRun.setDate(1); // First set to 1st of current month
      nextRun.setMonth(nextRun.getMonth() + 1); // Move to next month
      nextRun.setDate(
        Math.min(
          dayOfMonth,
          getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth())
        )
      ); // Set to specified day or last day of month
      nextRun.setHours(0, 0, 0, 0);
      break;

    default:
      return null;
  }

  return nextRun;
}

// Helper to get days in a month
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Get user's reward history
export async function getUserRewardHistory(limit = 10, page = 1) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError("Unauthorized", 401);
    }

    const skip = (page - 1) * limit;

    const [rewards, total] = await Promise.all([
      prisma.rewardDistribution.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          program: {
            select: {
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          distributedAt: "desc",
        },
        take: limit,
        skip,
      }),
      prisma.rewardDistribution.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    return {
      data: rewards,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error getting user reward history", { error });
    throw error;
  }
}
