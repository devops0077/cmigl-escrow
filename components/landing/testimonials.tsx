const testimonials = [
  {
    name: "Ibrahim Shehu",
    role: "Buyer",
    initials: "IS",
    content:
      "I was hesitant to buy expensive electronics online, but CMIGL Escrow made it safe. The seller only received payment after I confirmed everything was as described.",
  },
  {
    name: "Ademola Jerry",
    role: "Seller",
    initials: "AJ",
    content:
      "As a small business owner, I've had issues with payment disputes. CMIGL Escrow has eliminated that problem. Now I know I'll get paid when I deliver.",
  },
  {
    name: "Ugochukwu Sunday",
    role: "Buyer",
    initials: "US",
    content:
      "I use CMIGL Escrow for all my high-value transactions. The process is straightforward, and the peace of mind is worth the small fee.",
  },
];

export function Testimonials() {
  return (
    <section className="border-b">
      <div className="container mx-auto px-5 py-16 md:py-24">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">What our users say</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col justify-between rounded-xl border bg-card p-6">
              <blockquote className="leading-relaxed">&ldquo;{t.content}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-medium">{t.name}</span>
                  <span className="block text-sm text-muted-foreground">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
