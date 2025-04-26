import { FadeIn } from "@/components/animations/fade-in";

export function HowItWorks() {
  return (
    <FadeIn>
      <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
        <div className=" px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted-foreground/20 px-3 py-1 text-sm">
                How It Works
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Simple, Secure Process
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our escrow service makes transactions safe and straightforward
                for both buyers and sellers.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-bold">Create Transaction</h3>
              <p className="text-center text-muted-foreground">
                Buyer creates a transaction and funds are held securely in
                escrow.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-bold">Seller Ships Product</h3>
              <p className="text-center text-muted-foreground">
                Seller is notified and ships the product or delivers the
                service.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-bold">Funds Released</h3>
              <p className="text-center text-muted-foreground">
                Buyer confirms receipt and funds are released to the seller.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">One-Time Registration Fee</h3>
              <p className="max-w-[600px] text-muted-foreground">
                Join Vokun Escrow with a one-time registration fee of ₦500.
                After that, enjoy our services with just a flat 1.5% transaction
                fee.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
