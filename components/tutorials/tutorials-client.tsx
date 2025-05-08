"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Play,
  Clock,
  Filter,
  Search,
  ChevronRight,
  BookOpen,
  Video,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types for our tutorials
type TutorialType = "video" | "article" | "interactive";
type TutorialCategory =
  | "getting-started"
  | "transactions"
  | "account"
  | "security"
  | "payments"
  | "disputes";
type TutorialLevel = "beginner" | "intermediate" | "advanced";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  type: TutorialType;
  category: TutorialCategory;
  level: TutorialLevel;
  duration: number; // in minutes
  thumbnail: string;
  slug: string;
  videoUrl?: string;
  featured?: boolean;
}

// Sample tutorials data
const tutorials: Tutorial[] = [
  {
    id: "1",
    title: "Getting Started with CMIGL Escrow",
    description:
      "A complete walkthrough of the platform and your first transaction",
    type: "video",
    category: "getting-started",
    level: "beginner",
    duration: 8,
    thumbnail: "/placeholder.svg?height=480&width=640",
    slug: "getting-started-walkthrough",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    featured: true,
  },
  {
    id: "2",
    title: "How to Create a Secure Transaction",
    description:
      "Learn how to set up transactions with proper terms and conditions",
    type: "video",
    category: "transactions",
    level: "beginner",
    duration: 12,
    thumbnail: "/placeholder.svg?height=480&width=640",
    slug: "create-secure-transaction",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "3",
    title: "Account Verification Guide",
    description:
      "Step-by-step process to verify your identity and complete KYC",
    type: "article",
    category: "account",
    level: "beginner",
    duration: 5,
    thumbnail: "/placeholder.svg?height=480&width=640",
    slug: "account-verification-guide",
  },
  {
    id: "4",
    title: "Handling Transaction Disputes",
    description:
      "How to submit evidence and navigate the dispute resolution process",
    type: "video",
    category: "disputes",
    level: "intermediate",
    duration: 15,
    thumbnail: "/placeholder.svg?height=480&width=640",
    slug: "handling-disputes",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    featured: true,
  },
  {
    id: "5",
    title: "Managing Your Escrow Wallet",
    description:
      "Learn how to fund, withdraw, and track your escrow wallet balance",
    type: "interactive",
    category: "payments",
    level: "beginner",
    duration: 10,
    thumbnail: "/placeholder.svg?height=480&width=640",
    slug: "managing-wallet",
  },
  {
    id: "6",
    title: "Advanced Security Features",
    description:
      "Setting up two-factor authentication and other security measures",
    type: "article",
    category: "security",
    level: "advanced",
    duration: 7,
    thumbnail: "/placeholder.svg?height=480&width=640",
    slug: "advanced-security",
  },
  {
    id: "7",
    title: "International Transactions Guide",
    description: "Special considerations for cross-border escrow transactions",
    type: "video",
    category: "transactions",
    level: "intermediate",
    duration: 18,
    thumbnail: "/placeholder.svg?height=480&width=640",
    slug: "international-transactions",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "8",
    title: "Escrow for Digital Products",
    description:
      "How to use escrow for software, digital assets, and online services",
    type: "article",
    category: "transactions",
    level: "intermediate",
    duration: 9,
    thumbnail: "/placeholder.svg?height=480&width=640",
    slug: "digital-products-escrow",
  },
  {
    id: "9",
    title: "Mobile App Tutorial",
    description: "Complete guide to using the CMIGL Escrow mobile application",
    type: "video",
    category: "getting-started",
    level: "beginner",
    duration: 14,
    thumbnail: "/placeholder.svg?height=480&width=640",
    slug: "mobile-app-tutorial",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
];

// Category information
const categories = [
  { id: "getting-started", name: "Getting Started" },
  { id: "transactions", name: "Transactions" },
  { id: "account", name: "Account Management" },
  { id: "security", name: "Security" },
  { id: "payments", name: "Payments & Wallet" },
  { id: "disputes", name: "Disputes & Resolution" },
];

// Tutorial types
const tutorialTypes = [
  { id: "video", name: "Video Tutorials", icon: <Video className="h-4 w-4" /> },
  {
    id: "article",
    name: "Written Guides",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "interactive",
    name: "Interactive Tutorials",
    icon: <ArrowRight className="h-4 w-4" />,
  },
];

// Experience levels
const experienceLevels = [
  { id: "beginner", name: "Beginner" },
  { id: "intermediate", name: "Intermediate" },
  { id: "advanced", name: "Advanced" },
];

export function TutorialsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(
    null
  );

  // Filter tutorials based on search query and filters
  const filteredTutorials = tutorials.filter((tutorial) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      selectedCategory === "all" || tutorial.category === selectedCategory;

    // Type filter
    const matchesType =
      selectedType === "all" || tutorial.type === selectedType;

    // Level filter
    const matchesLevel =
      selectedLevel === "all" || tutorial.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesType && matchesLevel;
  });

  // Get featured tutorials
  const featuredTutorials = tutorials.filter((tutorial) => tutorial.featured);

  return (
    <main className="flex-1">
      <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-24 lg:py-32">
        <div className="mx-auto px-4 md:px-6">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
              Tutorials & Guides
            </h1>
            <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
              Learn how to use our escrow platform with step-by-step tutorials,
              videos, and interactive guides.
            </p>
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for tutorials..."
                className="w-full pl-10 pr-4 py-6 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-12 md:py-16 lg:py-20">
        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Browse Tutorials
          </h2>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {tutorialTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {experienceLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Tutorials</TabsTrigger>
            {tutorialTypes.map((type) => (
              <TabsTrigger
                key={type.id}
                value={type.id}
                onClick={() => setSelectedType(type.id)}
              >
                <span className="flex items-center gap-1">
                  {type.icon}
                  {type.name}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            {/* Featured Tutorials Section */}
            {featuredTutorials.length > 0 && (
              <div className="mb-12">
                <h3 className="mb-6 text-xl font-semibold">
                  Featured Tutorials
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredTutorials.map((tutorial) => (
                    <TutorialCard
                      key={tutorial.id}
                      tutorial={tutorial}
                      onSelect={() => setSelectedTutorial(tutorial)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Tutorials Section */}
            <div>
              <h3 className="mb-6 text-xl font-semibold">
                All Tutorials{" "}
                {filteredTutorials.length !== tutorials.length &&
                  `(${filteredTutorials.length} results)`}
              </h3>
              {filteredTutorials.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTutorials.map((tutorial) => (
                    <TutorialCard
                      key={tutorial.id}
                      tutorial={tutorial}
                      onSelect={() => setSelectedTutorial(tutorial)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <h4 className="mb-2 text-lg font-medium">
                    No tutorials found
                  </h4>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters to find what you're
                    looking for.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Type-specific tabs */}
          {tutorialTypes.map((type) => (
            <TabsContent key={type.id} value={type.id}>
              <div className="mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {type.icon}
                  {type.name}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {type.id === "video" &&
                    "Watch step-by-step video tutorials to learn visually."}
                  {type.id === "article" &&
                    "Read comprehensive written guides with detailed instructions."}
                  {type.id === "interactive" &&
                    "Follow interactive tutorials that guide you through the process."}
                </p>
              </div>

              {filteredTutorials.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTutorials.map((tutorial) => (
                    <TutorialCard
                      key={tutorial.id}
                      tutorial={tutorial}
                      onSelect={() => setSelectedTutorial(tutorial)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <h4 className="mb-2 text-lg font-medium">
                    No tutorials found
                  </h4>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters to find what you're
                    looking for.
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Help Section */}
        <div className="mt-16 rounded-lg bg-muted p-8 text-center">
          <h3 className="mb-2 text-xl font-semibold">Need more help?</h3>
          <p className="mb-6 text-muted-foreground">
            Check out our knowledge base or contact our support team for
            assistance.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/knowledge-base">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Knowledge Base
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/help">
                Contact Support
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Tutorial Dialog */}
      {selectedTutorial && selectedTutorial.type === "video" && (
        <Dialog
          open={!!selectedTutorial}
          onOpenChange={(open) => !open && setSelectedTutorial(null)}
        >
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{selectedTutorial.title}</DialogTitle>
              <DialogDescription>
                {selectedTutorial.description}
              </DialogDescription>
            </DialogHeader>
            <div className="aspect-video w-full overflow-hidden rounded-md">
              <iframe
                width="100%"
                height="100%"
                src={selectedTutorial.videoUrl}
                title={selectedTutorial.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video"
              ></iframe>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}

// Tutorial Card Component
function TutorialCard({
  tutorial,
  onSelect,
}: {
  tutorial: Tutorial;
  onSelect: () => void;
}) {
  const typeInfo = {
    video: { icon: <Video className="h-4 w-4" />, label: "Video" },
    article: { icon: <FileText className="h-4 w-4" />, label: "Article" },
    interactive: {
      icon: <ArrowRight className="h-4 w-4" />,
      label: "Interactive",
    },
  };

  const levelColors = {
    beginner:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    intermediate:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    advanced:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Image
          src={tutorial.thumbnail || "/placeholder.svg"}
          alt={tutorial.title}
          width={640}
          height={360}
          className="aspect-video w-full object-cover"
        />
        {tutorial.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Button
              size="icon"
              variant="ghost"
              className="h-12 w-12 rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
              onClick={onSelect}
            >
              <Play className="h-6 w-6" />
              <span className="sr-only">Play video</span>
            </Button>
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute left-2 top-2 flex items-center gap-1"
        >
          {typeInfo[tutorial.type].icon}
          {typeInfo[tutorial.type].label}
        </Badge>
        {tutorial.featured && (
          <Badge className="absolute right-2 top-2">Featured</Badge>
        )}
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2">{tutorial.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {tutorial.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`px-2 py-0 text-xs ${levelColors[tutorial.level]}`}
          >
            {tutorial.level.charAt(0).toUpperCase() + tutorial.level.slice(1)}
          </Badge>
          <span className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            {tutorial.duration} min
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        {tutorial.type === "video" ? (
          <Button className="w-full" onClick={onSelect}>
            <Play className="mr-2 h-4 w-4" />
            Watch Tutorial
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href={`/tutorials/${tutorial.slug}`}>
              <FileText className="mr-2 h-4 w-4" />
              View Tutorial
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
