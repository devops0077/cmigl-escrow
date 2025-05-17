"use client";

import { useState, useEffect } from "react";
import {
  getAllCronJobs,
  deleteCronJob,
  checkCronServerHealth,
} from "@/lib/cron-job-actions";
import { useToast } from "@/hooks/use-toast";
import type { CronJob } from "@/lib/cron-job-service";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function CronJobsList() {
  const [jobs, setJobs] = useState<Record<string, CronJob>>({});
  const [loading, setLoading] = useState(true);
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    timestamp: string;
    activeJobs: number;
  } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Fetch all cron jobs
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const result = await getAllCronJobs();
      if (result.success) {
        setJobs(result.data);
      } else {
        toast.error("Error", {
          description: result.error || "Failed to fetch cron jobs",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check server health
  const fetchServerHealth = async () => {
    setHealthLoading(true);
    try {
      const result = await checkCronServerHealth();
      if (result.success) {
        setServerHealth(result.data);
      } else {
        toast.error("Error", {
          description: result.error || "Failed to check server health",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to connect to cron server",
      });
    } finally {
      setHealthLoading(false);
    }
  };

  // Handle job deletion
  const handleDeleteJob = async (id: string) => {
    try {
      const result = await deleteCronJob(id);
      if (result.success) {
        toast.success("Success", {
          description: "Cron job deleted successfully",
        });
        fetchJobs(); // Refresh the list
      } else {
        toast.error("Error", {
          description: result.error || "Failed to delete cron job",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    }
    setJobToDelete(null);
  };

  // Load data on component mount
  useEffect(() => {
    fetchJobs();
    fetchServerHealth();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cron Server Status</CardTitle>
            <CardDescription>
              Current status of the cron job server
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchServerHealth}
            disabled={healthLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${healthLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {serverHealth ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className="bg-muted p-2 rounded-full">
                  {serverHealth.status === "healthy" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {serverHealth.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-muted p-2 rounded-full">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Last Check</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(serverHealth.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-muted p-2 rounded-full">
                  <Badge className="h-5 w-5 flex items-center justify-center">
                    {serverHealth.activeJobs}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Active Jobs</p>
                  <p className="text-sm text-muted-foreground">
                    {serverHealth.activeJobs} running
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                {healthLoading
                  ? "Checking server status..."
                  : "Server status unavailable"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scheduled Cron Jobs</CardTitle>
            <CardDescription>Manage your scheduled cron jobs</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading cron jobs...</p>
            </div>
          ) : Object.keys(jobs).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(jobs).map(([id, job]) => (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{id}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {job.schedule}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <span title={job.url}>{job.url}</span>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(job.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog
                        open={jobToDelete === id}
                        onOpenChange={(open) => !open && setJobToDelete(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setJobToDelete(id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Cron Job</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this cron job?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDeleteJob(id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cron jobs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new cron job to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
