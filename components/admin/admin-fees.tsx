"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getProductCategories,
  updateFee,
  createFee,
} from "@/lib/admin-actions";
import { Pencil, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Fee {
  id: string;
  name: string;
  percentage: number;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Category name must be at least 2 characters.",
  }),
  percentage: z.coerce
    .number()
    .min(0, {
      message: "Percentage must be at least 0.",
    })
    .max(1, {
      message: "Percentage must be less than or equal to 1 (100%).",
    }),
});

export function AdminFees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      percentage: 0,
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      percentage: 0,
    },
  });

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const data = await getProductCategories();
        setFees(data);
      } catch (error) {
        console.error("Error fetching fees:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFees();
  }, []);

  const startEditing = (fee: Fee) => {
    setEditingId(fee.id);
    editForm.reset({
      name: fee.name,
      percentage: fee.percentage,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdateFee = async (values: z.infer<typeof formSchema>) => {
    if (!editingId) return;

    setIsSubmitting(true);
    try {
      await updateFee(editingId, values.name, values.percentage);

      // Update local state
      setFees(
        fees.map((fee) =>
          fee.id === editingId
            ? { ...fee, name: values.name, percentage: values.percentage }
            : fee
        )
      );

      toast.success("Fee updated", {
        description: "Product category fee has been updated successfully.",
      });

      setEditingId(null);
    } catch (error) {
      console.error("Error updating fee:", error);
      toast.error("Update failed", {
        description: "There was a problem updating the fee.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFee = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const newFee = await createFee(values.name, values.percentage);

      // Update local state
      setFees([...fees, newFee]);

      toast.success("Fee added", {
        description: "New product category fee has been added successfully.",
      });

      setIsAdding(false);
      form.reset();
    } catch (error) {
      console.error("Error adding fee:", error);
      toast.error("Add failed", {
        description: "There was a problem adding the fee.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading fees...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Fee Percentage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fees.map((fee) => (
            <TableRow key={fee.id}>
              {editingId === fee.id ? (
                <>
                  <TableCell colSpan={3}>
                    <Form {...editForm}>
                      <form
                        onSubmit={editForm.handleSubmit(handleUpdateFee)}
                        className="flex items-center space-x-2"
                      >
                        <FormField
                          control={editForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="percentage"
                          render={({ field }) => (
                            <FormItem className="w-32">
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="1"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" size="sm" disabled={isSubmitting}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </form>
                    </Form>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell>{fee.name}</TableCell>
                  <TableCell>{(fee.percentage * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(fee)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {isAdding && (
            <TableRow>
              <TableCell colSpan={3}>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleAddFee)}
                    className="flex items-center space-x-2"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Category name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="percentage"
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              placeholder="0.05"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAdding(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {!isAdding && (
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      )}
    </div>
  );
}
