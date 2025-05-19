"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { FadeIn } from "@/components/animations/fade-in";
import { updateUserPassword, updateUserProfile } from "@/lib/data-actions";
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
} from "lucide-react";

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
    .optional(),
  bio: z.string().max(160).optional(),
  phone: z.string().optional(),
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
  marketingEmails: z.boolean().default(false),
  securityAlerts: z.boolean().default(true),
  transactionUpdates: z.boolean().default(true),
  promotionalOffers: z.boolean().default(false),
});

export function UserSettings() {
  const { data: session, update } = useSession();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [avatarPreview, setAvatarPreview] = useState("");
  const router = useRouter();

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      username: "",
      bio: "",
      phone: "",
      address: "",
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
      emailNotifications: true,
      marketingEmails: false,
      securityAlerts: true,
      transactionUpdates: true,
      promotionalOffers: false,
    },
  });

  // Simulate loading user data
  useEffect(() => {
    const timer = setTimeout(() => {
      profileForm.setValue(
        "username",
        session?.user?.name?.toLowerCase().replace(/\s+/g, "_") || ""
      );
      profileForm.setValue("bio", "I'm a user of the Vokun Escrow platform.");
      profileForm.setValue("phone", "+1234567890");
      profileForm.setValue("address", "123 Main St, City, Country");
    }, 500);

    return () => clearTimeout(timer);
  }, [session, profileForm]);

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile(values);

      // Update the session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: values.name,
          email: values.email,
        },
      });
      router.refresh();

      toast.success("Profile updated", {
        description: "Your profile information has been updated successfully.",
      });
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
      await updateUserPassword(values);

      toast.success("Password updated", {
        description: "Your password has been updated successfully.",
      });

      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
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
    setIsUpdatingNotifications(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
    } finally {
      setIsUpdatingNotifications(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate upload success
      setTimeout(() => {
        toast.success("Avatar updated", {
          description: "Your profile picture has been updated successfully.",
        });
      }, 1500);
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
          <TabsList className="grid grid-cols-3 md:grid-cols-4  mb-4">
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
            <TabsTrigger
              value="preferences"
              className="items-center gap-2 hidden md:flex"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
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
                      <div className="relative">
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleAvatarChange}
                        />
                        <label
                          htmlFor="avatar-upload"
                          className="flex items-center justify-center gap-2 text-sm font-medium text-primary cursor-pointer hover:underline"
                        >
                          <Upload className="h-4 w-4" />
                          Change Photo
                        </label>
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
                                    <Input {...field} />
                                  </FormControl>
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
                                  <Input {...field} />
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
                                    <Input {...field} />
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
                              <Input type="password" {...field} />
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
                              <Input type="password" {...field} />
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
                              <Input type="password" {...field} />
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
                    <Button variant="outline">Setup</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
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
                </CardContent>
              </Card>
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

                      <Button type="submit" disabled={isUpdatingNotifications}>
                        {isUpdatingNotifications ? (
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
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Language</h3>
                    <Select defaultValue="en">
                      <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Time Zone</h3>
                    <Select defaultValue="utc">
                      <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder="Select Time Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">
                          UTC (Coordinated Universal Time)
                        </SelectItem>
                        <SelectItem value="est">
                          EST (Eastern Standard Time)
                        </SelectItem>
                        <SelectItem value="cst">
                          CST (Central Standard Time)
                        </SelectItem>
                        <SelectItem value="mst">
                          MST (Mountain Standard Time)
                        </SelectItem>
                        <SelectItem value="pst">
                          PST (Pacific Standard Time)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-medium">Dark Mode</h3>
                        <p className="text-sm text-muted-foreground">
                          Toggle between light and dark mode.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-medium">Reduced Motion</h3>
                        <p className="text-sm text-muted-foreground">
                          Reduce the amount of animations throughout the
                          interface.
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <Button>Save Preferences</Button>
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
                    <Button variant="destructive">Delete Account</Button>
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
