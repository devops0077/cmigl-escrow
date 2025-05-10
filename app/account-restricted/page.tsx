"use client";

import { useEffect, useState } from "react";
import { useRestriction } from "@/providers/restriction-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Clock, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AccountRestrictedPage() {
  const { isRestricted, restrictions, submitAppeal } = useRestriction();
  const [appealText, setAppealText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // If user is not restricted, they shouldn't be on this page
    if (session && session.user.restricted === false) {
      window.location.href = "/dashboard";
    }
  }, [isRestricted, session]);

  const handleSubmitAppeal = async () => {
    if (!appealText.trim()) return;

    setIsSubmitting(true);
    try {
      await submitAppeal(appealText);
      setAppealText("");
    } catch (error) {
      console.error("Error submitting appeal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isRestricted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 shadow-lg">
        <CardHeader className="bg-red-900/20 text-red-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle>Account Restricted</CardTitle>
          </div>
          <CardDescription className="text-red-500">
            Your account has been temporarily deactivated
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="rounded-lg bg-red-900/20 p-4 text-red-200">
              <p className="font-semibold text-sm">
                Oh! Oh!! Your Account has been Temporarily Deactivated,
                ...possibly for SHARP Practices. If you believe this was done in
                ERROR, please let us know HERE.
              </p>
            </div>

            {restrictions &&
              restrictions.map((restriction) => {
                return (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Restricted{" "}
                          {formatDistanceToNow(
                            new Date(restriction.appliedAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>
                      </div>

                      {restriction.reason && (
                        <div className="rounded-md bg-muted p-3">
                          <p className="font-medium">Reason:</p>
                          <p>{restriction.reason.replace(/_/g, " ")}</p>
                          {restriction.details && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {restriction.details}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {restriction?.appealSubmitted ? (
                      <div className="rounded-md bg-blue-900/20 p-4 text-blue-500">
                        <p className="font-medium">Appeal Submitted</p>
                        <p className="mt-1 text-sm">
                          Your appeal has been received and is under review.
                          We'll notify you once a decision has been made.
                        </p>
                        {restriction.appealDate && (
                          <p className="mt-2 text-xs text-blue-600">
                            Submitted{" "}
                            {formatDistanceToNow(
                              new Date(restriction.appealDate),
                              {
                                addSuffix: true,
                              }
                            )}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">
                          Submit an appeal if you believe this restriction was
                          made in error:
                        </p>
                        <Textarea
                          placeholder="Please explain why you believe this restriction should be removed..."
                          value={appealText}
                          onChange={(e) => setAppealText(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    )}
                    {!restriction?.appealSubmitted && (
                      <Button
                        className="w-full"
                        onClick={handleSubmitAppeal}
                        disabled={!appealText.trim() || isSubmitting}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Submit Appeal
                      </Button>
                    )}
                  </>
                );
              })}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/help">Get Help</Link>
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={async () => await signOut()}
            >
              Sign Out
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
