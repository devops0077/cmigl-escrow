"use client";
import { MonnifyPaymentConfig } from "@/types/monnify";
import { useEffect } from "react";

declare global {
  interface Window {
    MonnifySDK: {
      initialize: (config: MonnifyPaymentConfig) => void;
    };
  }
}

export function MonnifyScript() {
  useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById("monnify-script")) {
      return;
    }

    // Create script element
    const script = document.createElement("script");
    script.id = "monnify-script";
    script.src = "https://sdk.monnify.com/plugin/monnify.js";
    // script.async = true;
    script.type = "text/javascript";

    // Append to document
    document.body.appendChild(script);

    // Cleanup
    return () => {
      const scriptElement = document.getElementById("monnify-script");
      if (scriptElement) {
        document.body.removeChild(scriptElement);
      }
    };
  }, []);

  return null;
}
