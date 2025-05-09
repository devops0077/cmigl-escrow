import { CalendarIcon, Clock } from "lucide-react";

interface ContentVersionInfoProps {
  version: number;
  updatedAt: Date | string;
  publishedAt: Date | string | null;
}

export function ContentVersionInfo({
  version,
  updatedAt,
  publishedAt,
}: ContentVersionInfoProps) {
  // Format dates
  const formattedUpdatedAt = new Date(updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedPublishedAt = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-muted-foreground border-t pt-4">
      <div className="flex items-center">
        <span className="font-medium mr-2">Version {version}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:space-x-4 mt-2 sm:mt-0">
        {formattedPublishedAt && (
          <div className="flex items-center">
            <CalendarIcon className="mr-1 h-4 w-4" />
            <span>Published: {formattedPublishedAt}</span>
          </div>
        )}

        <div className="flex items-center mt-1 sm:mt-0">
          <Clock className="mr-1 h-4 w-4" />
          <span>Last updated: {formattedUpdatedAt}</span>
        </div>
      </div>
    </div>
  );
}
