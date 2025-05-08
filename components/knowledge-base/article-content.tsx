"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  Clock,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Share,
  Printer,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// This would typically come from a database or CMS
const articlesData = {
  "getting-started-with-escrow": {
    title: "Getting Started with CMIGL Escrow",
    description:
      "Learn the basics of our escrow service and how to complete your first transaction.",
    category: "Getting Started",
    tags: ["beginners", "overview", "basics"],
    readTime: 5,
    lastUpdated: "2023-04-15",
    content: `
      <h2>What is CMIGL Escrow?</h2>
      <p>CMIGL Escrow is a secure third-party service that facilitates transactions between buyers and sellers. We hold the buyer's payment in a secure account until both parties confirm that the terms of the transaction have been met. This protects both the buyer and seller throughout the transaction process.</p>
      
      <h2>How Escrow Works</h2>
      <p>The escrow process follows these simple steps:</p>
      <ol>
        <li><strong>Agreement:</strong> The buyer and seller agree on the terms of the transaction, including the price, delivery timeframe, and any specific conditions.</li>
        <li><strong>Payment:</strong> The buyer sends the payment to CMIGL Escrow, where it is held securely.</li>
        <li><strong>Verification:</strong> We verify the payment and notify the seller that funds have been secured.</li>
        <li><strong>Delivery:</strong> The seller delivers the goods or services to the buyer as agreed.</li>
        <li><strong>Inspection:</strong> The buyer inspects the goods or services to ensure they meet the agreed terms.</li>
        <li><strong>Approval:</strong> If satisfied, the buyer approves the transaction.</li>
        <li><strong>Payment Release:</strong> We release the funds to the seller, completing the transaction.</li>
      </ol>
      
      <h2>Creating Your First Transaction</h2>
      <p>To create your first escrow transaction, follow these steps:</p>
      <ol>
        <li>Log in to your CMIGL Escrow account.</li>
        <li>Click on "New Transaction" in your dashboard.</li>
        <li>Enter the transaction details, including the other party's email, transaction amount, and description.</li>
        <li>Review the transaction details and confirm.</li>
        <li>Fund the transaction using your preferred payment method.</li>
        <li>We'll notify the other party about the transaction.</li>
      </ol>
      
      <h2>Transaction Fees</h2>
      <p>Our fee structure is transparent and based on the transaction amount. Typically, fees range from 1% to 3% of the transaction value, with a minimum fee of $5. The exact fee will be clearly displayed before you confirm any transaction.</p>
      
      <h2>Transaction Statuses</h2>
      <p>Throughout the escrow process, your transaction will progress through various statuses:</p>
      <ul>
        <li><strong>Created:</strong> The transaction has been created but not yet funded.</li>
        <li><strong>Funded:</strong> The buyer has funded the escrow account.</li>
        <li><strong>In Progress:</strong> The seller is fulfilling the order.</li>
        <li><strong>Delivered:</strong> The seller has marked the order as delivered.</li>
        <li><strong>Inspecting:</strong> The buyer is inspecting the goods or services.</li>
        <li><strong>Completed:</strong> The transaction has been successfully completed.</li>
        <li><strong>Cancelled:</strong> The transaction has been cancelled by mutual agreement.</li>
        <li><strong>Disputed:</strong> A dispute has been raised and is being resolved.</li>
      </ul>
      
      <h2>Tips for a Successful Transaction</h2>
      <p>To ensure a smooth escrow experience, consider these tips:</p>
      <ul>
        <li>Clearly define all transaction terms before starting.</li>
        <li>Communicate openly with the other party throughout the process.</li>
        <li>Respond promptly to notifications and requests.</li>
        <li>Document all aspects of the transaction for reference.</li>
        <li>Contact our support team if you have any questions or concerns.</li>
      </ul>
      
      <h2>Next Steps</h2>
      <p>Now that you understand the basics of CMIGL Escrow, you might want to:</p>
      <ul>
        <li>Complete your account verification to unlock all features.</li>
        <li>Explore our transaction types for different use cases.</li>
        <li>Learn about our dispute resolution process.</li>
        <li>Set up your wallet for faster transactions.</li>
      </ul>
    `,
    relatedArticles: [
      {
        id: "2",
        title: "How to Create and Verify Your Account",
        slug: "create-and-verify-account",
      },
      {
        id: "3",
        title: "Understanding Transaction Fees",
        slug: "understanding-transaction-fees",
      },
      {
        id: "9",
        title: "Understanding Escrow Statuses",
        slug: "escrow-statuses",
      },
    ],
  },
  "create-and-verify-account": {
    title: "How to Create and Verify Your Account",
    description:
      "A step-by-step guide to setting up your account and completing verification.",
    category: "Account Management",
    tags: ["verification", "kyc", "registration"],
    readTime: 7,
    lastUpdated: "2023-05-20",
    content: `
      <h2>Creating Your Account</h2>
      <p>Setting up your CMIGL Escrow account is quick and straightforward:</p>
      <ol>
        <li>Visit our website and click on the "Register" button in the top right corner.</li>
        <li>Enter your email address, create a strong password, and provide your basic information.</li>
        <li>Read and accept our Terms of Service and Privacy Policy.</li>
        <li>Click "Create Account" to proceed.</li>
        <li>Check your email for a verification link and click it to confirm your email address.</li>
      </ol>
      
      <h2>Account Verification Process</h2>
      <p>To ensure the security of all users on our platform, we require identity verification. This process helps prevent fraud and complies with financial regulations. Here's how to complete your verification:</p>
      
      <h3>Basic Verification</h3>
      <ol>
        <li>Log in to your account and navigate to the "Verification" section.</li>
        <li>Provide your full legal name, date of birth, and current address.</li>
        <li>Enter your phone number and verify it with the code we send you.</li>
      </ol>
      
      <h3>Identity Verification</h3>
      <ol>
        <li>Upload a clear photo of your government-issued ID (passport, driver's license, or national ID card).</li>
        <li>Take a selfie following the on-screen instructions to confirm your identity.</li>
        <li>Our system will compare your selfie with your ID photo for verification.</li>
      </ol>
      
      <h3>Address Verification</h3>
      <ol>
        <li>Upload a document that proves your address, such as a utility bill, bank statement, or official government correspondence.</li>
        <li>The document should be recent (issued within the last 3 months) and clearly show your name and address.</li>
      </ol>
      
      <h2>Verification Status</h2>
      <p>After submitting your verification documents, your account will show one of these statuses:</p>
      <ul>
        <li><strong>Pending:</strong> Your documents are being reviewed by our team.</li>
        <li><strong>Verified:</strong> Your verification is complete, and you can use all platform features.</li>
        <li><strong>Additional Information Required:</strong> We need more information or clearer documents.</li>
        <li><strong>Rejected:</strong> Your verification was not approved. This could be due to unclear documents, information mismatch, or other issues.</li>
      </ul>
      
      <h2>Verification Tips</h2>
      <p>To ensure a smooth verification process:</p>
      <ul>
        <li>Use high-quality, well-lit images of your documents.</li>
        <li>Make sure all four corners of your ID are visible in the photo.</li>
        <li>Ensure that all text on your documents is clearly legible.</li>
        <li>Remove any glare or shadows that might obscure information.</li>
        <li>Make sure your selfie is clear and your face is fully visible.</li>
      </ul>
      
      <h2>Verification Timeframe</h2>
      <p>Basic verification is usually instant. Identity and address verification typically take 1-2 business days to process. During high-volume periods, it may take up to 3 business days. You'll receive an email notification once your verification is complete.</p>
      
      <h2>Troubleshooting Verification Issues</h2>
      <p>If you encounter any issues during the verification process:</p>
      <ul>
        <li>Check that your documents meet all requirements.</li>
        <li>Ensure your personal information is entered correctly and matches your documents.</li>
        <li>Try using a different document if one is rejected.</li>
        <li>Contact our support team if you continue to experience problems.</li>
      </ul>
    `,
    relatedArticles: [
      {
        id: "1",
        title: "Getting Started with CMIGL Escrow",
        slug: "getting-started-with-escrow",
      },
      {
        id: "12",
        title: "Account Recovery Options",
        slug: "account-recovery",
      },
      {
        id: "13",
        title: "Data Privacy and Protection",
        slug: "data-privacy",
      },
    ],
  },
  // Additional article content would be defined here
};

export function ArticleContent({ slug }: { slug: string }) {
  const [helpful, setHelpful] = useState<boolean | null>(null);

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, this would fetch from an API
    // For this example, we're using the static data
    setLoading(true);

    setTimeout(() => {
      const articleData = articlesData[slug as keyof typeof articlesData];
      setArticle(articleData);
      setLoading(false);
    }, 300);
  }, [slug]);

  if (loading) {
    return (
      <main className="container py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted"></div>
          <div className="h-4 w-full animate-pulse rounded-md bg-muted"></div>
          <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted"></div>
          <div className="h-64 w-full animate-pulse rounded-md bg-muted"></div>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="container py-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold">Article Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The article you're looking for doesn't exist or has been moved.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/knowledge-base">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Knowledge Base
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <main className="flex-1">
      <div className="container py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/knowledge-base">
                Knowledge Base
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/knowledge-base?category=${article.category.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {article.category}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{article.title}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{article.category}</Badge>
              <span className="text-sm text-muted-foreground">
                <Clock className="inline mr-1 h-4 w-4" />
                {article.readTime} min read
              </span>
              <span className="text-sm text-muted-foreground ml-auto">
                Last updated: {article.lastUpdated}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              {article.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {article.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="px-2 py-0 text-xs"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Was this article helpful?
              </h3>
              <div className="flex gap-4">
                <Button
                  variant={helpful === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHelpful(true)}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Yes, it helped
                </Button>
                <Button
                  variant={helpful === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHelpful(false)}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  No, I need more help
                </Button>
              </div>

              {helpful === false && (
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <p className="text-sm">
                    We're sorry this article didn't help. Please consider:
                  </p>
                  <ul className="mt-2 text-sm list-disc list-inside">
                    <li>
                      Checking our{" "}
                      <Link href="/faq" className="text-primary underline">
                        FAQ section
                      </Link>
                    </li>
                    <li>
                      Contacting our{" "}
                      <Link href="/help" className="text-primary underline">
                        support team
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="mr-2 h-4 w-4" />
                Share Article
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Article
              </Button>
            </div>
          </div>

          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-6">Related Articles</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {article.relatedArticles.map((related: any) => (
                  <Card key={related.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="line-clamp-2 text-lg">
                        {related.title}
                      </CardTitle>
                    </CardHeader>
                    <CardFooter className="pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 ml-auto"
                        asChild
                      >
                        <Link href={`/knowledge-base/${related.slug}`}>
                          Read Article
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href="/knowledge-base">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Knowledge Base
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/help">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse All Articles
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
