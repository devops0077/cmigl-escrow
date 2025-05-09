"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UnauthorizedError } from "./error-class";
import { createNotification } from "./notification-service";
import axios from "axios";

// Function to handle file upload
async function uploadAttachment(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(
      process.env.NEXT_PUBLIC_APP_URL + "/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload attachment");
  }
}

// Submit feedback
export async function submitFeedback(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new UnauthorizedError("You must be logged in to submit feedback");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as
      | "SUGGESTION"
      | "BUG_REPORT"
      | "FEATURE_REQUEST"
      | "GENERAL";
    const rating = Number.parseInt(formData.get("rating") as string);
    const attachment = formData.get("attachment") as File | null;

    let attachmentUrl: string | null = null;

    if (attachment && attachment instanceof File && attachment.size > 0) {
      attachmentUrl = await uploadAttachment(attachment);
    }

    const feedback = await prisma.platformFeedback.create({
      data: {
        userId: user.id,
        title,
        description,
        type,
        rating,
        attachments: attachmentUrl,
        status: "PENDING",
      },
    });

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: "New Feedback Submitted",
        message: `A new ${type.toLowerCase().replace("_", " ")} has been submitted: "${title}"`,
        type: "SYSTEM_NOTIFICATION",
        data: { feedbackId: feedback.id },
      });
    }

    revalidatePath("/admin/feedback");

    return { success: true, feedbackId: feedback.id };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to submit feedback",
    };
  }
}

// Get all feedback (admin only)
export async function getAllFeedback() {
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

  const feedback = await prisma.platformFeedback.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return feedback;
}

// Get feedback by ID (admin only)
export async function getFeedbackById(id: string) {
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

  const feedback = await prisma.platformFeedback.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
    },
  });

  if (!feedback) {
    throw new Error("Feedback not found");
  }

  return feedback;
}

// Update feedback status (admin only)
export async function updateFeedbackStatus(
  id: string,
  status: "PENDING" | "REVIEWED" | "IMPLEMENTED" | "REJECTED",
  adminNotes?: string
) {
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

  const feedback = await prisma.platformFeedback.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || undefined,
      updatedAt: new Date(),
    },
  });

  // Notify the user who submitted the feedback
  await createNotification({
    userId: feedback.userId,
    title: "Feedback Status Updated",
    message: `Your feedback "${feedback.title}" has been ${status.toLowerCase()}`,
    type: "SYSTEM_NOTIFICATION",
    data: { feedbackId: feedback.id },
  });

  revalidatePath("/admin/feedback");

  return feedback;
}
