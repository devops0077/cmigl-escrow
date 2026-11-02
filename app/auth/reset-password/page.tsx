"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/lib/auth-actions";
import { FadeIn } from "@/components/animations/fade-in";
import { RegisterPageSkeleton } from "../login/page";

const formSchema = z
  .object({
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) {
      setError("No reset token provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await resetPassword(token, values.password);
      if (result.success) {
        setSuccess(true);
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to reset password"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <FadeIn>
        <div className="flex h-screen w-full flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Reset Password
              </CardTitle>
              <CardDescription>
                Create a new password for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Invalid Request</AlertTitle>
                <AlertDescription>
                  No reset token provided. Please request a new password reset
                  link.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push("/auth/forgot-password")}
              >
                Request New Link
              </Button>
            </CardFooter>
          </Card>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Create a new password for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Password Reset Successful</AlertTitle>
                <AlertDescription>
                  Your password has been reset successfully. You can now log in
                  with your new password.
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter>
            {success ? (
              <Button
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                Go to Login
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground w-full text-center">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Back to login
                </Link>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </FadeIn>
  );
}

export default function ResetPageWrapper() {
  return (
    <Suspense fallback={<RegisterPageSkeleton />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
