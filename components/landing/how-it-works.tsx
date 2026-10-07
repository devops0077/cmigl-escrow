const steps = [
  {
    title: "Buyer funds the transaction",
    description: "The buyer creates a transaction with the agreed terms and pays. The money is held in escrow, not sent to the seller.",
  },
  {
    title: "Seller delivers",
    description: "The seller is notified that payment is secured, then ships the item or delivers the service.",
  },
  {
    title: "Buyer approves, seller gets paid",
    description: "Once the buyer confirms the delivery matches what was agreed, the funds are released to the seller's wallet.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b">
      <div className="container mx-auto px-5 py-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three steps, and neither side has to trust the other with their money or their goods.
          </p>
        </div>

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t pt-6">
              <span className="text-sm font-medium tabular-nums text-primary">Step {i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
