"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import { SettingsService } from "@/lib/settings-service";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

// Profile update schema
const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    })
    .optional(),
  bio: z.string().max(160).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]+$/, {
      message: "Please enter a valid phone number.",
    })
    .optional(),
  address: z.string().optional(),
});

// Password update schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Notification settings schema
const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  securityAlerts: z.boolean().default(true),
  transactionUpdates: z.boolean().default(true),
  promotionalOffers: z.boolean().default(false),
});

// Appearance settings schema
const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  reducedMotion: z.boolean().default(false),
});

// Locale settings schema
const localeSchema = z.object({
  language: z.string().min(2).max(5).default("en"),
  timezone: z.string().default("UTC"),
  currency: z.string().min(3).max(3).default("NGN"),
});

/**
 * Get user settings
 */
export async function getUserSettings() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const settings = await SettingsService.getUserSettings(session.user.id);
    return { settings };
  } catch (error) {
    logger.error("Error in getUserSettings action", { error });
    return { error: "Failed to get user settings" };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  formData: z.infer<typeof profileSchema>
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate the form data
    const validatedData = profileSchema.parse(formData);

    // In a real application, you would update the user profile in your database
    // For example:
    // await prisma.user.update({
    //   where: { id: session.user.id },
    //   data: validatedData,
    // });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    logger.error("Error in updateUserProfile action", { error });

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }

    return { success: false, error: "Failed to update profile" };
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(
  formData: z.infer<typeof passwordSchema>
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate the form data
    const validatedData = passwordSchema.parse(formData);

    // In a real application, you would verify the current password
    // and update the password in your database
    // For example:
    // const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    // const isValid = await bcrypt.compare(validatedData.currentPassword, user.password);
    // if (!isValid) throw new Error("Current password is incorrect");
    //
    // const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
    // await prisma.user.update({
    //   where: { id: session.user.id },
    //   data: { password: hashedPassword },
    // });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    logger.error("Error in updateUserPassword action", { error });

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }

    return { success: false, error: "Failed to update password" };
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  formData: z.infer<typeof notificationSchema>
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate the form data
    const validatedData = notificationSchema.parse(formData);

    // Update notification settings
    await SettingsService.updateNotificationSettings(
      session.user.id,
      validatedData
    );

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    logger.error("Error in updateNotificationSettings action", { error });

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }

    return { success: false, error: "Failed to update notification settings" };
  }
}

/**
 * Update appearance settings
 */
export async function updateAppearanceSettings(
  formData: z.infer<typeof appearanceSchema>
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate the form data
    const validatedData = appearanceSchema.parse(formData);

    // Update appearance settings
    await SettingsService.updateAppearanceSettings(
      session.user.id,
      validatedData
    );

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    logger.error("Error in updateAppearanceSettings action", { error });

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }

    return { success: false, error: "Failed to update appearance settings" };
  }
}

/**
 * Update locale settings
 */
export async function updateLocaleSettings(
  formData: z.infer<typeof localeSchema>
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate the form data
    const validatedData = localeSchema.parse(formData);

    // Update locale settings
    await SettingsService.updateLocaleSettings(session.user.id, validatedData);

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    logger.error("Error in updateLocaleSettings action", { error });

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }

    return { success: false, error: "Failed to update locale settings" };
  }
}

/**
 * Reset user settings to defaults
 */
export async function resetUserSettings() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Reset settings to defaults
    await SettingsService.resetUserSettings(session.user.id);

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    logger.error("Error in resetUserSettings action", { error });
    return { success: false, error: "Failed to reset settings" };
  }
}

/**
 * Export user data
 */
export async function exportUserData() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // In a real application, you would gather all user data
    // and generate an export file

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return { success: true, downloadUrl: "/api/user/export-data" };
  } catch (error) {
    logger.error("Error in exportUserData action", { error });
    return { success: false, error: "Failed to export user data" };
  }
}

/**
 * Delete user account
 */
export async function deleteUserAccount() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // In a real application, you would delete or mark the user account for deletion
    // For example:
    // await prisma.user.update({
    //   where: { id: session.user.id },
    //   data: { status: "INACTIVE", isActive: false },
    // });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return { success: true };
  } catch (error) {
    logger.error("Error in deleteUserAccount action", { error });
    return { success: false, error: "Failed to delete account" };
  }
}

