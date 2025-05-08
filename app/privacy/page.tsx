import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Privacy Policy - CMIGL Escrow Services",
  description: "How we collect, use, and protect your personal information",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-16">
          <div className="mx-auto px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Privacy Policy
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                How we collect, use, and protect your personal information.
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
                At CMIGL Escrow Services ("we," "our," or "us"), we respect your
                privacy and are committed to protecting your personal
                information. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our
                website, mobile applications, and services (collectively, the
                "Services").
              </p>
              <p>
                Please read this Privacy Policy carefully. By accessing or using
                our Services, you acknowledge that you have read, understood,
                and agree to be bound by this Privacy Policy. If you do not
                agree with our policies and practices, please do not use our
                Services.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                2. Information We Collect
              </h2>
              <p>
                We collect several types of information from and about users of
                our Services, including:
              </p>
              <h3 className="text-xl font-semibold mt-4">
                2.1. Personal Information
              </h3>
              <p>
                Personal information is data that can be used to identify you
                individually. We may collect the following personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Contact information (name, email address, phone number,
                  mailing address)
                </li>
                <li>Account credentials (username, password)</li>
                <li>
                  Financial information (bank account details, credit card
                  information)
                </li>
                <li>
                  Identification documents (passport, driver's license, national
                  ID)
                </li>
                <li>
                  Transaction information (transaction history, payment details)
                </li>
                <li>
                  Communication records (customer support interactions,
                  correspondence)
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">
                2.2. Non-Personal Information
              </h3>
              <p>
                We also collect non-personal information that does not directly
                identify you, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Device information (IP address, browser type, operating
                  system)
                </li>
                <li>
                  Usage data (pages visited, time spent on pages, click
                  patterns)
                </li>
                <li>
                  Location data (general geographic location based on IP
                  address)
                </li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                3. How We Collect Information
              </h2>
              <p>We collect information through various methods, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Direct collection:</strong> Information you provide
                  when creating an account, conducting transactions, or
                  communicating with us.
                </li>
                <li>
                  <strong>Automated collection:</strong> Information collected
                  automatically through cookies, web beacons, and other tracking
                  technologies when you use our Services.
                </li>
                <li>
                  <strong>Third-party sources:</strong> Information from
                  business partners, identity verification services, credit
                  bureaus, and public databases.
                </li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                4. How We Use Your Information
              </h2>
              <p>We use your information for various purposes, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing and improving our Services</li>
                <li>
                  Processing transactions and facilitating escrow services
                </li>
                <li>Verifying your identity and preventing fraud</li>
                <li>
                  Communicating with you about your account and transactions
                </li>
                <li>Sending service-related notifications and updates</li>
                <li>Responding to your inquiries and support requests</li>
                <li>
                  Marketing and promoting our Services (with your consent)
                </li>
                <li>
                  Conducting research and analysis to improve user experience
                </li>
                <li>
                  Complying with legal obligations and enforcing our terms
                </li>
                <li>
                  Protecting our rights, property, and safety, and the rights,
                  property, and safety of our users and others
                </li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                5. Legal Basis for Processing (GDPR)
              </h2>
              <p>
                For users in the European Economic Area (EEA), we process your
                personal information based on the following legal grounds:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Contractual necessity:</strong> Processing necessary
                  to perform the contract we have with you (e.g., providing
                  escrow services).
                </li>
                <li>
                  <strong>Legitimate interests:</strong> Processing necessary
                  for our legitimate interests, such as fraud prevention,
                  improving our Services, and ensuring network security.
                </li>
                <li>
                  <strong>Legal obligation:</strong> Processing necessary to
                  comply with our legal obligations, such as anti-money
                  laundering regulations.
                </li>
                <li>
                  <strong>Consent:</strong> Processing based on your specific
                  consent, such as for marketing communications.
                </li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                6. Information Sharing and Disclosure
              </h2>
              <p>
                We may share your information with the following categories of
                recipients:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Transaction participants:</strong> We share necessary
                  information with other parties involved in your transactions
                  (e.g., buyers, sellers).
                </li>
                <li>
                  <strong>Service providers:</strong> Third-party vendors who
                  perform services on our behalf, such as payment processing,
                  identity verification, and customer support.
                </li>
                <li>
                  <strong>Business partners:</strong> Companies we partner with
                  to offer integrated services or promotions.
                </li>
                <li>
                  <strong>Legal and regulatory authorities:</strong> Government
                  agencies, law enforcement, and regulatory bodies when required
                  by law or to protect our rights.
                </li>
                <li>
                  <strong>Corporate transactions:</strong> In connection with a
                  merger, acquisition, or sale of assets, your information may
                  be transferred to the acquiring entity.
                </li>
              </ul>
              <p>
                We do not sell your personal information to third parties for
                their marketing purposes without your explicit consent.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                7. Data Security
              </h2>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal information from unauthorized access,
                disclosure, alteration, and destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure network architecture and firewalls</li>
                <li>Regular security assessments and penetration testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>
                  Employee training on data security and privacy practices
                </li>
              </ul>
              <p>
                While we strive to protect your personal information, no method
                of transmission over the Internet or electronic storage is 100%
                secure. We cannot guarantee absolute security of your
                information.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                8. Data Retention
              </h2>
              <p>
                We retain your personal information for as long as necessary to
                fulfill the purposes outlined in this Privacy Policy, unless a
                longer retention period is required or permitted by law. The
                criteria used to determine our retention periods include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The duration of our relationship with you</li>
                <li>Legal obligations to retain data for certain periods</li>
                <li>Statute of limitations under applicable law</li>
                <li>Ongoing or potential disputes or legal claims</li>
                <li>Guidelines from regulatory authorities</li>
              </ul>
              <p>
                When personal information is no longer needed, we securely
                delete or anonymize it.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                9. Your Rights and Choices
              </h2>
              <p>
                Depending on your location, you may have certain rights
                regarding your personal information:
              </p>
              <h3 className="text-xl font-semibold mt-4">9.1. For All Users</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Access and update:</strong> You can access and update
                  certain personal information through your account settings.
                </li>
                <li>
                  <strong>Marketing communications:</strong> You can opt out of
                  marketing communications by following the unsubscribe
                  instructions in our emails or contacting us directly.
                </li>
                <li>
                  <strong>Cookies:</strong> You can manage cookie preferences
                  through your browser settings.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">
                9.2. For Users in the EEA, UK, and California
              </h3>
              <p>You may have additional rights, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Right to access:</strong> Request a copy of your
                  personal information.
                </li>
                <li>
                  <strong>Right to rectification:</strong> Request correction of
                  inaccurate or incomplete information.
                </li>
                <li>
                  <strong>Right to erasure:</strong> Request deletion of your
                  personal information in certain circumstances.
                </li>
                <li>
                  <strong>Right to restrict processing:</strong> Request
                  limitation of processing in certain circumstances.
                </li>
                <li>
                  <strong>Right to data portability:</strong> Request transfer
                  of your information to another service provider.
                </li>
                <li>
                  <strong>Right to object:</strong> Object to processing based
                  on legitimate interests or for direct marketing.
                </li>
                <li>
                  <strong>Right to withdraw consent:</strong> Withdraw consent
                  where processing is based on consent.
                </li>
              </ul>
              <p>
                To exercise these rights, please contact us using the
                information provided in the "Contact Us" section. We may need to
                verify your identity before fulfilling your request.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                10. International Data Transfers
              </h2>
              <p>
                We operate globally and may transfer your personal information
                to countries other than your country of residence. These
                countries may have different data protection laws than your
                country.
              </p>
              <p>
                When transferring personal information from the EEA, UK, or
                Switzerland to countries not deemed to provide an adequate level
                of data protection, we use appropriate safeguards, such as
                Standard Contractual Clauses approved by the European
                Commission, or rely on derogations applicable to specific
                situations.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                11. Children's Privacy
              </h2>
              <p>
                Our Services are not intended for children under the age of 18.
                We do not knowingly collect personal information from children
                under 18. If you are a parent or guardian and believe that your
                child has provided us with personal information, please contact
                us, and we will take steps to delete such information.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                12. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or for other operational, legal, or
                regulatory reasons. We will post the revised policy on our
                website with an updated effective date. We encourage you to
                review this Privacy Policy periodically.
              </p>
              <p>
                For material changes, we will provide notice through our
                Services or by other means, such as email, before the changes
                become effective.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                13. Contact Us
              </h2>
              <p>
                If you have any questions, concerns, or requests regarding this
                Privacy Policy or our privacy practices, please contact us at:
              </p>
              <p>
                CMIGL Escrow Services
                <br />
                Attn: Privacy Officer
                <br />
                Email: privacy@cmiglescrow.com
                <br />
                Address: [Company Address]
              </p>
              <p>
                For users in the EEA, we have appointed a Data Protection
                Officer who can be contacted at dpo@cmiglescrow.com.
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="mb-4 text-muted-foreground">
                Last updated: May 8, 2025
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button variant="outline" asChild>
                  <Link href="/terms">
                    Terms of Service
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
