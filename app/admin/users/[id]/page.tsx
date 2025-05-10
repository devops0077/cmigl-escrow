"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRestrictionsList } from "@/components/admin/user-restrictions-list";
import { UserRestrictionDialog } from "@/components/admin/user-restriction-dialog";
import { toast } from "sonner";
import { ArrowLeft, Ban, User, ShieldAlert, Clock, Wallet } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface UserDetails {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  role: string;
  status: string;
  isActive: boolean;
  restricted: boolean;
  createdAt: string;
  walletBalance: number;
  transactionCount: number;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}?single=true`);

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestrictionApplied = () => {
    fetchUserDetails();
  };

  const handleRestrictionRemoved = () => {
    fetchUserDetails();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="mt-2 h-5 w-1/4" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>
              The requested user could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>Return to User List</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = user.name || user.username || "Anonymous User";
  const isRestricted = user.restricted;

  return (
    <div className="container mx-auto py-6 px-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
      </Button>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <div className="mt-4 flex gap-2 sm:mt-0">
          {isRestricted ? (
            <Button
              variant="outline"
              className="gap-2 text-green-600"
              onClick={() => {}}
            >
              <ShieldAlert className="h-4 w-4" />
              View Restrictions
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setIsRestrictionDialogOpen(true)}
            >
              <Ban className="h-4 w-4" />
              Restrict Account
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Restricted</span>
                </div>
                <Badge variant={!user.restricted ? "default" : "destructive"}>
                  {user.restricted ? "Yes" : "No"}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Role</span>
                </div>
                <span>{user.role}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Member Since</span>
                </div>
                <div className="text-right">
                  <div>{format(new Date(user.createdAt), "PPP")}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Wallet Balance</span>
                </div>
                <span>₦{user.walletBalance.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Transactions</span>
                </div>
                <span>{user.transactionCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="restrictions">
          <TabsList className="w-full">
            <TabsTrigger value="restrictions" className="flex-1">
              Restrictions
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restrictions">
            <UserRestrictionsList
              userId={userId}
              onRestrictionRemoved={handleRestrictionRemoved}
            />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Recent actions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No recent activity to display
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <UserRestrictionDialog
        isOpen={isRestrictionDialogOpen}
        onClose={() => setIsRestrictionDialogOpen(false)}
        userId={userId}
        userName={displayName}
        onRestrictionApplied={handleRestrictionApplied}
      />
    </div>
  );
}
