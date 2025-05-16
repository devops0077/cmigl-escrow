"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRewardPrograms, deleteRewardProgram } from "@/lib/reward-actions";
import { RewardProgramForm } from "./reward-program-form";
import { RewardCriteriaForm } from "./reward-criteria-form";
import { RewardScheduleForm } from "./reward-schedule-form";
import { ManualRewardForm } from "./manual-reward-form";
import { Loader2, Plus, Trash2, Award, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function RewardProgramsList() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "new" | "criteria" | "schedule" | "manual"
  >("new");

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const data = await getRewardPrograms();
      setPrograms(data);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to load reward programs",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this reward program? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteRewardProgram(id);
      toast.success("Program deleted", {
        description: "The reward program has been deleted successfully.",
      });
      fetchPrograms();
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to delete program",
      });
    }
  };

  const openDialog = (
    type: "new" | "criteria" | "schedule" | "manual",
    program?: any
  ) => {
    setDialogType(type);
    setSelectedProgram(program || null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    fetchPrograms();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reward Programs</h2>
        <Button onClick={() => openDialog("new")}>
          <Plus className="mr-2 h-4 w-4" /> New Program
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No reward programs found
            </p>
            <Button onClick={() => openDialog("new")}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  <Badge variant={program.isActive ? "default" : "secondary"}>
                    {program.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {program.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>
                      {format(new Date(program.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criteria:</span>
                    <span>{program.criteria.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Schedules:</span>
                    <span>{program.schedules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Rewards Issued:
                    </span>
                    <span>{program._count.distributions}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Tabs defaultValue="actions" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                    <TabsTrigger value="criteria">Criteria</TabsTrigger>
                    <TabsTrigger value="schedules">Schedules</TabsTrigger>
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                  </TabsList>
                  <TabsContent value="actions" className="pt-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(program.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </TabsContent>
                  <TabsContent value="criteria" className="pt-4">
                    <Button
                      size="sm"
                      onClick={() => openDialog("criteria", program)}
                    >
                      <Filter className="h-4 w-4 mr-1" /> Add Criteria
                    </Button>
                  </TabsContent>
                  <TabsContent value="schedules" className="pt-4">
                    <Button
                      size="sm"
                      onClick={() => openDialog("schedule", program)}
                    >
                      <Calendar className="h-4 w-4 mr-1" /> Add Schedule
                    </Button>
                  </TabsContent>
                  <TabsContent value="manual" className="pt-4">
                    <Button
                      size="sm"
                      onClick={() => openDialog("manual", program)}
                    >
                      <Award className="h-4 w-4 mr-1" /> Issue Reward
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "new" && "Create New Reward Program"}
              {dialogType === "criteria" && "Add Eligibility Criteria"}
              {dialogType === "schedule" && "Add Reward Schedule"}
              {dialogType === "manual" && "Issue Manual Reward"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "new" &&
                "Set up a new reward program for your users"}
              {dialogType === "criteria" &&
                `Add criteria to "${selectedProgram?.name}"`}
              {dialogType === "schedule" &&
                `Add schedule to "${selectedProgram?.name}"`}
              {dialogType === "manual" &&
                `Issue a manual reward for "${selectedProgram?.name}"`}
            </DialogDescription>
          </DialogHeader>

          {dialogType === "new" && (
            <RewardProgramForm onSuccess={handleDialogClose} />
          )}

          {dialogType === "criteria" && selectedProgram && (
            <RewardCriteriaForm
              programId={selectedProgram.id}
              onSuccess={handleDialogClose}
            />
          )}

          {dialogType === "schedule" && selectedProgram && (
            <RewardScheduleForm
              programId={selectedProgram.id}
              onSuccess={handleDialogClose}
            />
          )}

          {dialogType === "manual" && selectedProgram && (
            <ManualRewardForm
              programId={selectedProgram.id}
              onSuccess={handleDialogClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
