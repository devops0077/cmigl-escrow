import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "FAQ - CMIGL Escrow Services",
  description: "Frequently asked questions about our escrow services",
};

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 ">
        <section className="w-full flex flex-col bg-gradient-to-b from-muted/50 to-muted py-12 md:py-24 lg:py-32">
          <div className="mx-auto px-4 md:px-6">
            <div className=" flex  max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Frequently Asked Questions
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                Find answers to common questions about our escrow services,
                transactions, and platform features.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl space-y-8 py-12 md:py-16 lg:py-20">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              General Questions
            </h2>
            <Separator className="my-4" />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is-escrow">
                <AccordionTrigger>What is an escrow service?</AccordionTrigger>
                <AccordionContent>
                  An escrow service is a financial arrangement where a third
                  party holds and regulates payment of funds for two parties in
                  a transaction. It helps protect both the buyer and seller in a
                  transaction by ensuring that funds are only released when all
                  terms of an agreement are met.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-escrow-works">
                <AccordionTrigger>How does CMIGL Escrow work?</AccordionTrigger>
                <AccordionContent>
                  Our escrow service works in a few simple steps: 1) The buyer
                  and seller agree on terms, 2) The buyer sends payment to CMIGL
                  Escrow, 3) The seller delivers the goods or services, 4) The
                  buyer confirms receipt and satisfaction, 5) CMIGL Escrow
                  releases the funds to the seller. This process ensures both
                  parties are protected throughout the transaction.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="escrow-fees">
                <AccordionTrigger>
                  What are the fees for using CMIGL Escrow?
                </AccordionTrigger>
                <AccordionContent>
                  Our fee structure is transparent and based on the transaction
                  amount. Typically, fee is a flat 2.5% of the transaction
                  value. The exact fee will be clearly displayed before you
                  confirm any transaction.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="transaction-types">
                <AccordionTrigger>
                  What types of transactions can I use CMIGL Escrow for?
                </AccordionTrigger>
                <AccordionContent>
                  CMIGL Escrow can be used for a wide range of transactions,
                  including online purchases, service contracts, real estate
                  transactions, vehicle sales, business asset transfers, and
                  more. If you're unsure whether your transaction is suitable,
                  please contact our support team.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Account & Security
            </h2>
            <Separator className="my-4" />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="create-account">
                <AccordionTrigger>How do I create an account?</AccordionTrigger>
                <AccordionContent>
                  Creating an account is simple. Click on the "Register" button
                  in the top right corner of our website, fill in your details,
                  verify your email address, and complete the identity
                  verification process. Once approved, you can start using our
                  escrow services immediately.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="account-security">
                <AccordionTrigger>How secure is my account?</AccordionTrigger>
                <AccordionContent>
                  We take security very seriously. Your account is protected
                  with industry-standard encryption, secure authentication
                  methods, and regular security audits. We recommend using a
                  strong, unique password and enabling two-factor authentication
                  for additional security.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="identity-verification">
                <AccordionTrigger>
                  Why do I need to verify my identity?
                </AccordionTrigger>
                <AccordionContent>
                  Identity verification is required to comply with financial
                  regulations, prevent fraud, and ensure the security of all
                  users on our platform. This process helps us maintain a
                  trusted environment for conducting transactions.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
            <Separator className="my-4" />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="transaction-time">
                <AccordionTrigger>
                  How long does a transaction take?
                </AccordionTrigger>
                <AccordionContent>
                  The duration of a transaction depends on several factors,
                  including the type of transaction, shipping time (if
                  applicable), and how quickly both parties fulfill their
                  obligations. Typically, once the buyer confirms receipt, funds
                  are released to the seller within 1-2 business days.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cancel-transaction">
                <AccordionTrigger>Can I cancel a transaction?</AccordionTrigger>
                <AccordionContent>
                  Yes, transactions can be canceled under certain conditions. If
                  both parties agree to cancel, the process is straightforward.
                  If only one party wants to cancel, our dispute resolution
                  process may be initiated. Funds that have not yet been
                  released can be returned to the buyer, minus any applicable
                  fees.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="transaction-dispute">
                <AccordionTrigger>
                  What happens if there's a dispute?
                </AccordionTrigger>
                <AccordionContent>
                  If a dispute arises, our platform provides a structured
                  resolution process. Both parties can submit evidence and
                  explanations, and our team will review the case. We aim to
                  reach a fair resolution based on the evidence provided and the
                  terms of the transaction. In some cases, we may allocate the
                  funds proportionally between parties.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Payments & Wallet
            </h2>
            <Separator className="my-4" />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="payment-methods">
                <AccordionTrigger>
                  What payment methods are accepted?
                </AccordionTrigger>
                <AccordionContent>
                  We accept various payment methods, including credit/debit
                  cards, bank transfers, and selected digital payment platforms.
                  The available methods may vary depending on your location and
                  the transaction amount.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="wallet-funds">
                <AccordionTrigger>
                  How do I add funds to my wallet?
                </AccordionTrigger>
                <AccordionContent>
                  You can add funds to your wallet by navigating to the Wallet
                  section in your dashboard and clicking on "Fund Wallet."
                  Follow the instructions to complete the payment using your
                  preferred method. Funds are typically available in your wallet
                  immediately after the payment is processed.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="withdraw-funds">
                <AccordionTrigger>
                  How do I withdraw funds from my wallet?
                </AccordionTrigger>
                <AccordionContent>
                  To withdraw funds, go to your Wallet section and select
                  "Withdraw." Enter the amount you wish to withdraw and your
                  preferred withdrawal method. Processing times vary depending
                  on the withdrawal method, but typically take 1-3 business
                  days.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-8 text-center">
            <p className="mb-4 text-muted-foreground">
              Didn't find what you're looking for? Contact our support team for
              assistance.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="mailto:support@cmiglescrow.com">
                  Contact Support
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Return to Home
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
