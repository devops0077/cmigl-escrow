import type React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/fade-in";

export function HeroSection() {
  return (
    <FadeIn>
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Secure Transactions Made Simple
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  CMIGL Escrow protects both buyers and sellers with our secure
                  escrow service. Pay with confidence, receive with peace of
                  mind.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full">
                    Get Started
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline" className="w-full">
                    How It Works
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-muted-foreground">Flat 2.5% fee</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-muted-foreground">Secure payments</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-muted-foreground">24/7 support</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full aspect-video overflow-hidden rounded-xl">
                <img
                  src="/dashboard.png?height=720&width=1280"
                  alt="Hero"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
