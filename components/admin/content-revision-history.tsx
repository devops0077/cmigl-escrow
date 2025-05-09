"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContentRevisions } from "@/lib/content-client";
import { restoreContentVersion } from "@/lib/content-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { History, AlertCircle, Loader2 } from "lucide-react";
import { ContentRevision } from "@/lib/generated/prisma";

interface ContentRevisionHistoryProps {
  contentId: string;
  onVersionRestored?: () => void;
}

export function ContentRevisionHistory({
  contentId,
  onVersionRestored,
}: ContentRevisionHistoryProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const {
    data: revisions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["contentRevisions", contentId],
    queryFn: () => getContentRevisions(contentId),
    enabled: isDialogOpen, // Only fetch when dialog is open
  });

  const handleRestoreVersion = async () => {
    if (!selectedRevision) return;

    setIsRestoring(true);
    try {
      await restoreContentVersion(contentId, selectedRevision.id);
      toast.success("Content version restored successfully");
      setIsRestoreDialogOpen(false);
      setIsDialogOpen(false);
      if (onVersionRestored) {
        onVersionRestored();
      }
    } catch (error) {
      console.error("Error restoring content version:", error);
      toast.error("Failed to restore content version");
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <History className="mr-2 h-4 w-4" />
            Version History
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of this content.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Failed to load revision history
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : revisions?.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No revision history available
            </p>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-4">
                {revisions?.map((revision: ContentRevision) => (
                  <div
                    key={revision.id}
                    className="flex flex-col space-y-2 p-3 rounded-md border hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setSelectedRevision(revision);
                      setIsRestoreDialogOpen(true);
                    }}
                    aria-disabled={true}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        Version {revision.version}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(String(revision.createdAt))}
                      </span>
                    </div>
                    <div className="text-sm line-clamp-2 text-muted-foreground">
                      {revision.content.substring(0, 150)}...
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Restore Version {selectedRevision?.version}?
            </DialogTitle>
            <DialogDescription>
              This will replace the current content with version{" "}
              {selectedRevision?.version} from{" "}
              {selectedRevision ? formatDate(selectedRevision.createdAt) : ""}.
              This action will create a new version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant={"outline"}
              disabled={isRestoring}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsRestoreDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRestoreVersion} disabled={isRestoring}>
              {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
