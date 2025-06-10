"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
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
import { toast } from "sonner";
import { FadeIn } from "@/components/animations/fade-in";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Info } from "lucide-react";
import { InActiveAccountError } from "@/lib/error-class";
import { AuthError } from "next-auth";
import { SecurityEventType } from "@/lib/generated/prisma";
import apiClient from "@/lib/api-client";

const formSchema = z.object({
  email: z.string().min(1, {
    message: "Field is required.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered") === "true";
  const verified = searchParams.get("verified") === "true";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        console.log(result);
        if (result?.code?.includes("inactive_account")) {
          setError("Your account is not active. Redirecting...");
          const response = await fetch(
            `/api/auth/user-by-email?email=${encodeURIComponent(values.email)}`
          );
          const data = await response.json();

          if (data.userId) {
            router.push(`/auth/payment?userId=${data.userId}`);
            return;
          }
        } else if (result.error.includes("CredentialsSignin")) {
          setError("Invalid email or password.");
          await apiClient.post("/user/security-log", {
            type: SecurityEventType.LOGIN_FAILED,
            email: values.email,
            reason: "Invalid email or password.",
          });
        }
        return;
      }
      toast.success("Login successful", {
        description: "You have been logged in successfully.",
      });
      await fetch(process.env.NEXT_PUBLIC_APP_URL + "/api/user/security-log", {
        body: JSON.stringify({
          type: SecurityEventType.LOGIN_SUCCESS,
          email: values.email,
        }),
        method: "POST",
      });

      router.push(callbackUrl);
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <FadeIn>
      <div className=" flex h-screen w-full flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>
              Enter your email and password to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {registered && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Registration complete!</AlertTitle>
                <AlertDescription>
                  Your account has been activated. You can now log in.
                </AlertDescription>
              </Alert>
            )}

            {verified && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Email verified!</AlertTitle>
                <AlertDescription>
                  Your email has been verified. Please complete the registration
                  by paying the one-time fee.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email | Username | Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your email, username, or phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                Register
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              <Link
                href="/auth/forgot-password"
                className="text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </FadeIn>
  );
}

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<RegisterPageSkeleton />}>
      <LoginPage />
    </Suspense>
  );
}

export function RegisterPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-4 md:p-8 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900 to-background"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-5"></div>
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse"></div>
            </div>
            <div className="h-8 w-48 bg-zinc-800 rounded-md animate-pulse mx-auto mb-2"></div>
            <div className="h-4 w-64 bg-zinc-800 rounded-md animate-pulse mx-auto"></div>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <div className="space-y-6">
              <div className="h-10 bg-zinc-800 rounded-md animate-pulse"></div>
              <div className="h-10 bg-zinc-800 rounded-md animate-pulse"></div>
              <div className="h-10 bg-zinc-800 rounded-md animate-pulse"></div>
              <div className="h-12 bg-zinc-800 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:block w-1/2 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800"></div>
      </div>
    </div>
  );
}
