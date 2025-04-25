import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="px-5 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Secure Transactions Between Buyers and Sellers
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Vokun Escrow Services holds funds securely until both parties
                are satisfied with the transaction.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/auth/register">
                <Button size="lg" className="gap-1.5">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-[350px] w-[350px] rounded-full bg-muted p-4 lg:h-[400px] lg:w-[400px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="h-40 w-40 text-primary lg:h-60 lg:w-60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
