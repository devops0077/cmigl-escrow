"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAllFeedback, updateFeedbackStatus } from "@/lib/feedback-actions";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  MessageSquare,
  Star,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
} from "lucide-react";

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  rating: number;
  type: "SUGGESTION" | "BUG_REPORT" | "FEATURE_REQUEST" | "GENERAL";
  status: "PENDING" | "REVIEWED" | "IMPLEMENTED" | "REJECTED";
  attachments: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    username: string | null;
  };
}

export default function AdminFeedbackManager() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<
    "PENDING" | "REVIEWED" | "IMPLEMENTED" | "REJECTED"
  >("PENDING");
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const items = await getAllFeedback();
      //   @ts-ignore
      setFeedbackItems(items);
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleDetailDialogOpen = async (item: FeedbackItem) => {
    setSelectedItem(item);
    setAdminNotes(item.adminNotes || "");
    setNewStatus(item.status);
    setIsDetailDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedItem) return;

    try {
      await updateFeedbackStatus(selectedItem.id, newStatus, adminNotes);
      toast.success("Feedback status updated successfully");
      setIsDetailDialogOpen(false);
      loadFeedback();
    } catch (error) {
      console.error("Error updating feedback status:", error);
      toast.error("Failed to update feedback status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "REVIEWED":
        return <Badge variant="secondary">Reviewed</Badge>;
      case "IMPLEMENTED":
        return <Badge variant="default">Implemented</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SUGGESTION":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "BUG_REPORT":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "FEATURE_REQUEST":
        return <Star className="h-4 w-4 text-purple-500" />;
      case "GENERAL":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "SUGGESTION":
        return "Suggestion";
      case "BUG_REPORT":
        return "Bug Report";
      case "FEATURE_REQUEST":
        return "Feature Request";
      case "GENERAL":
        return "General Feedback";
      default:
        return type;
    }
  };

  const filteredFeedback =
    activeTab === "all"
      ? feedbackItems
      : feedbackItems.filter((item) => item.status === activeTab.toUpperCase());

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Feedback</CardTitle>
        <CardDescription>
          Review and manage feedback submitted by users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            <TabsTrigger value="implemented">Implemented</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFeedback.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No feedback found</h3>
                <p className="text-muted-foreground mt-2">
                  There are no feedback items with the selected status.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span>{getTypeLabel(item.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        {item.user.name ||
                          item.user.username ||
                          item.user.email}
                      </TableCell>
                      <TableCell>{item.rating} / 5</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetailDialogOpen(item)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Feedback Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Review and update the status of this feedback
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Type
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedItem.type)}
                    <span>{getTypeLabel(selectedItem.type)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Rating
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedItem.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="ml-1">{selectedItem.rating}/5</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Submitted By
                </h3>
                <p className="mt-1">
                  {selectedItem.user.name ||
                    selectedItem.user.username ||
                    selectedItem.user.email}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Title
                </h3>
                <p className="mt-1 font-medium">{selectedItem.title}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedItem.description}
                </div>
              </div>

              {selectedItem.attachments && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Attachments
                  </h3>
                  <div className="mt-1">
                    <a
                      href={selectedItem.attachments}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Attachment
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Admin Notes
                </h3>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this feedback..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Status
                </h3>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
