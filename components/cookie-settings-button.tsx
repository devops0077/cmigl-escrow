"use client";

import { COOKIE_CONSENT_OPEN_EVENT } from "@/components/cookie-consent";

/**
 * Footer control that re-opens the cookie preferences dialog so a
 * visitor can review or withdraw consent at any time.
 */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT))}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      Cookie settings
    </button>
  );
}
