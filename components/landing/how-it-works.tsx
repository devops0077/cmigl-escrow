import { CheckCircle2 } from "lucide-react";

export function HowItWorks() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="px-5 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              How It Works
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Simple, Secure, and Transparent
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our escrow process is designed to protect both buyers and sellers
              throughout the transaction.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2">
          <div className="flex flex-col space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">
                  Buyer Initiates Transaction
                </h3>
                <p className="text-muted-foreground">
                  Buyer searches for a seller and creates a transaction by
                  specifying the amount and product details.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Funds Deposited in Escrow</h3>
                <p className="text-muted-foreground">
                  Buyer deposits funds into escrow via our secure payment
                  gateway.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Seller Ships Goods</h3>
                <p className="text-muted-foreground">
                  Seller is notified of the transaction and ships the goods to
                  the buyer.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                4
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Buyer Confirms Receipt</h3>
                <p className="text-muted-foreground">
                  Buyer confirms receipt of goods and their satisfaction with
                  the transaction.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                5
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Admin Approves Release</h3>
                <p className="text-muted-foreground">
                  Admin reviews the transaction and approves the release of
                  funds to the seller.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                6
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Funds Released to Seller</h3>
                <p className="text-muted-foreground">
                  Funds are credited to the seller's wallet, minus the escrow
                  fee.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="rounded-lg border bg-muted/50 p-6 max-w-2xl">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Secure Transaction Guarantee
              </h3>
            </div>
            <p className="mt-2 text-muted-foreground">
              If a transaction fails for any reason, funds are automatically
              returned to the buyer's wallet. Our escrow service ensures that
              your money is always protected.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
