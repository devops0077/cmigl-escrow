"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvertisementBanner } from "@/components/advertisements/advertisement-banner";
import { AdvertisementPopup } from "@/components/advertisements/advertisement-popup";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdvertisementPreviewProps {
  advertisement: any;
}

export function AdvertisementPreview({
  advertisement,
}: AdvertisementPreviewProps) {
  const [context, setContext] = useState("dashboard");
  const [showPopup, setShowPopup] = useState(false);

  // Mock function for click tracking in preview
  const handleClick = () => {
    toast.info("Advertisement clicked (preview only)");
  };

  // Mock function for closing popup
  const handleClosePopup = () => {
    setShowPopup(false);
    toast.info("Advertisement dismissed (preview only)");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how this advertisement will appear to users in different
            contexts
          </CardDescription>

          <div className="flex items-center gap-4 mt-2">
            <Select value={context} onValueChange={setContext}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="homepage">Homepage</SelectItem>
                <SelectItem value="sidebar">Sidebar</SelectItem>
                <SelectItem value="transactions">Transactions Page</SelectItem>
              </SelectContent>
            </Select>

            {advertisement.type === "POPUP" && (
              <Button
                variant="outline"
                onClick={() => setShowPopup(true)}
                disabled={showPopup}
              >
                Show Popup
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="desktop" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="desktop">Desktop</TabsTrigger>
              <TabsTrigger value="tablet">Tablet</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
            </TabsList>

            <TabsContent value="desktop" className="mt-0">
              <PreviewContainer context={context}>
                {renderAdvertisement(
                  advertisement,
                  context,
                  "desktop",
                  handleClick
                )}
              </PreviewContainer>
            </TabsContent>

            <TabsContent value="tablet" className="mt-0">
              <PreviewContainer context={context} deviceType="tablet">
                {renderAdvertisement(
                  advertisement,
                  context,
                  "tablet",
                  handleClick
                )}
              </PreviewContainer>
            </TabsContent>

            <TabsContent value="mobile" className="mt-0">
              <PreviewContainer context={context} deviceType="mobile">
                {renderAdvertisement(
                  advertisement,
                  context,
                  "mobile",
                  handleClick
                )}
              </PreviewContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Popup preview */}
      {advertisement.type === "POPUP" && showPopup && (
        <AdvertisementPopup
          ad={advertisement}
          onClose={handleClosePopup}
          onClick={handleClick}
        />
      )}
    </div>
  );
}

function renderAdvertisement(
  advertisement: any,
  context: string,
  deviceType: string,
  onClick: () => void
) {
  // For popup type, we handle it separately with a button
  if (advertisement.type === "POPUP") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-center">
          Popup advertisements are shown in a dialog. <br />
          Use the "Show Popup" button above to preview.
        </p>
      </div>
    );
  }

  // For other types, render the banner with appropriate sizing
  const className = getContextClassName(context, deviceType);
  return (
    <AdvertisementBanner
      ad={advertisement}
      onClick={onClick}
      className={className}
    />
  );
}

function getContextClassName(context: string, deviceType: string) {
  // Base classes
  let className = "w-full";

  // Add device-specific constraints
  if (deviceType === "mobile") {
    className += " max-w-[320px]";
  } else if (deviceType === "tablet") {
    className += " max-w-[768px]";
  }

  // Add context-specific styling
  switch (context) {
    case "sidebar":
      className += " max-w-[300px]";
      break;
    case "homepage":
      className += " max-h-[200px]";
      break;
    case "dashboard":
      className += " max-h-[150px]";
      break;
    default:
      break;
  }

  return className;
}

function PreviewContainer({
  children,
  context,
  deviceType = "desktop",
}: {
  children: React.ReactNode;
  context: string;
  deviceType?: string;
}) {
  // Create a container that simulates the context
  let containerClassName = "border rounded-lg p-4 bg-background";

  // Set width based on device type
  if (deviceType === "mobile") {
    containerClassName += " max-w-[360px] mx-auto";
  } else if (deviceType === "tablet") {
    containerClassName += " max-w-[768px] mx-auto";
  }

  // Add context-specific styling
  switch (context) {
    case "dashboard":
      return (
        <div className={containerClassName}>
          <div className="mb-4 pb-2 border-b">
            <h3 className="text-xl font-semibold">Dashboard</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="h-[200px] bg-muted rounded-lg mb-4 flex items-center justify-center">
                <span className="text-muted-foreground">Dashboard Content</span>
              </div>
              {children}
            </div>
            <div className="bg-muted rounded-lg h-[300px] flex items-center justify-center">
              <span className="text-muted-foreground">Sidebar</span>
            </div>
          </div>
        </div>
      );

    case "homepage":
      return (
        <div className={containerClassName}>
          <div className="mb-4 pb-2 border-b">
            <h3 className="text-xl font-semibold">Homepage</h3>
          </div>
          <div className="h-[200px] bg-muted rounded-lg mb-4 flex items-center justify-center">
            <span className="text-muted-foreground">Hero Section</span>
          </div>
          {children}
          <div className="h-[150px] bg-muted rounded-lg mt-4 flex items-center justify-center">
            <span className="text-muted-foreground">Features Section</span>
          </div>
        </div>
      );

    case "sidebar":
      return (
        <div className={containerClassName}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Main Content</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-muted rounded-lg h-[100px] flex items-center justify-center">
                <span className="text-muted-foreground">Sidebar Item</span>
              </div>
              {children}
              <div className="bg-muted rounded-lg h-[100px] flex items-center justify-center">
                <span className="text-muted-foreground">Sidebar Item</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "transactions":
      return (
        <div className={containerClassName}>
          <div className="mb-4 pb-2 border-b">
            <h3 className="text-xl font-semibold">Transactions</h3>
          </div>
          {children}
          <div className="h-[300px] bg-muted rounded-lg mt-4 flex items-center justify-center">
            <span className="text-muted-foreground">Transactions List</span>
          </div>
        </div>
      );

    default:
      return <div className={containerClassName}>{children}</div>;
  }
}
