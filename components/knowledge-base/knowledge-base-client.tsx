"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ChevronRight,
  Clock,
  ArrowRight,
  Tag,
  Users,
  Shield,
  CreditCard,
  FileText,
  HelpCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Types for our knowledge base articles
type ArticleCategory =
  | "getting-started"
  | "account"
  | "transactions"
  | "security"
  | "payments"
  | "disputes"
  | "general";

interface Article {
  id: string;
  title: string;
  description: string;
  category: ArticleCategory;
  tags: string[];
  readTime: number;
  slug: string;
  popular?: boolean;
  featured?: boolean;
}

// Sample knowledge base articles
const articles: Article[] = [
  {
    id: "1",
    title: "Getting Started with CMIGL Escrow",
    description:
      "Learn the basics of our escrow service and how to complete your first transaction.",
    category: "getting-started",
    tags: ["beginners", "overview", "basics"],
    readTime: 5,
    slug: "getting-started-with-escrow",
    featured: true,
  },
  {
    id: "2",
    title: "How to Create and Verify Your Account",
    description:
      "A step-by-step guide to setting up your account and completing verification.",
    category: "account",
    tags: ["verification", "kyc", "registration"],
    readTime: 7,
    slug: "create-and-verify-account",
    popular: true,
  },
  {
    id: "3",
    title: "Understanding Transaction Fees",
    description:
      "Learn about our fee structure and how fees are calculated for different transaction types.",
    category: "transactions",
    tags: ["fees", "pricing", "costs"],
    readTime: 4,
    slug: "understanding-transaction-fees",
    popular: true,
  },
  {
    id: "4",
    title: "Securing Your Account with Two-Factor Authentication",
    description:
      "Enhance your account security by enabling and using two-factor authentication.",
    category: "security",
    tags: ["2fa", "security", "protection"],
    readTime: 6,
    slug: "two-factor-authentication",
  },
  {
    id: "5",
    title: "Adding and Withdrawing Funds from Your Wallet",
    description:
      "Learn how to manage your escrow wallet, add funds, and make withdrawals.",
    category: "payments",
    tags: ["wallet", "funds", "withdrawals"],
    readTime: 8,
    slug: "managing-your-wallet",
    popular: true,
  },
  {
    id: "6",
    title: "How to Handle Transaction Disputes",
    description:
      "A comprehensive guide to the dispute resolution process and how to submit evidence.",
    category: "disputes",
    tags: ["disputes", "resolution", "conflicts"],
    readTime: 10,
    slug: "handling-disputes",
    featured: true,
  },
  {
    id: "7",
    title: "Buyer's Guide to Safe Transactions",
    description:
      "Best practices for buyers to ensure safe and successful transactions.",
    category: "transactions",
    tags: ["buyers", "safety", "best-practices"],
    readTime: 9,
    slug: "buyers-guide",
  },
  {
    id: "8",
    title: "Seller's Guide to Safe Transactions",
    description:
      "Best practices for sellers to ensure safe and successful transactions.",
    category: "transactions",
    tags: ["sellers", "safety", "best-practices"],
    readTime: 9,
    slug: "sellers-guide",
  },
  {
    id: "9",
    title: "Understanding Escrow Statuses",
    description:
      "Learn about the different transaction statuses and what they mean.",
    category: "transactions",
    tags: ["status", "tracking", "process"],
    readTime: 5,
    slug: "escrow-statuses",
  },
  {
    id: "10",
    title: "Payment Methods Accepted",
    description:
      "A detailed overview of all payment methods supported by our platform.",
    category: "payments",
    tags: ["payments", "methods", "options"],
    readTime: 4,
    slug: "payment-methods",
  },
  {
    id: "11",
    title: "How to Contact Support",
    description:
      "Different ways to get help and support for your escrow transactions.",
    category: "general",
    tags: ["support", "help", "contact"],
    readTime: 3,
    slug: "contact-support",
  },
  {
    id: "12",
    title: "Account Recovery Options",
    description:
      "What to do if you forget your password or lose access to your account.",
    category: "account",
    tags: ["recovery", "password", "access"],
    readTime: 5,
    slug: "account-recovery",
  },
  {
    id: "13",
    title: "Data Privacy and Protection",
    description:
      "How we protect your data and maintain privacy on our platform.",
    category: "security",
    tags: ["privacy", "data", "protection"],
    readTime: 7,
    slug: "data-privacy",
  },
  {
    id: "14",
    title: "International Transactions",
    description:
      "Guidelines for conducting escrow transactions across international borders.",
    category: "transactions",
    tags: ["international", "global", "cross-border"],
    readTime: 8,
    slug: "international-transactions",
  },
  {
    id: "15",
    title: "Mobile App Features",
    description:
      "A guide to using our mobile application for escrow transactions on the go.",
    category: "general",
    tags: ["mobile", "app", "features"],
    readTime: 6,
    slug: "mobile-app-features",
  },
];

// Category information with icons and descriptions
const categories = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Essential guides for new users",
  },
  {
    id: "account",
    name: "Account Management",
    icon: <Users className="h-5 w-5" />,
    description: "Managing your profile and settings",
  },
  {
    id: "transactions",
    name: "Transactions",
    icon: <ArrowRight className="h-5 w-5" />,
    description: "Creating and managing escrow transactions",
  },
  {
    id: "security",
    name: "Security",
    icon: <Shield className="h-5 w-5" />,
    description: "Keeping your account and transactions secure",
  },
  {
    id: "payments",
    name: "Payments & Wallet",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Managing funds and payment methods",
  },
  {
    id: "disputes",
    name: "Disputes & Resolution",
    icon: <HelpCircle className="h-5 w-5" />,
    description: "Handling transaction disputes",
  },
  {
    id: "general",
    name: "General Information",
    icon: <FileText className="h-5 w-5" />,
    description: "Platform policies and general guides",
  },
];

export function KnowledgeBaseClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(articles);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Filter articles based on search query and active category
  useEffect(() => {
    let filtered = articles;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (activeCategory !== "all") {
      filtered = filtered.filter(
        (article) => article.category === activeCategory
      );
    }

    setFilteredArticles(filtered);
  }, [searchQuery, activeCategory]);

  // Get featured articles
  const featuredArticles = articles.filter((article) => article.featured);

  // Get popular articles
  const popularArticles = articles.filter((article) => article.popular);

  return (
    <main className="w-full">
      <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-24 lg:py-32">
        <div className="mx-auto px-4 md:px-6">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
              Knowledge Base
            </h1>
            <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
              Find comprehensive guides and resources to help you make the most
              of our escrow services.
            </p>
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for articles, guides, and topics..."
                className="w-full pl-10 pr-4 py-6 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-12 md:py-16 lg:py-20">
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={setActiveCategory}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Browse by Category
            </h2>
            <TabsList className="h-auto flex-wrap justify-start md:justify-end">
              <TabsTrigger value="all" className="text-sm">
                All Categories
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-sm"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Separator className="my-6" />

          <TabsContent value="all" className="mt-0">
            {/* Featured Articles Section */}
            {featuredArticles.length > 0 && (
              <div className="mb-12">
                <h3 className="mb-6 text-xl font-semibold">
                  Featured Articles
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}

            {/* All Articles Section */}
            <div>
              <h3 className="mb-6 text-xl font-semibold">
                All Articles{" "}
                {searchQuery && `(${filteredArticles.length} results)`}
              </h3>
              {filteredArticles.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <h4 className="mb-2 text-lg font-medium">
                    No articles found
                  </h4>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter to find what you're
                    looking for.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Category-specific tabs */}
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  {category.icon}
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                </div>
                <p className="text-muted-foreground">{category.description}</p>
              </div>

              {filteredArticles.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <h4 className="mb-2 text-lg font-medium">
                    No articles found
                  </h4>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter to find what you're
                    looking for.
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Popular Articles Section */}
        {popularArticles.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-6 text-xl font-semibold">Popular Articles</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-16 rounded-lg bg-muted p-8 text-center">
          <h3 className="mb-2 text-xl font-semibold">
            Can't find what you're looking for?
          </h3>
          <p className="mb-6 text-muted-foreground">
            Our support team is ready to help you with any questions you may
            have.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/help">Contact Support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/faq">
                View FAQ
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

// Article Card Component
function ArticleCard({ article }: { article: Article }) {
  const categoryInfo = categories.find((cat) => cat.id === article.category);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          {categoryInfo?.icon}
          <Badge variant="secondary" className="px-2 py-0 text-xs">
            {categoryInfo?.name}
          </Badge>
          {article.featured && (
            <Badge variant="default" className="ml-auto px-2 py-0 text-xs">
              Featured
            </Badge>
          )}
          {article.popular && !article.featured && (
            <Badge variant="outline" className="ml-auto px-2 py-0 text-xs">
              Popular
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2">{article.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {article.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="px-2 py-0 text-xs">
              <Tag className="mr-1 h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-1 h-4 w-4" />
          {article.readTime} min read
        </div>
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link href={`/knowledge-base/${article.slug}`}>
            Read Article
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
