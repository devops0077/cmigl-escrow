// Client-side content fetching functions
import { toast } from "sonner";

// Define content types
export type ContentType =
  | "KNOWLEDGE_BASE"
  | "TUTORIAL"
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "FAQ";

// Interface for content items
export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  type: ContentType;
  category?: string | null;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  version: number;
}

// Get content by ID
export async function getContentById(
  id: string
): Promise<{ id: string; content: string }> {
  try {
    const response = await fetch(`/api/content/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Use cache: 'no-cache' to always get fresh content
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching content:", error);
    // Re-throw to let React Query handle it
    throw error;
  }
}

// Get content by slug
export async function getContentBySlug(slug: string): Promise<ContentItem> {
  try {
    const response = await fetch(`/api/content/slug/${slug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Use cache: 'no-cache' to always get fresh content
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching content by slug:", error);
    toast.error("Failed to load content");
    throw error;
  }
}

// Get content by type
export async function getContentByType(
  type: ContentType
): Promise<ContentItem[]> {
  try {
    const response = await fetch(`/api/content/type/${type}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Use cache: 'no-cache' to always get fresh content
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching content by type:", error);
    toast.error("Failed to load content");
    throw error;
  }
}

// Get content revisions
export async function getContentRevisions(id: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/content/${id}/revisions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch revisions: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching content revisions:", error);
    toast.error("Failed to load revision history");
    throw error;
  }
}
