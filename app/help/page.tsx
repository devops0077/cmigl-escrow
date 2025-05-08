import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageCircle,
  Mail,
  FileQuestion,
  Phone,
  Clock,
  BookOpen,
  Video,
  Headphones,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Help & Support - CMIGL Escrow Services",
  description: "Get help and support for CMIGL Escrow Services",
};

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 ">
        <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-24 lg:py-32">
          <div className="mx-auto px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Help & Support
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                We're here to help you with any questions or issues you may have
                with our escrow services.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto container py-12 md:py-16 lg:py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  WhatsApp Support
                </CardTitle>
                <CardDescription>
                  Chat with our support team directly
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Get quick responses to your questions through WhatsApp. Our
                  team is available during business hours.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  asChild
                >
                  <a
                    href="https://wa.me/1234567890?text=Hello%20from%20CMIGL%20Escrow"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Start WhatsApp Chat
                  </a>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  Email Support
                </CardTitle>
                <CardDescription>Send us a detailed message</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  For more complex issues or detailed inquiries, email our
                  support team for thorough assistance.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  asChild
                >
                  <a href="mailto:support@cmiglescrow.com">Email Support</a>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-yellow-500" />
                  Phone Support
                </CardTitle>
                <CardDescription>Speak directly with our team</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  For urgent matters or when you prefer to speak with someone
                  directly, call our support line.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                  asChild
                >
                  <a href="tel:+1234567890">Call Support</a>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5 text-purple-500" />
                  FAQ
                </CardTitle>
                <CardDescription>
                  Find answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Browse our comprehensive FAQ section for answers to the most
                  common questions about our services.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600"
                  asChild
                >
                  <Link href="/faq">View FAQ</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  Knowledge Base
                </CardTitle>
                <CardDescription>Detailed guides and tutorials</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Explore our knowledge base for in-depth guides, tutorials, and
                  articles about using our platform.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-indigo-500 hover:bg-indigo-600"
                  asChild
                >
                  <Link href="/knowledge-base">Browse Knowledge Base</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-500" />
                  Video Tutorials
                </CardTitle>
                <CardDescription>Visual guides to our platform</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Watch step-by-step video tutorials that demonstrate how to use
                  various features of our platform.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-red-500 hover:bg-red-600" asChild>
                  <Link href="/tutorials">Watch Tutorials</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Separator className="my-12" />

          <div className="mx-auto max-w-3xl space-y-6">
            <h2 className="text-center text-2xl font-bold tracking-tight">
              Support Hours
            </h2>
            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex items-start gap-4">
                <Clock className="mt-1 h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="font-medium">Customer Support Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    Our support team is available during the following hours:
                  </p>
                  <ul className="grid gap-1 text-sm">
                    <li className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span className="font-medium">
                        9:00 AM - 6:00 PM (GMT+1)
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Saturday:</span>
                      <span className="font-medium">
                        10:00 AM - 4:00 PM (GMT+1)
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Sunday:</span>
                      <span className="font-medium">Closed</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    For urgent matters outside of these hours, please email us
                    at{" "}
                    <a
                      href="mailto:urgent@cmiglescrow.com"
                      className="text-primary underline"
                    >
                      urgent@cmiglescrow.com
                    </a>{" "}
                    and we'll respond as soon as possible.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex items-start gap-4">
                <Headphones className="mt-1 h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="font-medium">Live Chat Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Our live chat support is available during business hours.
                    You can access it by clicking the help bubble in the bottom
                    right corner of any page on our website.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex items-start gap-4">
                <MessageSquare className="mt-1 h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="font-medium">Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    We value your feedback! Let us know how we can improve our
                    services or if you have any suggestions.
                  </p>
                  <Button variant="outline" className="mt-2" asChild>
                    <Link href="/feedback">Send Feedback</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-muted-foreground">
              Can't find what you need? Our support team is ready to assist you.
            </p>
            <Button asChild>
              <Link href="mailto:support@cmiglescrow.com">
                Contact Support
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
