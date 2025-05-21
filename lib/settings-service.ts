import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { AppError } from "@/lib/error-class";

// Validation schemas
export const userSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().min(2).max(5).default("en"),
  timezone: z.string().default("UTC"),
  currency: z.string().min(3).max(3).default("NGN"),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  securityAlerts: z.boolean().default(true),
  transactionUpdates: z.boolean().default(true),
  promotionalOffers: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
});

export type UserSettingsInput = z.infer<typeof userSettingsSchema>;

export class SettingsService {
  /**
   * Get user settings by user ID
   */
  static async getUserSettings(userId: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Get or create user settings
      let settings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        // Create default settings if they don't exist
        settings = await prisma.userSettings.create({
          data: {
            userId,
            theme: "system",
            language: "en",
            timezone: "UTC",
            currency: "NGN",
            emailNotifications: true,
            smsNotifications: false,
            marketingEmails: false,
            securityAlerts: true,
            transactionUpdates: true,
            promotionalOffers: false,
            reducedMotion: false,
          },
        });
      }

      return settings;
    } catch (error) {
      logger.error("Error getting user settings", { userId, error });
      throw error;
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(
    userId: string,
    data: Partial<UserSettingsInput>
  ) {
    try {
      // Validate input data
      const validatedData = userSettingsSchema.partial().parse(data);

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check if settings exist, create if they don't
      const existingSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!existingSettings) {
        // Create settings with provided data and defaults for missing fields
        return await prisma.userSettings.create({
          data: {
            userId,
            ...validatedData,
          },
        });
      }

      // Update existing settings
      return await prisma.userSettings.update({
        where: { userId },
        data: validatedData,
      });
    } catch (error) {
      logger.error("Error updating user settings", { userId, data, error });
      throw error;
    }
  }

  /**
   * Reset user settings to defaults
   */
  static async resetUserSettings(userId: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Reset to defaults
      return await prisma.userSettings.update({
        where: { userId },
        data: {
          theme: "system",
          language: "en",
          timezone: "UTC",
          currency: "NGN",
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: false,
          securityAlerts: true,
          transactionUpdates: true,
          promotionalOffers: false,
          reducedMotion: false,
        },
      });
    } catch (error) {
      logger.error("Error resetting user settings", { userId, error });
      throw error;
    }
  }

  /**
   * Delete user settings
   */
  static async deleteUserSettings(userId: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Delete settings
      return await prisma.userSettings.delete({
        where: { userId },
      });
    } catch (error) {
      logger.error("Error deleting user settings", { userId, error });
      throw error;
    }
  }

  /**
   * Get user notification settings
   */
  static async getNotificationSettings(userId: string) {
    try {
      const settings = await this.getUserSettings(userId);

      return {
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        marketingEmails: settings.marketingEmails,
        securityAlerts: settings.securityAlerts,
        transactionUpdates: settings.transactionUpdates,
        promotionalOffers: settings.promotionalOffers,
      };
    } catch (error) {
      logger.error("Error getting notification settings", { userId, error });
      throw error;
    }
  }

  /**
   * Update user notification settings
   */
  static async updateNotificationSettings(
    userId: string,
    data: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      marketingEmails?: boolean;
      securityAlerts?: boolean;
      transactionUpdates?: boolean;
      promotionalOffers?: boolean;
    }
  ) {
    try {
      return await this.updateUserSettings(userId, data);
    } catch (error) {
      logger.error("Error updating notification settings", {
        userId,
        data,
        error,
      });
      throw error;
    }
  }

  /**
   * Get user appearance settings
   */
  static async getAppearanceSettings(userId: string) {
    try {
      const settings = await this.getUserSettings(userId);

      return {
        theme: settings.theme,
        reducedMotion: settings.reducedMotion,
      };
    } catch (error) {
      logger.error("Error getting appearance settings", { userId, error });
      throw error;
    }
  }

  /**
   * Update user appearance settings
   */
  static async updateAppearanceSettings(
    userId: string,
    data: {
      theme?: string;
      reducedMotion?: boolean;
    }
  ) {
    try {
      return await this.updateUserSettings(userId, data);
    } catch (error) {
      logger.error("Error updating appearance settings", {
        userId,
        data,
        error,
      });
      throw error;
    }
  }

  /**
   * Get user locale settings
   */
  static async getLocaleSettings(userId: string) {
    try {
      const settings = await this.getUserSettings(userId);

      return {
        language: settings.language,
        timezone: settings.timezone,
        currency: settings.currency,
      };
    } catch (error) {
      logger.error("Error getting locale settings", { userId, error });
      throw error;
    }
  }

  /**
   * Update user locale settings
   */
  static async updateLocaleSettings(
    userId: string,
    data: {
      language?: string;
      timezone?: string;
      currency?: string;
    }
  ) {
    try {
      return await this.updateUserSettings(userId, data);
    } catch (error) {
      logger.error("Error updating locale settings", { userId, data, error });
      throw error;
    }
  }
}
