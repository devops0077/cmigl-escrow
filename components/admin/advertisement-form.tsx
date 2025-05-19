"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createAdvertisement,
  updateAdvertisement,
  getAdvertisement,
  getRewardPrograms,
} from "@/lib/advertisement-actions"
import { toast } from "sonner"

// Form schema
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().optional(),
  type: z.enum(["BANNER", "POPUP", "FLASH", "TEXT", "REWARD_PROMO"]),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "SCHEDULED"]).default("DRAFT"),
  priority: z.coerce.number().int().min(1).max(10).default(1),
  maxImpressions: z.coerce.number().int().optional(),
  maxClicks: z.coerce.number().int().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  linkedRewardId: z.string().optional(),
  content: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    linkUrl: z.string().url().optional().or(z.literal("")),
    ctaText: z.string().optional(),
    bannerSize: z.enum(["small", "medium", "large", "custom"]).optional(),
    bannerWidth: z.coerce.number().optional(),
    bannerHeight: z.coerce.number().optional(),
    animationData: z.any().optional(),
    animationDuration: z.coerce.number().optional(),
    popupTiming: z.coerce.number().optional(),
    dismissible: z.boolean().optional(),
    customHtml: z.string().optional(),
    customCss: z.string().optional(),
  }),
})

type FormValues = z.infer<typeof formSchema>

interface AdvertisementFormProps {
  id?: string
  isEditing?: boolean
}

export function AdvertisementForm({ id, isEditing = false }: AdvertisementFormProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isLoading, setIsLoading] = useState(isEditing)
  const [rewards, setRewards] = useState<any[]>([])
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "BANNER",
      status: "DRAFT",
      priority: 1,
      startDate: new Date(),
      content: {
        title: "",
        description: "",
        imageUrl: "",
        linkUrl: "",
        ctaText: "",
      },
    },
  })

  // Watch the type field to conditionally render form fields
  const watchType = form.watch("type")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rewardsData, adData] = await Promise.all([
          getRewardPrograms(),
          isEditing && id ? getAdvertisement(id) : null,
        ])

        setRewards(rewardsData || [])

        if (adData && isEditing) {
          form.reset({
            ...adData,
            startDate: new Date(adData.startDate),
            endDate: adData.endDate ? new Date(adData.endDate) : undefined,
            content: adData.content || {},
          })
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isEditing, id, form])

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true)

      if (isEditing && id) {
        await updateAdvertisement(id, values)
        toast.success("Advertisement updated successfully")
      } else {
        await createAdvertisement(values)
        toast.success("Advertisement created successfully")
      }

      router.push("/admin/advertisements")
    } catch (error) {
      console.error("Error saving advertisement:", error)
      toast.error("Failed to save advertisement")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Advertisement" : "Create Advertisement"}</CardTitle>
            <CardDescription>
              {isEditing
                ? "Update advertisement details and content"
                : "Create a new advertisement to display on the platform"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="targeting">Targeting</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic">
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advertisement Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Summer Promotion" {...field} />
                        </FormControl>
                        <FormDescription>Internal name for this advertisement (not shown to users)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of this advertisement campaign"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Internal description (not shown to users)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advertisement Type</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              // Reset content fields when type changes
                              form.setValue("content", { title: form.getValues("content.title") || "" })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BANNER">Banner</SelectItem>
                              <SelectItem value="POPUP">Popup</SelectItem>
                              <SelectItem value="FLASH">Flash Banner</SelectItem>
                              <SelectItem value="TEXT">Text Ad</SelectItem>
                              <SelectItem value="REWARD_PROMO">Reward Promotion</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>The type determines how the advertisement will be displayed</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DRAFT">Draft</SelectItem>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="PAUSED">Paused</SelectItem>
                              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>Only active advertisements will be displayed</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority (1-10)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={10} {...field} />
                        </FormControl>
                        <FormDescription>Higher priority ads are shown first (10 is highest)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchType === "REWARD_PROMO" && (
                    <FormField
                      control={form.control}
                      name="linkedRewardId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Linked Reward Program</FormLabel>
                          <FormControl>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reward program" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {rewards.map((reward) => (
                                  <SelectItem key={reward.id} value={reward.id}>
                                    {reward.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>Link this ad to a reward program</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content">
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="content.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Advertisement Title" {...field} />
                        </FormControl>
                        <FormDescription>Main title shown in the advertisement</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Advertisement description text" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>Descriptive text shown in the advertisement</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content.imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>URL to the image for this advertisement</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content.linkUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/landing-page" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>URL where users will be directed when clicking the ad</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content.ctaText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Call to Action Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Learn More" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>Text for the call-to-action button</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conditional fields based on advertisement type */}
                  {watchType === "FLASH" && (
                    <>
                      <FormField
                        control={form.control}
                        name="content.animationDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Animation Duration (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                step={0.1}
                                {...field}
                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>Duration of the animation effect in seconds</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content.animationData.type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Animation Type</FormLabel>
                            <FormControl>
                              <Select value={field.value || "fade"} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select animation type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fade">Fade</SelectItem>
                                  <SelectItem value="slide">Slide</SelectItem>
                                  <SelectItem value="pulse">Pulse</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>Type of animation effect to use</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {watchType === "POPUP" && (
                    <>
                      <FormField
                        control={form.control}
                        name="content.popupTiming"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Popup Delay (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                {...field}
                                onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>Seconds to wait before showing the popup</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content.dismissible"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Dismissible</FormLabel>
                              <FormDescription>Allow users to dismiss the popup</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule">
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>When to start showing this advertisement</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When to stop showing this advertisement (leave empty for no end date)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxImpressions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Impressions (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Unlimited"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? undefined : Number.parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of times to show this advertisement (leave empty for unlimited)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxClicks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Clicks (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Unlimited"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? undefined : Number.parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of clicks for this advertisement (leave empty for unlimited)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Targeting Tab */}
              <TabsContent value="targeting">
                <div className="py-4 space-y-2">
                  <div className="rounded-md bg-muted/50 p-4">
                    <p className="text-sm font-medium">Targeting Rules</p>
                    <p className="text-sm text-muted-foreground">
                      Targeting rules can be added after creating the advertisement.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/admin/advertisements")} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Create"} Advertisement
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
