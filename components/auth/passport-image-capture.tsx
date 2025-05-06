"use client";

import React from "react";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";

interface PassportImageCaptureProps {
  onImageCapture: (imageUrl: string) => void;
  existingImage?: string;
}

export function PassportImageCapture({
  onImageCapture,
  existingImage,
}: PassportImageCaptureProps) {
  const [captureMode, setCaptureMode] = useState<"upload" | "camera">("upload");
  const [image, setImage] = useState<string | null>(existingImage || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isMobile = useIsMobile();

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isMobile
          ? { facingMode: "user", width: 640, height: 480 }
          : true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera", {
        description:
          "Please check your camera permissions or try uploading an image instead.",
      });
      setCaptureMode("upload");
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Switch to camera mode
  const handleCameraMode = useCallback(() => {
    setCaptureMode("camera");
    startCamera();
  }, [startCamera]);

  // Switch to upload mode
  const handleUploadMode = useCallback(() => {
    setCaptureMode("upload");
    stopCamera();
  }, [stopCamera]);

  // Capture image from camera
  const captureImage = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setImage(imageDataUrl);
    onImageCapture(imageDataUrl);

    // Stop the camera after capturing
    stopCamera();
  }, [onImageCapture, stopCamera]);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 5MB",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please upload a valid image file (JPEG, PNG, etc.)",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create form data for the file upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file to our API endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setImage(data.url);
      onImageCapture(data.url);

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image", {
        description: "Please try again or use the camera instead.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Clear the selected image
  const clearImage = useCallback(() => {
    setImage(null);
    onImageCapture("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onImageCapture]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-center space-x-2">
          <Button
            type="button"
            variant={captureMode === "upload" ? "default" : "outline"}
            onClick={handleUploadMode}
            size="sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button
            type="button"
            variant={captureMode === "camera" ? "default" : "outline"}
            onClick={handleCameraMode}
            size="sm"
          >
            <Camera className="mr-2 h-4 w-4" />
            Camera
          </Button>
        </div>

        <div className="relative aspect-[4/3] bg-muted rounded-md overflow-hidden">
          {image ? (
            <div className="relative w-full h-full">
              <Image
                src={image || "/placeholder.svg"}
                alt="Passport"
                fill
                className="object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : captureMode === "camera" ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <RefreshCw className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <Upload className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Upload a clear image of your passport or ID card
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          {captureMode === "upload" && !image ? (
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Select Image
                </>
              )}
            </Button>
          ) : captureMode === "camera" && !image ? (
            <Button
              type="button"
              onClick={captureImage}
              disabled={isCapturing || !streamRef.current}
              className="w-full"
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
