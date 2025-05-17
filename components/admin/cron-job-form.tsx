"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCronJob } from "@/lib/cron-job-actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Form schema validation
const formSchema = z.object({
  id: z.string().min(3, {
    message: "Job ID must be at least 3 characters.",
  }),
  url: z.string().url({
    message: "Please enter a valid URL.",
  }),
  schedule: z.string().min(9, {
    message: "Please enter a valid cron schedule.",
  }),
  cronSecret: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CronJobForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      url: "",
      schedule: "0 0 * * *", // Default: Run at midnight every day
      cronSecret: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("id", values.id);
      formData.append("url", values.url);
      formData.append("schedule", values.schedule);
      if (values.cronSecret) {
        formData.append("cronSecret", values.cronSecret);
      }

      const result = await createCronJob(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Cron job created successfully",
        });
        form.reset();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create cron job",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Cron Job</CardTitle>
        <CardDescription>
          Schedule a new cron job to run at specified intervals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Cron jobs will make POST requests to the specified URL at the
            scheduled time. Make sure your endpoint can handle these requests
            properly.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job ID</FormLabel>
                  <FormControl>
                    <Input placeholder="daily-backup" {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique identifier for this cron job
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/api/cron/daily-task"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The URL that will be called when the cron job runs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Cron Schedule</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4 mr-1" /> Help
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Cron Format</h4>
                          <p className="text-sm">Format: * * * * *</p>
                          <p className="text-sm">┬ ┬ ┬ ┬ ┬</p>
                          <p className="text-sm">
                            │ │ │ │ └─ day of week (0-6)
                          </p>
                          <p className="text-sm">│ │ │ └─── month (1-12)</p>
                          <p className="text-sm">
                            │ │ └───── day of month (1-31)
                          </p>
                          <p className="text-sm">│ └─────── hour (0-23)</p>
                          <p className="text-sm">└───────── minute (0-59)</p>
                          <p className="text-sm mt-2">Examples:</p>
                          <p className="text-sm">
                            0 0 * * * - Daily at midnight
                          </p>
                          <p className="text-sm">0 */6 * * * - Every 6 hours</p>
                          <p className="text-sm">
                            0 9 * * 1-5 - Weekdays at 9 AM
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    When to run the job (cron format)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cronSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authorization Secret (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Secret token for authorization"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Will be sent as Bearer token in Authorization header
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Cron Job"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
