"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAdminAdvertisements,
  deleteAdvertisement,
} from "@/lib/advertisement-actions";
import { toast } from "sonner";

interface AdManagementProps {
  initialAds?: any[];
}

export function AdvertisementManagement({
  initialAds = [],
}: AdManagementProps) {
  const [ads, setAds] = useState(initialAds);
  const [isLoading, setIsLoading] = useState(!initialAds.length);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();

  useEffect(() => {
    if (!initialAds.length) {
      fetchAds();
    }
  }, [initialAds.length]);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const data = await getAdminAdvertisements();
      setAds(data);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      toast.error("Failed to load advertisements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdvertisement(id);
      setAds(ads.filter((ad) => ad.id !== id));
      toast.success("Advertisement deleted successfully");
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      toast.error("Failed to delete advertisement");
    }
  };

  // Filter ads based on active tab
  const filteredAds = ads.filter((ad) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return ad.status === "ACTIVE";
    if (activeTab === "scheduled") return ad.status === "SCHEDULED";
    if (activeTab === "completed") return ad.status === "COMPLETED";
    if (activeTab === "draft") return ad.status === "DRAFT";
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Advertisement Management</CardTitle>
          <CardDescription>
            Create and manage advertisements across the platform
          </CardDescription>
        </div>
        <Button onClick={() => router.push("/admin/advertisements/new")}>
          Create Advertisement
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex h-48 w-full items-center justify-center">
                Loading advertisements...
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="flex h-48 w-full flex-col items-center justify-center">
                <p className="mb-2 text-muted-foreground">
                  No advertisements found
                </p>
                <Button
                  onClick={() => router.push("/admin/advertisements/new")}
                >
                  Create Advertisement
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead className="text-right">Metrics</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAds.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell className="font-medium">
                          <div className="truncate max-w-48">{ad.name}</div>
                          {ad.linkedReward && (
                            <div className="text-xs text-muted-foreground truncate max-w-48">
                              Linked to: {ad.linkedReward.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <AdTypeBadge type={ad.type} />
                        </TableCell>
                        <TableCell>
                          <AdStatusBadge status={ad.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>
                              Start:{" "}
                              {format(new Date(ad.startDate), "MMM d, yyyy")}
                            </div>
                            {ad.endDate && (
                              <div>
                                End:{" "}
                                {format(new Date(ad.endDate), "MMM d, yyyy")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-xs">
                            <div>{ad._count.impressions} impressions</div>
                            <div>{ad._count.clicks} clicks</div>
                            <div>
                              CTR:{" "}
                              {ad._count.impressions > 0
                                ? (
                                    (ad._count.clicks / ad._count.impressions) *
                                    100
                                  ).toFixed(2)
                                : 0}
                              %
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/admin/advertisements/${ad.id}/edit`
                                  )
                                }
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/admin/advertisements/${ad.id}/analytics`
                                  )
                                }
                              >
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/admin/advertisements/${ad.id}/preview`
                                  )
                                }
                              >
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(ad.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AdTypeBadge({ type }: { type: string }) {
  let variant: "default" | "secondary" | "outline" = "outline";
  let label = type;

  switch (type) {
    case "BANNER":
      variant = "default";
      label = "Banner";
      break;
    case "POPUP":
      variant = "outline";
      label = "Popup";
      break;
    case "FLASH":
      variant = "default";
      label = "Flash";
      break;
    case "TEXT":
      variant = "outline";
      label = "Text";
      break;
    case "REWARD_PROMO":
      variant = "secondary";
      label = "Reward";
      break;
  }

  return <Badge variant={variant}>{label}</Badge>;
}

function AdStatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "outline" | "destructive" = "outline";
  let label = status;

  switch (status) {
    case "ACTIVE":
      variant = "default";
      label = "Active";
      break;
    case "DRAFT":
      variant = "outline";
      label = "Draft";
      break;
    case "PAUSED":
      variant = "secondary";
      label = "Paused";
      break;
    case "COMPLETED":
      variant = "secondary";
      label = "Completed";
      break;
    case "SCHEDULED":
      variant = "outline";
      label = "Scheduled";
      break;
  }

  return <Badge variant={variant}>{label}</Badge>;
}
