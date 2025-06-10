"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle2, X } from "lucide-react";
import { registerUser } from "@/lib/auth-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInView } from "react-intersection-observer";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
} from "../ui/sheet";
import { PassportImageCapture } from "@/components/auth/passport-image-capture";
import { DynamicContent } from "../content/dynamic-content";
import { ContentVersionInfo } from "../content/content-version-info";
import axios, { AxiosError } from "axios";

// Define the single form schema
const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    phone: z.string().min(10, {
      message: "Please enter a valid phone number.",
    }),
    username: z
      .string()
      .min(3, {
        message: "Username must be at least 3 characters.",
      })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores.",
      }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
    passportImage: z.string().optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions to continue.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function MultiStepRegisterForm({
  termsContent,
}: {
  termsContent?: any;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [termsDrawerOpen, setTermsDrawerOpen] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [passportImageUrl, setPassportImageUrl] = useState<string | null>(null);

  // Ref for detecting when user has scrolled to the bottom of terms
  const { ref: bottomRef, inView } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView) {
        setHasScrolledToBottom(true);
      }
    },
  });

  // Single form instance
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
      passportImage: "",
      termsAccepted: false,
    },
  });

  // Handle step navigation and validation
  const handleNextStep = async () => {
    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];

    if (step === 1) {
      fieldsToValidate = ["name", "email", "phone"];
    } else if (step === 2) {
      fieldsToValidate = ["username", "password", "confirmPassword"];
    } else if (step === 3) {
      // Passport image is optional but encouraged
      fieldsToValidate = [];
    } else if (step === 4) {
      fieldsToValidate = ["termsAccepted"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && step < 4) {
      setStep(step + 1);
    } else if (isValid && step === 4) {
      await form.handleSubmit(onSubmit)();
    }
  };

  // Handle passport image upload
  const handlePassportImageCapture = (imageUrl: string) => {
    setPassportImageUrl(imageUrl);
    form.setValue("passportImage", imageUrl);
  };

  // Handle final form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await axios.post("/api/auth/register", {
        name: values.name,
        email: values.email,
        phone: values.phone,
        username: values.username,
        password: values.password,
        passportImage: values.passportImage as string,
        termsAccepted: values.termsAccepted,
      });

      setSuccess(true);
      toast.success("Registration successful", {
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(
        error instanceof AxiosError
          ? error.response?.data?.message ||
              "Registration failed. Please try again."
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle going back to previous step
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between mb-6">
        <div
          className={`h-2 w-1/4 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"} mr-1`}
        ></div>
        <div
          className={`h-2 w-1/4 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"} mr-1`}
        ></div>
        <div
          className={`h-2 w-1/4 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"} mr-1`}
        ></div>
        <div
          className={`h-2 w-1/4 rounded-full ${step >= 4 ? "bg-primary" : "bg-muted"}`}
        ></div>
      </div>
      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Check your email</AlertTitle>
          <AlertDescription>
            We've sent you a verification email. Please check your inbox and
            follow the instructions to verify your account.
          </AlertDescription>
        </Alert>
      )}
      {step === 1 && (
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="example@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+234 800 000 0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" className="w-full" onClick={handleNextStep}>
              Next
            </Button>
          </form>
        </Form>
      )}
      {step === 2 && (
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be your unique identifier on the platform.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="button" onClick={handleNextStep}>
                Next
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 3 && (
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
            <FormField
              control={form.control}
              name="passportImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passport Photograph</FormLabel>
                  <FormDescription>
                    Please upload or take a passport photograph. This helps us
                    verify your identity.
                  </FormDescription>
                  <FormControl>
                    <div className="space-y-1">
                      <PassportImageCapture
                        onImageCapture={handlePassportImageCapture}
                        existingImage={passportImageUrl || ""}
                      />

                      {/* {passportImageUrl && (
                        <div className="relative mt-1">
                          <div className="border rounded-md overflow-hidden w-full h-16 flex items-center justify-center">
                            <img
                              src={passportImageUrl || "/placeholder.svg"}
                              alt="Passport"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => {
                              setPassportImageUrl(null);
                              form.setValue("passportImage", "");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )} */}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="button" onClick={handleNextStep}>
                {passportImageUrl ? "Next" : "Skip for now"}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 4 && !success && (
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        // field.onChange(checked);
                        if (checked && !termsDrawerOpen) {
                          setTermsDrawerOpen(true);
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I accept the{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setTermsDrawerOpen(true)}
                      >
                        terms and conditions
                      </Button>
                    </FormLabel>
                    <FormDescription>
                      You must read and accept the terms and conditions to
                      create an account.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                A one-time (non-refundable) registration fee of ₦500 will be
                required after email verification.
              </p>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading || !form.getValues().termsAccepted}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
        </Form>
      )}
      <Sheet open={termsDrawerOpen} onOpenChange={setTermsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 ">
          <SheetHeader>
            <SheetHeader>Terms and Conditions</SheetHeader>
            <SheetDescription className="text-sm text-muted-foreground">
              Please read the following terms and conditions carefully.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[60vh] px-4">
            {termsContent ? (
              <>
                <DynamicContent
                  content={termsContent.content}
                  contentId={termsContent.id}
                  contentType="TERMS_OF_SERVICE"
                />
                <ContentVersionInfo
                  version={termsContent.version}
                  updatedAt={termsContent.updatedAt}
                  publishedAt={termsContent.publishedAt}
                />
                <div ref={bottomRef} className="h-4"></div>
              </>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">
                  Terms of Service Not Available
                </h3>
                <p className="text-muted-foreground mt-2">
                  Our terms of service are currently being updated. Please check
                  back later.
                </p>
              </div>
            )}
          </ScrollArea>
          <SheetFooter className="flex flex-row items-center justify-between">
            <Button
              onClick={() => {
                if (hasScrolledToBottom) {
                  form.setValue("termsAccepted", true);
                  setTermsDrawerOpen(false);
                } else {
                  toast.warning(
                    "Please scroll to the bottom to accept the terms"
                  );
                }
              }}
              className=""
              disabled={!hasScrolledToBottom}
            >
              Accept Terms
            </Button>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
