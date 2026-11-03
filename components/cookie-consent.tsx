"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const COOKIE_CONSENT_OPEN_EVENT = "cmigl:open-cookie-settings";

const STORAGE_KEY = "cmigl-escrow-cookie-consent";
const COOKIE_NAME = "cookie_consent";
const DISMISSED_KEY = "cmigl-escrow-consent-dismissed";

type Consent = {
  necessary: true;
  preferences: boolean;
  decidedAt: string;
};

function readStoredConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consent;
    if (parsed && parsed.necessary === true && typeof parsed.preferences === "boolean") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function persistConsent(consent: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // Private mode etc: the cookie below still records the choice.
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(consent)
  )}; max-age=31536000; path=/; SameSite=Lax${secure}`;
}

/**
 * Cookie consent banner + preferences.
 *
 * Honest by design: CMIGL Escrow currently sets only essential cookies
 * (sign-in session, security, and this consent record). There are no
 * analytics, advertising, or tracking cookies. The preferences toggle is
 * still recorded so that, if preference cookies are ever introduced,
 * a visitor's earlier choice is already on file — and it can be changed
 * at any time from the "Cookie settings" link in the footer.
 *
 * The banner never blocks content, and closing it with the X does NOT
 * count as consent: the banner simply stays hidden for the rest of the
 * session and returns on the next visit until a choice is made.
 */
export function CookieConsent() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [preferences, setPreferences] = useState(false);

  useEffect(() => {
    if (readStoredConsent()) return;
    try {
      if (window.sessionStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Ignore storage errors; showing the banner is the safe default.
    }
    setBannerVisible(true);
  }, []);

  useEffect(() => {
    const open = () => {
      const stored = readStoredConsent();
      setPreferences(stored ? stored.preferences : false);
      setPrefsOpen(true);
    };
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, open);
  }, []);

  const save = useCallback((prefs: boolean) => {
    persistConsent({
      necessary: true,
      preferences: prefs,
      decidedAt: new Date().toISOString(),
    });
    setBannerVisible(false);
    setPrefsOpen(false);
  }, []);

  const dismissForSession = useCallback(() => {
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Ignore; the banner will simply show again on the next visit.
    }
    setBannerVisible(false);
  }, []);

  return (
    <>
      {bannerVisible && !prefsOpen && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border bg-background p-4 shadow-lg sm:left-auto sm:max-w-md"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium">We value your privacy</p>
            <button
              type="button"
              onClick={dismissForSession}
              aria-label="Dismiss cookie banner for this session"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            We use only essential cookies to keep you signed in and keep
            escrow secure. We do not use advertising or tracking cookies.
            See our{" "}
            <Link href="/cookies" className="underline hover:text-foreground">
              Cookie Policy
            </Link>{" "}
            for details.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => save(true)}>
              Accept all
            </Button>
            <Button size="sm" variant="outline" onClick={() => save(false)}>
              Essential only
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPreferences(readStoredConsent()?.preferences ?? false);
                setPrefsOpen(true);
              }}
            >
              Customise
            </Button>
          </div>
        </div>
      )}

      {prefsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cookie preferences"
            className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg"
          >
            <h2 className="text-lg font-semibold">Cookie preferences</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose which cookies we may use. You can change this at any
              time from the “Cookie settings” link in the footer.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Essential cookies</p>
                  <p className="text-sm text-muted-foreground">
                    Sign-in session, security, and this consent record.
                    Required for the site to work; always on.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label="Essential cookies (always on)"
                  className="mt-1 h-4 w-4 accent-primary"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Preferences</p>
                  <p className="text-sm text-muted-foreground">
                    Remembers choices such as display preferences. We do
                    not currently set preference cookies; your choice is
                    recorded for the future.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences}
                  onChange={(event) => setPreferences(event.target.checked)}
                  aria-label="Allow preference cookies"
                  className="mt-1 h-4 w-4 accent-primary"
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              No analytics, advertising, or tracking cookies are used. Full
              details:{" "}
              <Link href="/cookies" className="underline hover:text-foreground">
                Cookie Policy
              </Link>
              .
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => save(preferences)}>
                Save preferences
              </Button>
              <Button size="sm" variant="outline" onClick={() => save(true)}>
                Accept all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPrefsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
