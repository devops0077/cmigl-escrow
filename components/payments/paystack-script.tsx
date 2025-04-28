"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function PaystackScript() {
  useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById("paystack-script")) {
      return;
    }

    // Create script element
    const script = document.createElement("script");
    script.id = "paystack-script";
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;

    // Append to document
    document.body.appendChild(script);

    // Cleanup
    return () => {
      // const scriptElement = document.getElementById("paystack-script");
      // if (scriptElement) {
      //   document.body.removeChild(scriptElement);
      // }
    };
  }, []);

  return null;
}
