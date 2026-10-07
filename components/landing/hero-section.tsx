import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = ["Flat 4.5% fee", "Funds held until delivery", "24/7 support"];

export function HeroSection() {
  return (
    <section className="border-b">
      <div className="container mx-auto grid gap-12 px-5 py-16 md:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-primary">Escrow for buyers and sellers in Nigeria</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Pay safely. Get paid for what you deliver.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            CMIGL Escrow holds the buyer&apos;s payment until the order is delivered and approved. Sellers ship knowing the money is
            already secured, and buyers only release it when they&apos;re satisfied.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/register">
                Create a free account
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <TransactionPreview />
      </div>
    </section>
  );
}

const timeline = [
  { label: "Payment secured in escrow", detail: "12 Sep, 10:42", state: "done" },
  { label: "Seller marked as shipped", detail: "13 Sep, 16:05", state: "done" },
  { label: "Buyer confirms delivery", detail: "Awaiting buyer", state: "current" },
  { label: "Funds released to seller", detail: "", state: "upcoming" },
] as const;

function TransactionPreview() {
  return (
    <div className="mx-auto w-full max-w-md lg:ml-auto" aria-hidden="true">
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <p className="text-xs text-muted-foreground">Transaction #CMG-20481</p>
            <p className="mt-1 font-medium">iPhone 15 Pro, 256GB</p>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            In transit
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b p-5 text-sm">
          <div>
            <p className="text-muted-foreground">Amount held</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">₦1,250,000</p>
          </div>
          <div>
            <p className="text-muted-foreground">Escrow fee (4.5%)</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">₦56,250</p>
          </div>
        </div>

        <ol className="space-y-4 p-5">
          {timeline.map((step) => (
            <li key={step.label} className="flex gap-3">
              <span
                className={
                  step.state === "done"
                    ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : step.state === "current"
                      ? "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-primary"
                      : "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-border"
                }
              >
                {step.state === "done" && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <div className="flex flex-1 items-baseline justify-between gap-4 text-sm">
                <span className={step.state === "upcoming" ? "text-muted-foreground" : "font-medium"}>{step.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{step.detail}</span>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex items-center gap-2 rounded-b-xl border-t bg-muted/50 px-5 py-3 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Funds stay locked until the buyer approves delivery.
        </div>
      </div>
    </div>
  );
}
