"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface UserDetails {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  role: string;
  status: string;
  isActive: boolean;
  restricted: boolean;
  emailVerified: string | null;
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  bio: string | null;
  address: string | null;
}

interface UserProfileSectionProps {
  user: UserDetails;
}

export function UserProfileSection({ user }: UserProfileSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            User's personal and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Full Name
              </span>
              <span className="text-sm">{user.name || "Not provided"}</span>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Username
              </span>
              <span className="text-sm">{user.username || "Not set"}</span>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{user.email}</span>
                {user.emailVerified ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </span>
              <span className="text-sm">{user.phone || "Not provided"}</span>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </span>
              <span className="text-sm">{user.address || "Not provided"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
          <CardDescription>
            Current account status and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Role
              </span>
              <Badge variant={user.role === "ADMIN" ? "secondary" : "outline"}>
                {user.role}
              </Badge>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Status
              </span>
              <Badge variant={user.restricted ? "destructive" : "default"}>
                {user.restricted ? "Restricted" : "Active"}
              </Badge>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Account Active
              </span>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Yes" : "No"}
              </Badge>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Email Verified
              </span>
              <Badge variant={user.emailVerified ? "default" : "destructive"}>
                {user.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Terms Accepted
              </span>
              <Badge variant={user.termsAccepted ? "default" : "destructive"}>
                {user.termsAccepted ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio Section */}
      {user.bio && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {user.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Important Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Account Created
              </span>
              <span className="text-sm">
                {format(new Date(user.createdAt), "PPP 'at' p")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Last Updated
              </span>
              <span className="text-sm">
                {format(new Date(user.updatedAt), "PPP 'at' p")}
              </span>
            </div>
            {user.emailVerified && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Email Verified
                </span>
                <span className="text-sm">
                  {format(new Date(user.emailVerified), "PPP 'at' p")}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
