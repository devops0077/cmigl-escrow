"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

/**
 * OAuth 2.1 consent page for this app as a provider (see auth.ts
 * oauthProvider consentPage). Reached only by clients WITHOUT
 * skip_consent — the first-party WhoDeySell client is registered with
 * skip_consent: true and never lands here.
 *
 * The plugin redirects here with client_id, scope and (when requested)
 * claims query parameters plus a signed oauth_query; the
 * oauthProviderClient plugin forwards that signed query to the consent
 * endpoint automatically, so this page only has to call
 * authClient.oauth2.consent with the user's decision.
 */
function ConsentPage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client_id") ?? "This application";
  const scope = searchParams.get("scope") ?? "openid profile email";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(accept: boolean) {
    setIsLoading(true);
    setError(null);
    const { error } = await authClient.oauth2.consent({
      accept,
      scope,
    });
    if (error) {
      setError(
        "Could not complete the authorization. Please try again from the application."
      );
      setIsLoading(false);
    }
    // On success Better Auth redirects back to the client's redirect_uri.
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Authorize application
          </CardTitle>
          <CardDescription>
            {clientId} is requesting access to your escrow account with the
            following scopes: {scope}.
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
          <p className="text-sm text-muted-foreground">
            Only approve applications you trust. Approving lets the
            application sign you in and read your basic profile (name,
            email and profile picture, per the scopes above).
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={isLoading}
            onClick={() => decide(false)}
          >
            Deny
          </Button>
          <Button
            className="flex-1"
            disabled={isLoading}
            onClick={() => decide(true)}
          >
            Allow
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ConsentPageWrapper() {
  return (
    <Suspense>
      <ConsentPage />
    </Suspense>
  );
}
