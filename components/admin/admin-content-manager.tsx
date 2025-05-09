"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getContentByType,
  createContent,
  updateContent,
  deleteContent,
} from "@/lib/content-actions";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2, Eye, FileText } from "lucide-react";
import ContentEditor from "@/components/admin/content-editor";
import { ContentRevisionHistory } from "@/components/admin/content-revision-history";

type ContentType =
  | "KNOWLEDGE_BASE"
  | "TUTORIAL"
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "FAQ";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  type: ContentType;
  category?: string | null;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  version: number;
}

interface AdminContentManagerProps {
  contentType: ContentType;
}

export default function AdminContentManager({
  contentType,
}: AdminContentManagerProps) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    category: "",
    tags: "",
    published: false,
  });
  const router = useRouter();

  useEffect(() => {
    loadContent();
  }, [contentType]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const items = await getContentByType(contentType);
      // @ts-ignore
      setContentItems(items);
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDialogOpen = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      category: "",
      tags: "",
      published: false,
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditDialogOpen = (item: ContentItem) => {
    setSelectedItem(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      content: item.content,
      category: item.category || "",
      tags: item.tags.join(", "),
      published: item.published,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteDialogOpen = (item: ContentItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, published: checked }));
  };

  const handleEditorChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleCreateContent = async () => {
    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await createContent({
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        type: contentType,
        category: formData.category || null,
        tags: tagsArray,
        published: formData.published,
      });

      toast.success("Content created successfully");
      setIsCreateDialogOpen(false);
      loadContent();
    } catch (error) {
      console.error("Error creating content:", error);
      toast.error("Failed to create content");
    }
  };

  const handleUpdateContent = async () => {
    if (!selectedItem) return;

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await updateContent(selectedItem.id, {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        category: formData.category || null,
        tags: tagsArray,
        published: formData.published,
      });

      toast.success("Content updated successfully");
      setIsEditDialogOpen(false);
      loadContent();
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error("Failed to update content");
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedItem) return;

    try {
      await deleteContent(selectedItem.id);
      toast.success("Content deleted successfully");
      setIsDeleteDialogOpen(false);
      loadContent();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case "KNOWLEDGE_BASE":
        return "Knowledge Base";
      case "TUTORIAL":
        return "Tutorial";
      case "TERMS_OF_SERVICE":
        return "Terms of Service";
      case "PRIVACY_POLICY":
        return "Privacy Policy";
      case "FAQ":
        return "FAQ";
    }
  };

  const viewContent = (item: ContentItem) => {
    switch (item.type) {
      case "KNOWLEDGE_BASE":
        router.push(`/knowledge-base/${item.slug}`);
        break;
      case "TUTORIAL":
        router.push(`/tutorials/${item.slug}`);
        break;
      case "TERMS_OF_SERVICE":
        router.push("/terms");
        break;
      case "PRIVACY_POLICY":
        router.push("/privacy");
        break;
      case "FAQ":
        router.push("/faq#${item.slug}");
        break;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{getContentTypeLabel(contentType)} Content</CardTitle>
          <CardDescription>
            Manage {getContentTypeLabel(contentType).toLowerCase()} content for
            the platform
          </CardDescription>
        </div>
        <Button onClick={handleCreateDialogOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contentItems.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No content found</h3>
            <p className="text-muted-foreground mt-2">
              Get started by creating your first{" "}
              {getContentTypeLabel(contentType).toLowerCase()} content.
            </p>
            <Button onClick={handleCreateDialogOpen} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.slug}</TableCell>
                  <TableCell>
                    <Badge variant={item.published ? "default" : "outline"}>
                      {item.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>v{item.version}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => viewContent(item)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <ContentRevisionHistory
                        contentId={item.id}
                        onVersionRestored={loadContent}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditDialogOpen(item)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteDialogOpen(item)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create Content Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create New {getContentTypeLabel(contentType)}
            </DialogTitle>
            <DialogDescription>
              Add new content to the{" "}
              {getContentTypeLabel(contentType).toLowerCase()} section of the
              platform.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="Enter slug"
                />
              </div>
            </div>

            {(contentType === "KNOWLEDGE_BASE" ||
              contentType === "TUTORIAL" ||
              contentType === "FAQ") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Enter category"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (Comma separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <ContentEditor
                initialContent={formData.content}
                onChange={handleEditorChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="published">Publish immediately</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateContent}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Content Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {getContentTypeLabel(contentType)}</DialogTitle>
            <DialogDescription>
              Make changes to the{" "}
              {getContentTypeLabel(contentType).toLowerCase()} content.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="Enter slug"
                />
              </div>
            </div>

            {(contentType === "KNOWLEDGE_BASE" ||
              contentType === "TUTORIAL" ||
              contentType === "FAQ") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category (Optional)</Label>
                  <Input
                    id="edit-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Enter category"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags (Comma separated)</Label>
                  <Input
                    id="edit-tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <ContentEditor
                initialContent={formData.content}
                onChange={handleEditorChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-published"
                checked={formData.published}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="edit-published">
                {formData.published ? "Published" : "Draft"}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateContent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              content &quot;{selectedItem?.title}&quot; and remove it from the
              platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
