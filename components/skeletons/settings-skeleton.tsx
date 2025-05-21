import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-4 mb-4">
          <TabsTrigger
            value="profile"
            disabled
            className="flex items-center gap-2"
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16 hidden sm:inline-block" />
          </TabsTrigger>
          <TabsTrigger
            value="security"
            disabled
            className="flex items-center gap-2"
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16 hidden sm:inline-block" />
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            disabled
            className="flex items-center gap-2"
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16 hidden sm:inline-block" />
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            disabled
            className="items-center gap-2 hidden md:flex"
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16 hidden sm:inline-block" />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-8 w-28" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-60" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-60" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 border-t pt-6">
          <Skeleton className="h-10 w-full sm:w-40" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </CardFooter>
      </Card>
    </div>
  );
}
