"use client";

import type React from "react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdvertisementAnalytics } from "@/lib/advertisement-actions";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ArrowLeft, Eye, MousePointer, Percent, Users } from "lucide-react";

interface AdvertisementAnalyticsProps {
  id: string;
}

export function AdvertisementAnalytics({ id }: AdvertisementAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await getAdvertisementAnalytics(id);
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching advertisement analytics:", error);
        toast.error("Failed to load advertisement analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

  // Format daily stats for charts
  const chartData =
    analytics?.dailyStats?.map((day: any) => ({
      date: format(new Date(day.date), "MMM dd"),
      impressions: Number(day.impressions),
      clicks: Number(day.clicks),
      ctr:
        day.impressions > 0
          ? (Number(day.clicks) / Number(day.impressions)) * 100
          : 0,
    })) || [];

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => router.push("/admin/advertisements")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Advertisements
      </Button>

      {isLoading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Impressions"
              value={analytics?.totalImpressions.toLocaleString() || "0"}
              icon={<Eye className="h-4 w-4 text-muted-foreground" />}
              description="Number of times this ad was shown"
            />
            <MetricCard
              title="Total Clicks"
              value={analytics?.totalClicks.toLocaleString() || "0"}
              icon={<MousePointer className="h-4 w-4 text-muted-foreground" />}
              description="Number of times this ad was clicked"
            />
            <MetricCard
              title="Click-Through Rate"
              value={`${(analytics?.ctr || 0).toFixed(2)}%`}
              icon={<Percent className="h-4 w-4 text-muted-foreground" />}
              description="Percentage of impressions that resulted in clicks"
            />
            <MetricCard
              title="Unique Users"
              value={analytics?.uniqueUsers?.toLocaleString() || "N/A"}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              description="Number of unique users who saw this ad"
            />
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="impressions">Impressions</TabsTrigger>
              <TabsTrigger value="clicks">Clicks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Over Time</CardTitle>
                  <CardDescription>
                    Daily impressions and clicks for the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="impressions"
                          fill="#8884d8"
                          name="Impressions"
                        />
                        <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Click-Through Rate</CardTitle>
                  <CardDescription>
                    Daily CTR percentage for the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ctr"
                          stroke="#ff7300"
                          name="CTR (%)"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="impressions">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Impressions</CardTitle>
                  <CardDescription>
                    The most recent impressions for this advertisement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Placement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics?.recentImpressions?.length ? (
                        analytics.recentImpressions.map((impression: any) => (
                          <TableRow key={impression.id}>
                            <TableCell>
                              {format(
                                new Date(impression.timestamp),
                                "MMM dd, yyyy HH:mm:ss"
                              )}
                            </TableCell>
                            <TableCell>
                              {impression.userId || "Anonymous"}
                            </TableCell>
                            <TableCell>{impression.placement}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No impressions recorded yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clicks">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Clicks</CardTitle>
                  <CardDescription>
                    The most recent clicks for this advertisement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Placement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics?.recentClicks?.length ? (
                        analytics.recentClicks.map((click: any) => (
                          <TableRow key={click.id}>
                            <TableCell>
                              {format(
                                new Date(click.timestamp),
                                "MMM dd, yyyy HH:mm:ss"
                              )}
                            </TableCell>
                            <TableCell>{click.userId || "Anonymous"}</TableCell>
                            <TableCell>{click.placement}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No clicks recorded yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// Metric card component
function MetricCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[80px] mb-2" />
              <Skeleton className="h-3 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
