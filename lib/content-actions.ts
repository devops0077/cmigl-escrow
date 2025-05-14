"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { UnauthorizedError } from "./error-class";
import { slugify } from "./utils";
import { cache } from "react";

// Check if user is admin
async function checkAdminPermission() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new UnauthorizedError("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    throw new UnauthorizedError("Admin access required");
  }

  return user;
}

// Get content by type
export async function getContentByType(
  type:
    | "KNOWLEDGE_BASE"
    | "TUTORIAL"
    | "TERMS_OF_SERVICE"
    | "PRIVACY_POLICY"
    | "FAQ"
) {
  const content = await prisma.contentItem.findMany({
    where: { type },
    orderBy: { updatedAt: "desc" },
  });

  return content;
}

// Get published content by type
export async function getPublishedContentByType(
  type:
    | "KNOWLEDGE_BASE"
    | "TUTORIAL"
    | "TERMS_OF_SERVICE"
    | "PRIVACY_POLICY"
    | "FAQ"
) {
  const content = await prisma.contentItem.findMany({
    where: {
      type,
      published: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return content;
}

// Get content by slug
export async function getContentBySlug(slug: string) {
  const content = await prisma.contentItem.findUnique({
    where: { slug, published: true },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return content;
}

// Get content by ID - cached for 5 minutes
export const getContentById = cache(async (id: string) => {
  const content = await prisma.contentItem.findUnique({
    where: { id },
  });

  return content;
});

// Create content
export async function createContent(data: {
  title: string;
  slug: string;
  content: string;
  type:
    | "KNOWLEDGE_BASE"
    | "TUTORIAL"
    | "TERMS_OF_SERVICE"
    | "PRIVACY_POLICY"
    | "FAQ";
  category?: string | null;
  tags: string[];
  published: boolean;
}) {
  const admin = await checkAdminPermission();

  // Check if slug exists
  const existingContent = await prisma.contentItem.findUnique({
    where: { slug: data.slug },
  });

  if (existingContent) {
    throw new Error("A content item with this slug already exists");
  }

  // Create content
  const content = await prisma.contentItem.create({
    data: {
      title: data.title,
      slug: data.slug || slugify(data.title),
      content: data.content,
      type: data.type,
      category: data.category,
      tags: data.tags,
      published: data.published,
      publishedAt: data.published ? new Date() : null,
      authorId: admin.id,
      version: 1,
      revisions: {
        create: {
          content: data.content,
          version: 1,
        },
      },
    },
  });

  // Revalidate paths and tags
  revalidatePath(`/${data.type.toLowerCase().replace(/_/g, "-")}`);
  revalidateTag(`content-${data.type.toLowerCase()}`);
  revalidateTag(`content-${content.id}`);
  revalidateTag(`content-slug-${content.slug}`);

  return content;
}

// Update content
export async function updateContent(
  id: string,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    category?: string | null;
    tags?: string[];
    published?: boolean;
  }
) {
  await checkAdminPermission();

  // Get current content
  const currentContent = await prisma.contentItem.findUnique({
    where: { id },
  });

  if (!currentContent) {
    throw new Error("Content not found");
  }

  // Check if slug exists (if changing slug)
  if (data.slug && data.slug !== currentContent.slug) {
    const existingContent = await prisma.contentItem.findUnique({
      where: { slug: data.slug },
    });

    if (existingContent && existingContent.id !== id) {
      throw new Error("A content item with this slug already exists");
    }
  }

  // Determine if content has changed
  const contentChanged =
    data.content && data.content !== currentContent.content;

  // Update content
  const updatedContent = await prisma.contentItem.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
      category: data.category,
      tags: data.tags,
      published: data.published,
      publishedAt:
        data.published && !currentContent.published
          ? new Date()
          : currentContent.publishedAt,
      updatedAt: new Date(),
      version: contentChanged
        ? currentContent.version + 1
        : currentContent.version,
      ...(contentChanged && {
        revisions: {
          create: {
            content: data.content as string,
            version: currentContent.version + 1,
          },
        },
      }),
    },
  });

  // Revalidate paths and tags
  revalidatePath(`/${currentContent.type.toLowerCase().replace(/_/g, "-")}`);
  if (currentContent.slug) {
    revalidatePath(
      `/${currentContent.type.toLowerCase().replace(/_/g, "-")}/${currentContent.slug}`
    );
  }
  if (data.slug && data.slug !== currentContent.slug) {
    revalidatePath(
      `/${currentContent.type.toLowerCase().replace(/_/g, "-")}/${data.slug}`
    );
  }

  revalidateTag(`content-${currentContent.type.toLowerCase()}`);
  revalidateTag(`content-${id}`);
  revalidateTag(`content-slug-${currentContent.slug}`);
  if (data.slug && data.slug !== currentContent.slug) {
    revalidateTag(`content-slug-${data.slug}`);
  }

  return updatedContent;
}

// Restore content to a previous version
export async function restoreContentVersion(
  contentId: string,
  revisionId: string
) {
  await checkAdminPermission();

  // Get the revision
  const revision = await prisma.contentRevision.findUnique({
    where: { id: revisionId },
  });

  if (!revision || revision.contentId !== contentId) {
    throw new Error("Revision not found or does not belong to this content");
  }

  // Get current content
  const currentContent = await prisma.contentItem.findUnique({
    where: { id: contentId },
  });

  if (!currentContent) {
    throw new Error("Content not found");
  }

  // Update content with revision content and increment version
  const updatedContent = await prisma.contentItem.update({
    where: { id: contentId },
    data: {
      content: revision.content,
      version: currentContent.version + 1,
      updatedAt: new Date(),
      revisions: {
        create: {
          content: revision.content,
          version: currentContent.version + 1,
        },
      },
    },
  });

  // Revalidate paths and tags
  revalidatePath(`/${currentContent.type.toLowerCase().replace(/_/g, "-")}`);
  if (currentContent.slug) {
    revalidatePath(
      `/${currentContent.type.toLowerCase().replace(/_/g, "-")}/${currentContent.slug}`
    );
  }

  revalidateTag(`content-${currentContent.type.toLowerCase()}`);
  revalidateTag(`content-${contentId}`);
  revalidateTag(`content-slug-${currentContent.slug}`);

  return updatedContent;
}

// Delete content
export async function deleteContent(id: string) {
  await checkAdminPermission();

  // Get content
  const content = await prisma.contentItem.findUnique({
    where: { id },
  });

  if (!content) {
    throw new Error("Content not found");
  }

  // Delete content
  await prisma.contentItem.delete({
    where: { id },
  });

  // Revalidate paths
  revalidatePath(`/${content.type.toLowerCase().replace(/_/g, "-")}`);
  if (content.slug) {
    revalidatePath(
      `/${content.type.toLowerCase().replace(/_/g, "-")}/${content.slug}`
    );
  }

  return { success: true };
}

// Get content revisions
export async function getContentRevisions(id: string) {
  await checkAdminPermission();

  const revisions = await prisma.contentRevision.findMany({
    where: { contentId: id },
    orderBy: { version: "desc" },
  });

  return revisions;
}

// Get latest terms of service - cached for 5 minutes
export const getLatestTermsOfService = async () => {
  const terms = await prisma.contentItem.findFirst({
    where: {
      type: "TERMS_OF_SERVICE",
      published: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return terms;
};

export const getLatestPrivacyPolicy = async () => {
  const privacy = await prisma.contentItem.findFirst({
    where: {
      type: "PRIVACY_POLICY",
      published: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return privacy;
};
