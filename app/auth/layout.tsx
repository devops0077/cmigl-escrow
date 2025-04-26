import type { ReactNode } from "react";
import Image from "next/image";
import { FadeIn } from "@/components/animations/fade-in";

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
              <h2 className="text-2xl font-bold">Vokun Escrow Services</h2>
              <p className="text-muted-foreground">
                Secure transactions for everyone
              </p>
            </div>

            <div className="relative h-64 w-full rounded-lg overflow-hidden mb-8">
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="Secure transactions"
                fill
                className="object-cover"
              />
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm">
              <p className="italic mb-4">
                "Vokun Escrow has transformed how I conduct online business. The
                security and peace of mind are worth every penny."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  JD
                </div>
                <div className="ml-3">
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">Regular User</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
