import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Terms of Service - CMIGL Escrow Services",
  description: "Terms and conditions for using our escrow platform",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-16">
          <div className="mx-auto px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Terms of Service
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                Please read these terms and conditions carefully before using
                our escrow services.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                1. Introduction
              </h2>
              <p>
                Welcome to CMIGL Escrow Services ("we," "our," or "us"). These
                Terms of Service ("Terms") govern your access to and use of our
                website, mobile applications, and services (collectively, the
                "Services").
              </p>
              <p>
                By accessing or using our Services, you agree to be bound by
                these Terms and our Privacy Policy. If you do not agree to these
                Terms, you may not access or use the Services.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                2. Definitions
              </h2>
              <p>
                <strong>"Account"</strong> means a unique account created for
                you to access our Services.
              </p>
              <p>
                <strong>"Buyer"</strong> means the party purchasing goods or
                services in a transaction facilitated by our escrow service.
              </p>
              <p>
                <strong>"Escrow"</strong> means the holding of funds by us as a
                third party until the terms of the transaction have been
                fulfilled.
              </p>
              <p>
                <strong>"Seller"</strong> means the party providing goods or
                services in a transaction facilitated by our escrow service.
              </p>
              <p>
                <strong>"Transaction"</strong> means the exchange of goods or
                services between a Buyer and Seller facilitated by our escrow
                service.
              </p>
              <p>
                <strong>"User"</strong> means any individual who accesses or
                uses our Services, including Buyers and Sellers.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                3. Account Registration and Eligibility
              </h2>
              <p>
                3.1. To use our Services, you must create an account and provide
                accurate, complete, and up-to-date information. You are
                responsible for maintaining the confidentiality of your account
                credentials and for all activities that occur under your
                account.
              </p>
              <p>
                3.2. You must be at least 18 years old and have the legal
                capacity to enter into binding contracts to use our Services. By
                creating an account, you represent and warrant that you meet
                these requirements.
              </p>
              <p>
                3.3. You may not use our Services if you are located in a
                country subject to a U.S. government embargo or that has been
                designated as a "terrorist supporting" country, or if you are
                listed on any U.S. government list of prohibited or restricted
                parties.
              </p>
              <p>
                3.4. We reserve the right to refuse service, terminate accounts,
                or remove or edit content in our sole discretion.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                4. Escrow Services
              </h2>
              <p>
                4.1. Our escrow service facilitates transactions between Buyers
                and Sellers by holding funds until both parties fulfill their
                obligations.
              </p>
              <p>4.2. The escrow process generally follows these steps:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Buyer and Seller agree on transaction terms</li>
                <li>Buyer sends payment to CMIGL Escrow</li>
                <li>We verify the payment and notify the Seller</li>
                <li>Seller delivers goods or services to the Buyer</li>
                <li>Buyer inspects and approves the goods or services</li>
                <li>We release funds to the Seller</li>
              </ul>
              <p>
                4.3. We are not responsible for the quality, safety, legality,
                or delivery of the goods or services exchanged in a transaction.
              </p>
              <p>
                4.4. We reserve the right to refuse or cancel any transaction
                that we believe violates these Terms or is otherwise suspicious.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                5. Fees and Payments
              </h2>
              <p>
                5.1. We charge fees for our Services as described on our
                website. Fees may vary based on transaction amount, payment
                method, and other factors.
              </p>
              <p>
                5.2. All fees are non-refundable unless otherwise specified or
                required by law.
              </p>
              <p>
                5.3. You are responsible for all taxes associated with your use
                of our Services.
              </p>
              <p>
                5.4. We may change our fees at any time by posting the changes
                on our website. Changes will not apply to transactions in
                progress.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                6. Dispute Resolution
              </h2>
              <p>
                6.1. If a dispute arises between a Buyer and Seller, we provide
                a dispute resolution process to help resolve the issue.
              </p>
              <p>
                6.2. Both parties must provide evidence and information as
                requested to support their position.
              </p>
              <p>
                6.3. We will review the evidence and make a decision based on
                our assessment of the facts. Our decision is final and binding.
              </p>
              <p>
                6.4. We may, at our discretion, release funds to either party,
                split the funds between parties, or take other actions we deem
                appropriate to resolve the dispute.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                7. Prohibited Activities
              </h2>
              <p>
                You may not use our Services for any illegal or unauthorized
                purpose. Prohibited activities include, but are not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Violating any applicable law, regulation, or these Terms
                </li>
                <li>Engaging in fraudulent or deceptive practices</li>
                <li>Providing false or misleading information</li>
                <li>Attempting to circumvent our security measures</li>
                <li>
                  Using our Services for money laundering or financing terrorism
                </li>
                <li>Selling illegal or prohibited items</li>
                <li>
                  Infringing on the intellectual property rights of others
                </li>
                <li>Harassing, threatening, or intimidating other users</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                8. Limitation of Liability
              </h2>
              <p>
                8.1. To the maximum extent permitted by law, we shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, including loss of profits, data, or goodwill,
                arising out of or in connection with your use of our Services.
              </p>
              <p>
                8.2. Our total liability for any claim arising out of or
                relating to these Terms or our Services shall not exceed the
                greater of $100 or the amount of fees paid by you to us during
                the 6 months preceding the claim.
              </p>
              <p>
                8.3. The limitations of liability in this section apply to all
                claims, whether based on warranty, contract, tort, or any other
                legal theory, and whether or not we have been informed of the
                possibility of such damage.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                9. Indemnification
              </h2>
              <p>
                You agree to indemnify, defend, and hold harmless CMIGL Escrow
                Services and its officers, directors, employees, agents, and
                affiliates from and against any and all claims, liabilities,
                damages, losses, costs, expenses, or fees (including reasonable
                attorneys' fees) arising from or relating to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use of our Services</li>
                <li>Your violation of these Terms</li>
                <li>
                  Your violation of any rights of another person or entity
                </li>
                <li>Your conduct in connection with our Services</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                10. Modifications to Terms
              </h2>
              <p>
                10.1. We may modify these Terms at any time by posting the
                revised Terms on our website. Your continued use of our Services
                after the effective date of the revised Terms constitutes your
                acceptance of the changes.
              </p>
              <p>
                10.2. We will provide notice of material changes to these Terms
                by posting a notice on our website or sending an email to the
                address associated with your account.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                11. Governing Law and Jurisdiction
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of [Jurisdiction], without regard to its conflict
                of law provisions. Any dispute arising from or relating to these
                Terms or our Services shall be subject to the exclusive
                jurisdiction of the courts located in [Jurisdiction].
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                12. Contact Information
              </h2>
              <p>
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <p>
                CMIGL Escrow Services
                <br />
                Email: legal@cmiglescrow.com
                <br />
                Address: [Company Address]
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="mb-4 text-muted-foreground">
                Last updated: May 8, 2025
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button variant="outline" asChild>
                  <Link href="/privacy">
                    Privacy Policy
                    <ChevronRight className="ml-1 h-4 w-4" />
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
          </div>
        </section>
      </main>
    </div>
  );
}
