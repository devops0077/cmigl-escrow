import { Bell, Headphones, History, Percent, ShieldCheck, Wallet } from "lucide-react";

const features = [
  {
    title: "Protected payments",
    description: "Funds are held securely until both parties are satisfied with the transaction.",
    icon: ShieldCheck,
  },
  {
    title: "Flat 4.5% fee",
    description: "One transparent fee on every transaction. No setup costs, no hidden charges.",
    icon: Percent,
  },
  {
    title: "Built-in wallet",
    description: "Receive released funds, top up and withdraw from a single wallet.",
    icon: Wallet,
  },
  {
    title: "Real-time updates",
    description: "Get notified the moment a transaction changes status, from payment to release.",
    icon: Bell,
  },
  {
    title: "Full transaction history",
    description: "Every payment, delivery and release is recorded and available whenever you need it.",
    icon: History,
  },
  {
    title: "Support around the clock",
    description: "Our team is available 24/7 to help with questions and resolve disputes.",
    icon: Headphones,
  },
];

export function Features() {
  return (
    <section className="border-b bg-muted/40">
      <div className="container mx-auto px-5 py-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Built for secure trade</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to buy and sell with people you haven&apos;t met.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="bg-background p-6 md:p-8">
              <feature.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
