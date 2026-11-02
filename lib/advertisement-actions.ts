"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { AppError } from "./error-class";
import { logger } from "./logger";
import { z } from "zod";
import { AdPlacement } from "./generated/prisma";

// Validation schemas
const adContentSchema = z.object({
  // Common fields for all ad types
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),

  // Banner specific
  bannerSize: z.enum(["small", "medium", "large", "custom"]).optional(),
  bannerWidth: z.number().optional(),
  bannerHeight: z.number().optional(),

  // Flash banner specific
  animationData: z.any().optional(),
  animationDuration: z.number().optional(),

  // Popup specific
  popupTiming: z.number().optional(), // Seconds before popup appears
  dismissible: z.boolean().optional(),

  // Reward promo specific
  rewardId: z.string().optional(),
  rewardDetails: z.any().optional(),

  // Custom HTML/CSS
  customHtml: z.string().optional(),
  customCss: z.string().optional(),

  // Button text and styling
  ctaText: z.string().optional(),
  ctaStyle: z.string().optional(),
});

const advertisementSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  type: z.enum(["BANNER", "POPUP", "FLASH", "TEXT", "REWARD_PROMO"]),
  content: adContentSchema,
  status: z
    .enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "SCHEDULED"])
    .default("DRAFT"),
  priority: z.number().int().min(1).max(10).default(1),
  maxImpressions: z.number().int().optional(),
  maxClicks: z.number().int().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  linkedRewardId: z.string().optional(),
});

const targetingRuleSchema = z.object({
  advertisementId: z.string(),
  ruleType: z.enum([
    "USER_ROLE",
    "TRANSACTION_HISTORY",
    "ACCOUNT_AGE",
    "REWARD_ELIGIBILITY",
    "LOCATION",
    "CUSTOM",
  ]),
  conditions: z.any(), // Flexible JSON structure
});

const displayRuleSchema = z.object({
  advertisementId: z.string(),
  placement: z.enum([
    "HOMEPAGE",
    "DASHBOARD",
    "SIDEBAR",
    "TRANSACTION_PAGE",
    "WALLET_PAGE",
    "PROFILE_PAGE",
    "GLOBAL",
  ]),
  frequency: z
    .enum([
      "EVERY_TIME",
      "ONCE_PER_SESSION",
      "ONCE_PER_DAY",
      "ONCE_PER_WEEK",
      "CUSTOM",
    ])
    .default("EVERY_TIME"),
  displayLimit: z.number().int().optional(),
  timeFrame: z.number().int().optional(),
});

// Helper function to check admin permissions
async function checkAdminPermission() {
  const session = await auth.api.getSession({ headers: await headers() });

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

// Log ad-related actions for audit
async function logAdAction(
  adId: string,
  actionType: string,
  details: any,
  adminId: string
) {
  try {
    logger.info(`Ad action: ${actionType}`, {
      adId,
      adminId,
      details,
    });
  } catch (error) {
    logger.error("Failed to log ad action", {
      error,
      adId,
      actionType,
    });
  }
}

// Create a new advertisement
export async function createAdvertisement(
  data: z.infer<typeof advertisementSchema>
) {
  try {
    const admin = await checkAdminPermission();

    // Validate input data
    const validatedData = advertisementSchema.parse(data);

    // Create the advertisement
    const advertisement = await prisma.advertisement.create({
      data: {
        ...validatedData,
        content: validatedData.content,
        createdById: admin.id,
      },
    });

    // Log the action
    await logAdAction(
      advertisement.id,
      "ADVERTISEMENT_CREATED",
      { adData: validatedData },
      admin.id
    );

    revalidatePath("/admin/advertisements");
    return advertisement;
  } catch (error) {
    logger.error("Error creating advertisement", { error });
    if (error instanceof z.ZodError) {
      throw new AppError(
        "Invalid input data: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }
    throw error;
  }
}

// Update an existing advertisement
export async function updateAdvertisement(
  id: string,
  data: z.infer<typeof advertisementSchema>
) {
  try {
    const admin = await checkAdminPermission();

    // Validate input data
    const validatedData = advertisementSchema.parse(data);

    // Check if advertisement exists
    const existingAd = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!existingAd) {
      throw new AppError("Advertisement not found", 404);
    }

    // Update the advertisement
    const updatedAd = await prisma.advertisement.update({
      where: { id },
      data: validatedData,
    });

    // Log the action
    await logAdAction(
      id,
      "ADVERTISEMENT_UPDATED",
      {
        previousData: existingAd,
        newData: validatedData,
      },
      admin.id
    );

    revalidatePath("/admin/advertisements");
    return updatedAd;
  } catch (error) {
    logger.error("Error updating advertisement", { error, adId: id });
    if (error instanceof z.ZodError) {
      throw new AppError(
        "Invalid input data: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }
    throw error;
  }
}

// Add targeting rule to an advertisement
export async function addTargetingRule(
  data: z.infer<typeof targetingRuleSchema>
) {
  try {
    const admin = await checkAdminPermission();

    // Validate input data
    const validatedData = targetingRuleSchema.parse(data);

    // Check if advertisement exists
    const ad = await prisma.advertisement.findUnique({
      where: { id: validatedData.advertisementId },
    });

    if (!ad) {
      throw new AppError("Advertisement not found", 404);
    }

    // Create the targeting rule
    const rule = await prisma.targetingRule.create({
      data: validatedData,
    });

    // Log the action
    await logAdAction(
      validatedData.advertisementId,
      "TARGETING_RULE_ADDED",
      { ruleData: validatedData },
      admin.id
    );

    revalidatePath("/admin/advertisements");
    return rule;
  } catch (error) {
    logger.error("Error adding targeting rule", { error });
    if (error instanceof z.ZodError) {
      throw new AppError(
        "Invalid input data: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }
    throw error;
  }
}

// Add display rule to an advertisement
export async function addDisplayRule(data: z.infer<typeof displayRuleSchema>) {
  try {
    const admin = await checkAdminPermission();

    // Validate input data
    const validatedData = displayRuleSchema.parse(data);

    // Check if advertisement exists
    const ad = await prisma.advertisement.findUnique({
      where: { id: validatedData.advertisementId },
    });

    if (!ad) {
      throw new AppError("Advertisement not found", 404);
    }

    // Create the display rule
    const rule = await prisma.displayRule.create({
      data: validatedData,
    });

    // Log the action
    await logAdAction(
      validatedData.advertisementId,
      "DISPLAY_RULE_ADDED",
      { ruleData: validatedData },
      admin.id
    );

    revalidatePath("/admin/advertisements");
    return rule;
  } catch (error) {
    logger.error("Error adding display rule", { error });
    if (error instanceof z.ZodError) {
      throw new AppError(
        "Invalid input data: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }
    throw error;
  }
}

// Get all advertisements (admin only)
export async function getAdminAdvertisements() {
  try {
    await checkAdminPermission();

    const advertisements = await prisma.advertisement.findMany({
      include: {
        targetingRules: true,
        displayRules: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        linkedReward: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            impressions: true,
            clicks: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return advertisements;
  } catch (error) {
    logger.error("Error getting advertisements", { error });
    throw error;
  }
}

// Get all reward programs (for linking to advertisements)
export async function getRewardPrograms() {
  try {
    await checkAdminPermission();

    const rewardPrograms = await prisma.rewardProgram.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return rewardPrograms;
  } catch (error) {
    logger.error("Error getting reward programs", { error });
    throw error;
  }
}

// Get a specific advertisement with details
export async function getAdvertisement(id: string) {
  try {
    await checkAdminPermission();

    const advertisement = await prisma.advertisement.findUnique({
      where: { id },
      include: {
        targetingRules: true,
        displayRules: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        linkedReward: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            impressions: true,
            clicks: true,
          },
        },
      },
    });

    if (!advertisement) {
      throw new AppError("Advertisement not found", 404);
    }

    return advertisement;
  } catch (error) {
    logger.error("Error getting advertisement details", {
      error,
      adId: id,
    });
    throw error;
  }
}

// Delete an advertisement
export async function deleteAdvertisement(id: string) {
  try {
    const admin = await checkAdminPermission();

    // Check if advertisement exists
    const ad = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new AppError("Advertisement not found", 404);
    }

    // Store advertisement data for audit log before deletion
    const adData = { ...ad };

    // Delete the advertisement (cascades to rules, impressions, clicks, etc.)
    await prisma.advertisement.delete({
      where: { id },
    });

    // Log the action
    await logAdAction(
      id,
      "ADVERTISEMENT_DELETED",
      { deletedAd: adData },
      admin.id
    );

    revalidatePath("/admin/advertisements");
    return { success: true };
  } catch (error) {
    logger.error("Error deleting advertisement", { error, adId: id });
    throw error;
  }
}

// Record an impression
export async function recordAdImpression(adId: string, placement: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    // Check if the advertisement exists
    const ad = await prisma.advertisement.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      throw new AppError("Advertisement not found", 404);
    }

    // Create impression record
    const impression = await prisma.adImpression.create({
      data: {
        advertisementId: adId,
        userId: session?.user?.id,
        placement: placement as any,
        sessionId: session?.user
          ? undefined
          : Math.random().toString(36).substring(2, 15),
      },
    });

    // Check if max impressions has been reached
    if (ad.maxImpressions) {
      const impressionCount = await prisma.adImpression.count({
        where: { advertisementId: adId },
      });

      if (impressionCount >= ad.maxImpressions) {
        await prisma.advertisement.update({
          where: { id: adId },
          data: { status: "COMPLETED" },
        });
      }
    }

    return impression;
  } catch (error) {
    logger.error("Error recording ad impression", { error, adId });
    // Don't throw here - just log the error to avoid affecting user experience
    return null;
  }
}

// Record a click
export async function recordAdClick(adId: string, placement: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    // Check if the advertisement exists
    const ad = await prisma.advertisement.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      throw new AppError("Advertisement not found", 404);
    }

    // Create click record
    const click = await prisma.adClick.create({
      data: {
        advertisementId: adId,
        userId: session?.user?.id,
        placement: placement as any,
        sessionId: session?.user
          ? undefined
          : Math.random().toString(36).substring(2, 15),
      },
    });

    // Check if max clicks has been reached
    if (ad.maxClicks) {
      const clickCount = await prisma.adClick.count({
        where: { advertisementId: adId },
      });

      if (clickCount >= ad.maxClicks) {
        await prisma.advertisement.update({
          where: { id: adId },
          data: { status: "COMPLETED" },
        });
      }
    }

    return click;
  } catch (error) {
    logger.error("Error recording ad click", { error, adId });
    // Don't throw here - just log the error to avoid affecting user experience
    return null;
  }
}

// Get ads for public display (filtered by targeting and display rules)
export async function getAdsForDisplay(placement: AdPlacement) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    const now = new Date();

    // Base query to find active ads for this placement
    const baseQuery = {
      where: {
        status: "ACTIVE",
        startDate: { lte: now },
        // endDate: { gte: now },
        // displayRules: {
        //   some: {
        //     OR: [{ placement: placement as any }, { placement: "GLOBAL" }],
        //   },
        // },
      },
      include: {
        targetingRules: true,
        displayRules: true,
        linkedReward: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        priority: "desc",
      },
    };

    // Get all potentially relevant ads
    const allAds = await prisma.advertisement.findMany(baseQuery);

    // Filter ads based on targeting rules
    const applicableAds = await Promise.all(
      allAds.map(async (ad) => {
        // If no targeting rules, show to everyone
        if (ad.targetingRules.length === 0) {
          return ad;
        }

        // If user is not logged in, only show ads without user-specific targeting
        if (!userId) {
          const hasUserTargeting = ad.targetingRules.some((rule) =>
            [
              "USER_ROLE",
              "TRANSACTION_HISTORY",
              "ACCOUNT_AGE",
              "REWARD_ELIGIBILITY",
            ].includes(rule.ruleType)
          );
          if (hasUserTargeting) {
            return null;
          }
          return ad;
        }

        // Process each targeting rule
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            sentTransactions: true,
            wallet: true,
          },
        });

        if (!user) return null;

        // Check if user matches all targeting rules
        for (const rule of ad.targetingRules) {
          switch (rule.ruleType) {
            case "USER_ROLE":
              if (
                rule.conditions.roles &&
                !rule.conditions.roles.includes(user.role)
              ) {
                return null;
              }
              break;

            case "TRANSACTION_HISTORY":
              const minTransactions = rule.conditions.minTransactions || 0;
              const minVolume = rule.conditions.minVolume || 0;
              const completedTransactions = user.sentTransactions.filter(
                (tx) => tx.status === "COMPLETED"
              );

              if (completedTransactions.length < minTransactions) {
                return null;
              }

              const totalVolume = completedTransactions.reduce(
                (sum, tx) => sum + tx.amount,
                0
              );
              if (totalVolume < minVolume) {
                return null;
              }
              break;

            case "ACCOUNT_AGE":
              const minDays = rule.conditions.minDays || 0;
              const userCreatedAt = new Date(user.createdAt);
              const daysSinceCreation = Math.floor(
                (now.getTime() - userCreatedAt.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              if (daysSinceCreation < minDays) {
                return null;
              }
              break;

            case "REWARD_ELIGIBILITY":
              // TODO: Implement reward eligibility check
              break;

            case "CUSTOM":
              // Custom rules would need to be implemented based on specific requirements
              break;
          }
        }

        // Check frequency rules
        for (const rule of ad.displayRules) {
          if (rule.placement !== placement && rule.placement !== "GLOBAL")
            continue;

          if (rule.frequency !== "EVERY_TIME") {
            // Check if user has seen this ad recently
            const timeFrame = rule.timeFrame || 24; // Default to 24 hours
            const limitDate = new Date(
              now.getTime() - timeFrame * 60 * 60 * 1000
            );

            const recentImpressions = await prisma.adImpression.count({
              where: {
                advertisementId: ad.id,
                userId,
                timestamp: { gte: limitDate },
              },
            });

            const displayLimit = rule.displayLimit || 1;
            if (recentImpressions >= displayLimit) {
              return null;
            }
          }
        }

        return ad;
      })
    );

    // Filter out null results and limit to max 3 ads
    return applicableAds.filter(Boolean).slice(0, 3);
  } catch (error) {
    logger.error("Error getting ads for display", { error, placement });
    return []; // Return empty array instead of throwing to avoid affecting user experience
  }
}

// Get advertisement analytics
export async function getAdvertisementAnalytics(id: string) {
  try {
    await checkAdminPermission();

    const ad = await prisma.advertisement.findUnique({
      where: { id },
      include: {
        impressions: {
          select: {
            id: true,
            userId: true,
            timestamp: true,
            placement: true,
          },
          orderBy: {
            timestamp: "desc",
          },
          take: 100, // Limit to last 100 impressions
        },
        clicks: {
          select: {
            id: true,
            userId: true,
            timestamp: true,
            placement: true,
          },
          orderBy: {
            timestamp: "desc",
          },
          take: 100, // Limit to last 100 clicks
        },
        _count: {
          select: {
            impressions: true,
            clicks: true,
          },
        },
      },
    });

    if (!ad) {
      throw new AppError("Advertisement not found", 404);
    }

    // Get daily stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) FILTER (WHERE "table" = 'impression') as impressions,
        COUNT(*) FILTER (WHERE "table" = 'click') as clicks
      FROM (
        SELECT timestamp, 'impression' as "table" FROM "AdImpression" 
        WHERE "advertisementId" = ${id} AND timestamp >= ${thirtyDaysAgo}
        UNION ALL
        SELECT timestamp, 'click' as "table" FROM "AdClick" 
        WHERE "advertisementId" = ${id} AND timestamp >= ${thirtyDaysAgo}
      ) as combined
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp) ASC
    `;

    // Calculate CTR (Click-Through Rate)
    const totalImpressions = ad._count.impressions;
    const totalClicks = ad._count.clicks;
    const ctr =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      id: ad.id,
      name: ad.name,
      totalImpressions,
      totalClicks,
      ctr,
      recentImpressions: ad.impressions,
      recentClicks: ad.clicks,
      dailyStats,
    };
  } catch (error) {
    logger.error("Error getting advertisement analytics", { error, adId: id });
    throw error;
  }
}

