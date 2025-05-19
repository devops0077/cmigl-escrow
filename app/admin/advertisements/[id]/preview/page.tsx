import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAdvertisement } from "@/lib/advertisement-actions";
import { AdvertisementPreview } from "@/components/admin/advertisement-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PreviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  return (
    <div className="container py-6 px-4 md:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Advertisement Preview
        </h1>
      </div>

      <Suspense fallback={<PreviewSkeleton />}>
        <PreviewContent id={(await params).id} />
      </Suspense>
    </div>
  );
}

async function PreviewContent({ id }: { id: string }) {
  const advertisement = await getAdvertisement(id);

  if (!advertisement) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{advertisement.name}</CardTitle>
          <CardDescription>
            {advertisement.description || "No description provided"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <div className="font-medium">Type:</div>
              <div>{advertisement.type}</div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="font-medium">Status:</div>
              <div>{advertisement.status}</div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="font-medium">Priority:</div>
              <div>{advertisement.priority}</div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="font-medium">Start Date:</div>
              <div>
                {new Date(advertisement.startDate).toLocaleDateString()}
              </div>
            </div>
            {advertisement.endDate && (
              <div className="grid grid-cols-2 gap-1">
                <div className="font-medium">End Date:</div>
                <div>
                  {new Date(advertisement.endDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AdvertisementPreview advertisement={advertisement} />
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
