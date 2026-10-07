import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section>
      <div className="container mx-auto px-5 py-16 md:py-24">
        <div className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-zinc-900 px-8 py-12 text-zinc-50 md:flex-row md:items-center md:px-12 dark:bg-zinc-800/60 dark:ring-1 dark:ring-white/10">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start your first protected transaction</h2>
            <p className="mt-3 text-zinc-400">Free to sign up. You only pay the 4.5% fee when a transaction goes through.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/register">Create an account</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-zinc-700 bg-transparent text-zinc-50 hover:bg-zinc-800 hover:text-zinc-50" asChild>
              <Link href="/help">Visit help centre</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
