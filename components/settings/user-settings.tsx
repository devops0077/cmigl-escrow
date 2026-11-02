"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { FadeIn } from "@/components/animations/fade-in";
import {
  updateUserProfile,
  updateUserPassword,
  exportUserData,
  deleteUserAccount,
} from "@/lib/settings-actions";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  Check,
  User,
  Lock,
  Bell,
  Settings,
  Upload,
  Loader2,
  Smartphone,
  Copy,
  RefreshCw,
  Shield,
  LogOut,
  AlertTriangle,
  Trash2,
  FileDown,
  FileText,
  Globe,
  Clock,
  Moon,
  RotateCcw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSettings } from "@/hooks/use-settings";
import { useSecurity } from "@/hooks/use-security";
import { SecurityLogTable } from "./security-log-table";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters.",
    })
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

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: "Current password is required.",
    }),
    newPassword: z.string().min(8, {
      message: "New password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  securityAlerts: z.boolean().default(true),
  transactionUpdates: z.boolean().default(true),
  promotionalOffers: z.boolean().default(false),
});

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  reducedMotion: z.boolean().default(false),
});

const localeFormSchema = z.object({
  language: z.string().min(2).max(5).default("en"),
  timezone: z.string().default("UTC"),
  currency: z.string().min(3).max(3).default("NGN"),
});

export function UserSettings() {
  const { data: session } = authClient.useSession();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorQrCode, setTwoFactorQrCode] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAccountText, setDeleteAccountText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Use our custom hooks
  const {
    settings,
    loading: settingsLoading,
    updateNotificationSettings: updateNotificationSettingsHook,
    updateAppearanceSettings: updateAppearanceSettingsHook,
    updateLocaleSettings: updateLocaleSettingsHook,
    resetSettings,
  } = useSettings();

  const {
    // securityLog,
    // activeSessions,
    // loading: securityLoading,
    // terminateSession,
    // terminateAllSessions,
    logSecurityEvent,
  } = useSecurity();

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      username: session?.user?.username || "",
      bio: session?.user.bio || "",
      phone: session?.user.phone || "",
      address: session?.user.address || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
      marketingEmails: settings.marketingEmails,
      securityAlerts: settings.securityAlerts,
      transactionUpdates: settings.transactionUpdates,
      promotionalOffers: settings.promotionalOffers,
    },
  });

  const appearanceForm = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: settings.theme as "light" | "dark" | "system",
      reducedMotion: settings.reducedMotion,
    },
  });

  const localeForm = useForm<z.infer<typeof localeFormSchema>>({
    resolver: zodResolver(localeFormSchema),
    defaultValues: {
      language: settings.language,
      timezone: settings.timezone,
      currency: settings.currency,
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (!settingsLoading) {
      notificationForm.reset({
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        marketingEmails: settings.marketingEmails,
        securityAlerts: settings.securityAlerts,
        transactionUpdates: settings.transactionUpdates,
        promotionalOffers: settings.promotionalOffers,
      });

      appearanceForm.reset({
        theme: settings.theme as "light" | "dark" | "system",
        reducedMotion: settings.reducedMotion,
      });

      localeForm.reset({
        language: settings.language,
        timezone: settings.timezone,
        currency: settings.currency,
      });
    }
  }, [settings, settingsLoading]);

  // Simulate loading user data
  useEffect(() => {
    const timer = setTimeout(() => {
      profileForm.setValue(
        "username",
        session?.user?.name?.toLowerCase().replace(/\s+/g, "_") || ""
      );

      profileForm.setValue("name", session?.user.name as string);
      profileForm.setValue("email", session?.user?.email as string);
      profileForm.setValue("phone", session?.user.phone ?? "");
      session?.user.bio &&
        profileForm.setValue("bio", String(session?.user.bio));
      session?.user.address &&
        profileForm.setValue("address", String(session?.user.address));
    }, 500);

    return () => clearTimeout(timer);
  }, [session, profileForm]);

  // Simulate 2FA QR code
  useEffect(() => {
    if (showTwoFactorSetup) {
      setTwoFactorQrCode(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/CMIGLEscrow:${session?.user.email}?secret=JBSWY3DPEHPK3PXP&issuer=CMIGLEscrow`
      );
      setTwoFactorCode("JBSWY3DPEHPK3PXP");
    }
  }, [showTwoFactorSetup]);

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsUpdatingProfile(true);
    try {
      const result = await updateUserProfile(values);

      if (result.success) {
        // Refresh the session from the server (Better Auth sessions
        // are DB-backed; there is no NextAuth-style update()).
        await authClient.getSession();
        router.refresh();

        toast.success("Profile updated", {
          description:
            "Your profile information has been updated successfully.",
        });
        await logSecurityEvent({
          type: "PROFILE_UPDATED",
          email: session?.user.email as string,
        });
      } else {
        throw new Error(result.error as string);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Update failed", {
        description:
          "There was a problem updating your profile. Please try again.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setIsUpdatingPassword(true);
    try {
      const result = await updateUserPassword(values);

      if (result.success) {
        toast.success("Password updated", {
          description: "Your password has been updated successfully.",
        });

        passwordForm.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        await logSecurityEvent({
          type: "PASSWORD_CHANGED",
          email: session?.user.email as string,
        });
      } else {
        throw new Error(result.error as string);
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Update failed", {
        description:
          "There was a problem updating your password. Please try again.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function onNotificationSubmit(
    values: z.infer<typeof notificationFormSchema>
  ) {
    try {
      const result = await updateNotificationSettingsHook(values);

      if (!result.success) {
        throw new Error(result.error as string);
      }

      toast.success("Notification preferences updated", {
        description:
          "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Notification update error:", error);
      toast.error("Update failed", {
        description:
          "There was a problem updating your notification preferences. Please try again.",
      });
    }
  }

  async function onAppearanceSubmit(
    values: z.infer<typeof appearanceFormSchema>
  ) {
    try {
      const result = await updateAppearanceSettingsHook(values);

      if (!result.success) {
        throw new Error(result.error as string);
      }

      toast.success("Appearance settings updated", {
        description: "Your appearance settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Appearance update error:", error);
      toast.error("Update failed", {
        description:
          "There was a problem updating your appearance settings. Please try again.",
      });
    }
  }

  async function onLocaleSubmit(values: z.infer<typeof localeFormSchema>) {
    try {
      const result = await updateLocaleSettingsHook(values);

      if (!result.success) {
        throw new Error(result.error as string);
      }

      toast.success("Locale settings updated", {
        description: "Your locale settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Locale update error:", error);
      toast.error("Update failed", {
        description:
          "There was a problem updating your locale settings. Please try again.",
      });
    }
  }

  async function handleResetSettings() {
    try {
      const result = await resetSettings();

      if (!result.success) {
        throw new Error(result.error as string);
      }

      toast.success("Settings reset", {
        description: "Your settings have been reset to defaults.",
      });
    } catch (error) {
      console.error("Settings reset error:", error);
      toast.error("Reset failed", {
        description:
          "There was a problem resetting your settings. Please try again.",
      });
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            toast.success("Avatar updated", {
              description:
                "Your profile picture has been updated successfully.",
            });
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard", {
      description: "The 2FA secret code has been copied to your clipboard.",
    });
  }

  async function handleDeleteAccount() {
    if (deleteAccountText !== "DELETE") {
      toast.error("Confirmation failed", {
        description: 'Please type "DELETE" to confirm account deletion.',
      });
      return;
    }

    try {
      const result = await deleteUserAccount();

      if (result.success) {
        toast.success("Account deletion initiated", {
          description:
            "Your account will be permanently deleted within 30 days.",
        });
        setShowDeleteConfirm(false);

        // Redirect to home page after a delay
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        throw new Error(result.error as string);
      }
    } catch (error) {
      console.error("Account deletion error:", error);
      toast.error("Deletion failed", {
        description:
          "There was a problem deleting your account. Please try again.",
      });
    }
  }

  async function handleExportData() {
    try {
      const result = await exportUserData();

      if (result.success) {
        // Redirect to the download URL
        window.location.href = "/api/user/export-data";

        toast.success("Export initiated", {
          description: "Your account data is being downloaded.",
        });
      } else {
        throw new Error(result.error as string);
      }
    } catch (error) {
      console.error("Data export error:", error);
      toast.error("Export failed", {
        description:
          "There was a problem exporting your data. Please try again.",
      });
    }
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <Tabs
          defaultValue="profile"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-3 md:grid-cols-3 mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            {/* <TabsTrigger
              value="preferences"
              className="items-center gap-2 hidden md:flex"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger> */}
          </TabsList>

          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            variants={tabVariants}
          >
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and public profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-2 border-border">
                          <AvatarImage
                            src={
                              avatarPreview ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name || "User"}`
                            }
                            alt={session?.user?.name || "User"}
                          />
                          <AvatarFallback>
                            {session?.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {isUploading && (
                          <div className="absolute -bottom-2 left-0 right-0 mx-auto w-20">
                            <Progress
                              value={uploadProgress}
                              className="h-1.5"
                            />
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          id="avatar-upload"
                          ref={fileInputRef}
                          accept="image/*"
                          className="sr-only"
                          onChange={handleAvatarChange}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-3 w-3 mr-1" />
                              Change Photo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Form {...profileForm}>
                        <form
                          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    Only letters.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input disabled {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    Only letters, numbers, and underscores.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input disabled {...field} />
                                </FormControl>
                                <FormDescription>
                                  This is the email you use to log in.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Tell us a little about yourself"
                                    className="resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  This will be displayed on your public profile.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input disabled {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={isUpdatingProfile}
                            className="mt-2"
                          >
                            {isUpdatingProfile ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4 border-t pt-6">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleExportData}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Account Data
                  </Button>
                  {/* <Button variant="outline" className="w-full sm:w-auto">
                    <FileText className="mr-2 h-4 w-4" />
                    View Privacy Settings
                  </Button> */}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password to keep your account secure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <PasswordInput {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Separator className="my-4" />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <PasswordInput {...field} />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 8 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <PasswordInput {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isUpdatingPassword}>
                        {isUpdatingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Authenticator App</h4>
                      <p className="text-sm text-muted-foreground">
                        Use an authenticator app to generate one-time codes.
                      </p>
                    </div>
                    <Dialog
                      open={showTwoFactorSetup}
                      onOpenChange={setShowTwoFactorSetup}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">Setup</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            Set up Two-Factor Authentication
                          </DialogTitle>
                          <DialogDescription>
                            Scan the QR code with your authenticator app or
                            enter the code manually.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center space-y-4 py-4">
                          <div className="bg-white p-2 rounded-md">
                            <img
                              src={twoFactorQrCode || "/placeholder.svg"}
                              alt="QR Code for 2FA"
                              className="w-48 h-48"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                              {twoFactorCode}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => copyToClipboard(twoFactorCode)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground text-center">
                            After scanning, enter the 6-digit code from your
                            authenticator app below.
                          </div>
                          <Input
                            className="w-full max-w-[200px]"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                          />
                        </div>
                        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowTwoFactorSetup(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Verify and Enable</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Separator />
                  {/* <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">
                        SMS Authentication
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Receive a code via SMS to verify your identity.
                      </p>
                    </div>
                    <Button variant="outline">Setup</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Recovery Codes</h4>
                      <p className="text-sm text-muted-foreground">
                        Generate backup codes to access your account if you lose
                        your device.
                      </p>
                    </div>
                    <Button variant="outline">Generate</Button>
                  </div> */}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Log</CardTitle>
                  <CardDescription>
                    Review recent security events for your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecurityLogTable />
                </CardContent>
                {/* <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Full Security Log
                  </Button>
                </CardFooter> */}
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Manage devices where you're currently logged in.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {securityLoading.activeSessions ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : activeSessions.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No active sessions found.
                      </div>
                    ) : (
                      activeSessions.map((session) => (
                        <div key={session.id} className="rounded-md border">
                          <div className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <Smartphone className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">
                                  {session.isCurrent
                                    ? "Current Device"
                                    : session.userAgent}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {session.userAgent} • IP: {session.ipAddress}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {session.isCurrent ? (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">
                                  Active Now
                                </span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-destructive"
                                  onClick={() => terminateSession(session.id)}
                                  disabled={securityLoading.terminateSession}
                                >
                                  {securityLoading.terminateSession ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <LogOut className="h-4 w-4 mr-1" />
                                      <span className="hidden sm:inline">
                                        Sign Out
                                      </span>
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                    onClick={terminateAllSessions}
                    disabled={securityLoading.terminateSession}
                  >
                    {securityLoading.terminateSession ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out All Devices
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card> */}
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications from our platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form
                      onSubmit={notificationForm.handleSubmit(
                        onNotificationSubmit
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Email Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive notifications via email.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                SMS Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive notifications via SMS.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="securityAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Security Alerts
                              </FormLabel>
                              <FormDescription>
                                Get notified about security events like password
                                changes.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="transactionUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Transaction Updates
                              </FormLabel>
                              <FormDescription>
                                Receive notifications about your transaction
                                status changes.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="marketingEmails"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Marketing Emails
                              </FormLabel>
                              <FormDescription>
                                Receive emails about new features and updates.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="promotionalOffers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Promotional Offers
                              </FormLabel>
                              <FormDescription>
                                Receive notifications about promotions and
                                special offers.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={settingsLoading}>
                        {settingsLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Channels</CardTitle>
                  <CardDescription>
                    Choose how you want to receive different types of
                    notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 pb-4 border-b">
                      <div className="col-span-1"></div>
                      <div className="text-center text-sm font-medium">
                        Email
                      </div>
                      <div className="text-center text-sm font-medium">SMS</div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="col-span-1">
                        <h4 className="text-sm font-medium">
                          Transaction Updates
                        </h4>
                      </div>
                      <div className="flex justify-center">
                        <Switch defaultChecked />
                      </div>
                      <div className="flex justify-center">
                        <Switch />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="col-span-1">
                        <h4 className="text-sm font-medium">Security Alerts</h4>
                      </div>
                      <div className="flex justify-center">
                        <Switch defaultChecked />
                      </div>
                      <div className="flex justify-center">
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="col-span-1">
                        <h4 className="text-sm font-medium">Dispute Updates</h4>
                      </div>
                      <div className="flex justify-center">
                        <Switch defaultChecked />
                      </div>
                      <div className="flex justify-center">
                        <Switch />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="col-span-1">
                        <h4 className="text-sm font-medium">Marketing</h4>
                      </div>
                      <div className="flex justify-center">
                        <Switch />
                      </div>
                      <div className="flex justify-center">
                        <Switch />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Save Channel Preferences</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...appearanceForm}>
                    <form
                      onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <FormField
                          control={appearanceForm.control}
                          name="theme"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base flex items-center">
                                    <Moon className="h-4 w-4 mr-2" />
                                    Theme
                                  </FormLabel>
                                  <FormDescription>
                                    Select your preferred theme for the
                                    interface.
                                  </FormDescription>
                                </div>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Theme" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">
                                      System
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <FormField
                        control={appearanceForm.control}
                        name="reducedMotion"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Reduced Motion
                              </FormLabel>
                              <FormDescription>
                                Reduce the amount of animations throughout the
                                interface.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={settingsLoading}>
                        {settingsLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Appearance Settings"
                        )}
                      </Button>
                    </form>
                  </Form>

                  <Separator />

                  <Form {...localeForm}>
                    <form
                      onSubmit={localeForm.handleSubmit(onLocaleSubmit)}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <FormField
                          control={localeForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base flex items-center">
                                    <Globe className="h-4 w-4 mr-2" />
                                    Language
                                  </FormLabel>
                                  <FormDescription>
                                    Select your preferred language for the
                                    interface.
                                  </FormDescription>
                                </div>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Language" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                    <SelectItem value="pt">
                                      Portuguese
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <FormField
                        control={localeForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Clock className="h-4 w-4 mr-2" />
                                  Time Zone
                                </FormLabel>
                                <FormDescription>
                                  Set your local time zone for accurate time
                                  displays.
                                </FormDescription>
                              </div>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select Time Zone" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UTC">
                                    UTC (Coordinated Universal Time)
                                  </SelectItem>
                                  <SelectItem value="EST">
                                    EST (Eastern Standard Time)
                                  </SelectItem>
                                  <SelectItem value="CST">
                                    CST (Central Standard Time)
                                  </SelectItem>
                                  <SelectItem value="MST">
                                    MST (Mountain Standard Time)
                                  </SelectItem>
                                  <SelectItem value="PST">
                                    PST (Pacific Standard Time)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <FormField
                        control={localeForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Currency Display
                                </FormLabel>
                                <FormDescription>
                                  Choose your preferred currency for displaying
                                  amounts.
                                </FormDescription>
                              </div>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select Currency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NGN">
                                    Nigerian Naira (₦)
                                  </SelectItem>
                                  {/* <SelectItem value="USD">
                                    US Dollar ($)
                                  </SelectItem>
                                  <SelectItem value="EUR">Euro (€)</SelectItem>
                                  <SelectItem value="GBP">
                                    British Pound (£)
                                  </SelectItem> */}
                                </SelectContent>
                              </Select>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={settingsLoading}>
                        {settingsLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Locale Settings"
                        )}
                      </Button>
                    </form>
                  </Form>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleResetSettings}
                      disabled={settingsLoading}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset All Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                    <AlertDialog
                      open={showDeleteConfirm}
                      onOpenChange={setShowDeleteConfirm}
                    >
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your account and remove all your data from
                            our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                            <div className="flex items-start">
                              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
                              <div>
                                <h4 className="text-sm font-medium">Warning</h4>
                                <ul className="text-sm mt-2 list-disc pl-5 space-y-1">
                                  <li>
                                    All your transactions will be permanently
                                    deleted
                                  </li>
                                  <li>Your wallet balance will be forfeited</li>
                                  <li>
                                    Your personal information will be removed
                                  </li>
                                  <li>
                                    You will lose access to all escrow services
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label
                              htmlFor="confirm-delete"
                              className="text-sm font-medium"
                            >
                              Type "DELETE" to confirm
                            </label>
                            <Input
                              id="confirm-delete"
                              value={deleteAccountText}
                              onChange={(e) =>
                                setDeleteAccountText(e.target.value)
                              }
                              placeholder="DELETE"
                              className="border-destructive/50"
                            />
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteAccount();
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </FadeIn>
  );
}

