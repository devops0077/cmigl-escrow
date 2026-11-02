"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// Define types for settings
export type UserSettings = {
  theme: string;
  language: string;
  timezone: string;
  currency: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  transactionUpdates: boolean;
  promotionalOffers: boolean;
  reducedMotion: boolean;
};

export type NotificationSettings = Pick<
  UserSettings,
  | "emailNotifications"
  | "smsNotifications"
  | "marketingEmails"
  | "securityAlerts"
  | "transactionUpdates"
  | "promotionalOffers"
>;

export type AppearanceSettings = Pick<UserSettings, "theme" | "reducedMotion">;

export type LocaleSettings = Pick<
  UserSettings,
  "language" | "timezone" | "currency"
>;

// Default settings
const defaultSettings: UserSettings = {
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
};

/**
 * Hook for managing user settings
 */
export function useSettings() {
  const { data: session } = authClient.useSession();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [session]);

  // Fetch all settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const data = await response.json();
      setSettings((prev) => ({ ...prev, ...data }));

      toast.success("Settings updated", {
        description: "Your settings have been updated successfully.",
      });

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error updating settings:", err);

      toast.error("Update failed", {
        description:
          "There was a problem updating your settings. Please try again.",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Reset settings to defaults
  const resetSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to reset settings");
      }

      await fetchSettings();

      toast.success("Settings reset", {
        description: "Your settings have been reset to defaults.",
      });

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error resetting settings:", err);

      toast.error("Reset failed", {
        description:
          "There was a problem resetting your settings. Please try again.",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get notification settings
  const getNotificationSettings = (): NotificationSettings => {
    return {
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
      marketingEmails: settings.marketingEmails,
      securityAlerts: settings.securityAlerts,
      transactionUpdates: settings.transactionUpdates,
      promotionalOffers: settings.promotionalOffers,
    };
  };

  // Update notification settings
  const updateNotificationSettings = async (
    newSettings: Partial<NotificationSettings>
  ) => {
    return updateSettings(newSettings);
  };

  // Get appearance settings
  const getAppearanceSettings = (): AppearanceSettings => {
    return {
      theme: settings.theme,
      reducedMotion: settings.reducedMotion,
    };
  };

  // Update appearance settings
  const updateAppearanceSettings = async (
    newSettings: Partial<AppearanceSettings>
  ) => {
    return updateSettings(newSettings);
  };

  // Get locale settings
  const getLocaleSettings = (): LocaleSettings => {
    return {
      language: settings.language,
      timezone: settings.timezone,
      currency: settings.currency,
    };
  };

  // Update locale settings
  const updateLocaleSettings = async (newSettings: Partial<LocaleSettings>) => {
    return updateSettings(newSettings);
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    getNotificationSettings,
    updateNotificationSettings,
    getAppearanceSettings,
    updateAppearanceSettings,
    getLocaleSettings,
    updateLocaleSettings,
  };
}

