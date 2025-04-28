"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyEmail } from "@/lib/auth-actions";
import { FadeIn } from "@/components/animations/fade-in";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError("No verification token provided");
      return;
    }

    const verifyToken = async () => {
      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setSuccess(true);
          setUserId(result.userId);
        }
      } catch (error) {
        console.error("Verification error:", error);
        setError(
          error instanceof Error ? error.message : "Verification failed"
        );
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <FadeIn>
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Email Verification
            </CardTitle>
            <CardDescription>Verifying your email address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Verifying your email...
                </p>
              </div>
            ) : success ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Email verified successfully!</AlertTitle>
                <AlertDescription>
                  Your email has been verified. Please complete the registration
                  by paying the one-time fee.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Verification failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            {success ? (
              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    `/auth/login?callbackUrl=/auth/payment?userId=${userId}&verified=true`
                  )
                }
              >
                Continue to Payment
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                Back to Login
              </Button>
            )}
            <div className="text-sm text-muted-foreground text-center">
              <Link
                href="/auth/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Return to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </FadeIn>
  );
}
