import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateEscrowFee } from "@/lib/fee-calculator";
import { formatCurrency } from "@/lib/utils";
import {
  verifyWhodeysellPayload,
  whodeysellListingUrl,
} from "@/lib/whodeysell";
import { createTransaction } from "@/lib/data-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// WhoDeySell marketplace handoff entry point.
//
// The marketplace redirects buyers here after they click "Buy with escrow"
// on a listing: /buy?payload=<payload>&sig=<sig>. This page verifies the
// signed payload, resolves the seller, and creates a PENDING escrow
// transaction funded from the buyer's wallet — the same wallet-first flow
// the normal new-transaction form uses. Funding, delivery, approval and
// release then continue in the existing transaction UI.
//
// Buyer identity: the buyer must be signed in to escrow (guest funding is
// not supported by this codebase). A signed-out buyer is sent to the login
// page with a callbackUrl back here, preserving the signed payload.
//
// Seller resolution: the payload carries the marketplace seller id, which
// is meaningless to escrow on its own. It is resolved through the
// MarketplaceSellerMapping table (see docs/whodeysell-handoff.md). If the
// seller has no mapping, no transaction is created and no money moves.

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
      {children}
    </div>
  );
}

function ErrorCard({
  title,
  message,
  listingUrl,
}: {
  title: string;
  message: string;
  listingUrl?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {listingUrl ? (
        <CardContent>
          <Link href={listingUrl} className="text-sm font-medium underline">
            Back to the listing to start checkout again
          </Link>
        </CardContent>
      ) : null}
    </Card>
  );
}

export default async function WhodeysellBuyPage({
  searchParams,
}: {
  searchParams: Promise<{ payload?: string | string[]; sig?: string | string[] }>;
}) {
  const sp = await searchParams;
  const payload = typeof sp.payload === "string" ? sp.payload : null;
  const sig = typeof sp.sig === "string" ? sp.sig : null;
  const verification = verifyWhodeysellPayload(payload, sig);

  if (!verification.ok) {
    return (
      <PageShell>
        <ErrorCard
          title="Checkout link problem"
          message={verification.message}
          listingUrl={
            verification.listingId
              ? whodeysellListingUrl(verification.listingId)
              : null
          }
        />
      </PageShell>
    );
  }

  const order = verification.payload;
  const buyUrl = `/buy?payload=${encodeURIComponent(payload ?? "")}&sig=${encodeURIComponent(sig ?? "")}`;
  const listingUrl = whodeysellListingUrl(order.listingId);

  // The buyer must be signed in; send them to login and back here.
  const session = await auth();
  if (!session?.user?.email) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(buyUrl)}`,
    );
  }

  // The marketplace reuses a buyer's pending order on repeat clicks, so a
  // second visit with the same order id lands on the transaction created
  // the first time instead of creating a duplicate.
  const existing = await prisma.transaction.findUnique({
    where: { marketplaceOrderId: order.orderId },
  });
  if (existing) {
    return (
      <PageShell>
        <Card>
          <CardHeader>
            <CardTitle>Checkout already started</CardTitle>
            <CardDescription>
              This order already has an escrow transaction. No new
              transaction was created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/dashboard/transactions/${existing.id}`}
              className="text-sm font-medium underline"
            >
              View the existing transaction
            </Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const buyer = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { wallet: true },
  });
  if (!buyer) {
    return (
      <PageShell>
        <ErrorCard
          title="Account not found"
          message="Your escrow account could not be found. Please sign in with your escrow account and try again."
          listingUrl={listingUrl}
        />
      </PageShell>
    );
  }

  const mapping = await prisma.marketplaceSellerMapping.findUnique({
    where: { marketplaceSellerId: order.sellerId },
  });
  const seller = mapping
    ? await prisma.user.findUnique({
        where: { id: mapping.escrowUserId },
        select: { id: true, name: true, username: true, email: true },
      })
    : null;
  if (!mapping || !seller) {
    // Never create a transaction with an unresolved seller, and never pay
    // out to one. The seller must link their WhoDeySell account first.
    return (
      <PageShell>
        <ErrorCard
          title="Seller account not linked yet"
          message="The seller has not linked their WhoDeySell account to escrow yet, so this checkout cannot continue. No transaction was created and no money was taken."
          listingUrl={listingUrl}
        />
      </PageShell>
    );
  }

  if (seller.id === buyer.id) {
    return (
      <PageShell>
        <ErrorCard
          title="Cannot buy your own listing"
          message="You cannot buy your own listing."
          listingUrl={listingUrl}
        />
      </PageShell>
    );
  }

  // Escrow amounts are naira; the payload amount is integer kobo.
  const amountNaira = order.amountKobo / 100;
  const escrowFee = calculateEscrowFee(amountNaira);
  const totalRequired = amountNaira + escrowFee;
  const walletBalance = buyer.wallet?.balance ?? 0;
  const hasFunds = walletBalance >= totalRequired;
  const shortfall =
    Math.ceil((totalRequired - walletBalance) * 100) / 100;
  const sellerName = seller.name || seller.username || seller.email || "Seller";

  async function confirmCheckout(formData: FormData) {
    "use server";
    const formPayload = formData.get("payload")?.toString() ?? null;
    const formSig = formData.get("sig")?.toString() ?? null;
    const recheck = verifyWhodeysellPayload(formPayload, formSig);
    const backToBuy = `/buy?payload=${encodeURIComponent(formPayload ?? "")}&sig=${encodeURIComponent(formSig ?? "")}`;
    if (!recheck.ok) {
      // The page re-renders with the matching error (e.g. expired link).
      redirect(backToBuy);
    }
    const rechecked = recheck.payload;
    const recheckSession = await auth();
    if (!recheckSession?.user?.email) {
      redirect(`/auth/login?callbackUrl=${encodeURIComponent(backToBuy)}`);
    }
    // Re-check everything the page checked: never trust the form fields.
    const already = await prisma.transaction.findUnique({
      where: { marketplaceOrderId: rechecked.orderId },
    });
    if (already) {
      redirect(`/dashboard/transactions/${already.id}`);
    }
    const recheckBuyer = await prisma.user.findUnique({
      where: { email: recheckSession.user.email },
      include: { wallet: true },
    });
    const recheckMapping = await prisma.marketplaceSellerMapping.findUnique({
      where: { marketplaceSellerId: rechecked.sellerId },
    });
    if (!recheckBuyer || !recheckMapping) {
      redirect(backToBuy);
    }
    if (recheckMapping.escrowUserId === recheckBuyer.id) {
      redirect(backToBuy);
    }
    let transactionId: string | null = null;
    try {
      const transaction = await createTransaction({
        sellerId: recheckMapping.escrowUserId,
        amount: rechecked.amountKobo / 100,
        productDetails: `WhoDeySell purchase — listing ${rechecked.listingId} (order ${rechecked.orderId})`,
        productCategory: "WhoDeySell",
        marketplaceOrderId: rechecked.orderId,
      });
      transactionId = transaction.id;
    } catch {
      // Usually insufficient wallet balance: back to the page, which shows
      // the fund-wallet option with the current balance.
      redirect(backToBuy);
    }
    redirect(`/dashboard/transactions/${transactionId}`);
  }

  return (
    <PageShell>
      <Card>
        <CardHeader>
          <CardTitle>Confirm escrow checkout</CardTitle>
          <CardDescription>
            Review the pre-filled transaction below. Funds are held in
            escrow until you confirm delivery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Seller</dt>
              <dd className="font-medium">{sellerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Item amount</dt>
              <dd className="font-medium">{formatCurrency(amountNaira)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Escrow fee (4.5%)</dt>
              <dd className="font-medium">{formatCurrency(escrowFee)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2">
              <dt className="font-medium">Total from wallet</dt>
              <dd className="font-medium">{formatCurrency(totalRequired)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Wallet balance</dt>
              <dd className="font-medium">{formatCurrency(walletBalance)}</dd>
            </div>
          </dl>

          {!hasFunds ? (
            <>
              <Alert>
                <AlertDescription>
                  Your wallet balance does not cover this checkout. Fund
                  your wallet first — if the 15-minute checkout link
                  expires while funding, start checkout again from the
                  listing to get a fresh link.
                </AlertDescription>
              </Alert>
              <form method="get" action="/dashboard/wallet/">
                <input type="hidden" name="amount" value={shortfall} />
                <input type="hidden" name="modal" value="true" />
                <input type="hidden" name="returnUrl" value={buyUrl} />
                <Button type="submit" className="w-full">
                  Fund wallet ({formatCurrency(shortfall)})
                </Button>
              </form>
            </>
          ) : (
            <form action={confirmCheckout}>
              <input type="hidden" name="payload" value={payload ?? ""} />
              <input type="hidden" name="sig" value={sig ?? ""} />
              <Button type="submit" className="w-full">
                Create escrow transaction
              </Button>
            </form>
          )}

          <p className="text-center text-sm">
            <Link href={listingUrl} className="font-medium underline">
              Back to the listing on WhoDeySell
            </Link>
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
