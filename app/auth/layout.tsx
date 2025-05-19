import type { ReactNode } from "react";
import Image from "next/image";
import { FadeIn } from "@/components/animations/fade-in";
import { ProcessSteps } from "@/components/landing/hero-section";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen">
        {/* Left column - Auth form */}
        <div className="flex flex-1 items-center justify-center">
          {children}
        </div>

        {/* Right column - Image and testimonial */}
        <div className="hidden lg:flex flex-1 bg-muted items-center justify-center">
          <div className="max-w-md p-8 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">CMIGL Escrow Services</h2>
              <p className="text-muted-foreground">
                Secure transactions for everyone
              </p>
            </div>

            <div className="relative h-64 w-full rounded-lg overflow-hidden mb-8">
              <ProcessSteps />
            </div>

            {/* <div className="bg-background rounded-lg p-6 shadow-sm">
              <p className="italic mb-4">
                "CMIGL Escrow has transformed how I conduct online business. The
                security and peace of mind are worth every penny."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  US
                </div>
                <div className="ml-3">
                  <p className="font-medium">Ugochukwu Sunday</p>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
}
