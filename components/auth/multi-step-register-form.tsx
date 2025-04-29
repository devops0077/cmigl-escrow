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
import { Info, CheckCircle2 } from "lucide-react";
import { registerUser } from "@/lib/auth-actions";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions to continue.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function MultiStepRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [termsDrawerOpen, setTermsDrawerOpen] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

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
      fieldsToValidate = ["termsAccepted"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && step < 3) {
      setStep(step + 1);
    } else if (isValid && step === 3) {
      await form.handleSubmit(onSubmit)();
    }
  };

  // Handle final form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        username: values.username,
        password: values.password,
        termsAccepted: values.termsAccepted,
      });

      if (result.success) {
        setSuccess(true);
        toast.success("Registration successful", {
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error instanceof Error
          ? error.message
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
          className={`h-2 w-1/3 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"} mr-1`}
        ></div>
        <div
          className={`h-2 w-1/3 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"} mr-1`}
        ></div>
        <div
          className={`h-2 w-1/3 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`}
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

      {step === 3 && !success && (
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
                A one-time registration fee of ₦500 will be required after email
                verification.
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
            <div className="space-y-4 text-sm">
              <h2 className="text-lg font-semibold">
                CMIGL Escrow Services - Terms of Use
              </h2>
              <p>Effective Date: April 26, 2025</p>

              <p>
                Welcome to CMIGL Escrow Services ("CMIGL Escrow," "we," "our,"
                "us"). These Terms of Use ("Terms") govern your access to and
                use of our website, services, and applications (collectively,
                the "Services"). By accessing or using our Services, you agree
                to be bound by these Terms.
              </p>

              <p>
                If you do not agree to these Terms, do not use the Services.
              </p>

              <h3 className="font-semibold mt-4">1. Eligibility</h3>
              <p>
                You must be at least 18 years old and legally capable of
                entering into binding contracts to use our Services. By using
                Vokun, you represent and warrant that you meet these eligibility
                requirements.
              </p>

              <h3 className="font-semibold mt-4">2. Services Description</h3>
              <p>
                Vokun provides online escrow services to facilitate secure
                transactions between parties. We act as a neutral third party to
                hold assets until the terms of a transaction are met.
              </p>
              <p>We are not a bank, lender, broker, or financial advisor.</p>

              <h3 className="font-semibold mt-4">3. User Responsibilities</h3>
              <p>You agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate and complete information.</li>
                <li>Only use the Services for lawful purposes.</li>
                <li>
                  Maintain the confidentiality of your account credentials.
                </li>
                <li>Promptly update your information if it changes.</li>
              </ul>
              <p>You must not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Violate any laws or third-party rights.</li>
                <li>
                  Use the Services for money laundering, fraud, or other illegal
                  activities.
                </li>
                <li>Interfere with the Services' security or functionality.</li>
              </ul>

              <h3 className="font-semibold mt-4">4. Fees</h3>
              <p>Use of our escrow services may be subject to fees:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>A 500.00 NGN one-time sign-up fee</li>
                <li>2.0% of total transaction amount</li>
              </ul>
              <p>
                or as outlined during the transaction setup. Fees are
                non-refundable unless expressly stated otherwise. CMIGL Escrow
                reserves the right to change fees at any time, with notice
                provided via the website.
              </p>

              <h3 className="font-semibold mt-4">5. Dispute Resolution</h3>
              <p>
                If a dispute arises between transacting parties, CMIGL Escrow
                will make commercially reasonable efforts to facilitate
                resolution according to the terms set at the beginning of the
                transaction.
              </p>
              <p>
                CMIGL Escrow's decision is final and binding unless otherwise
                required by law.
              </p>

              <h3 className="font-semibold mt-4">6. Intellectual Property</h3>
              <p>
                All content, trademarks, and logos on the CMIGL Escrow website
                are owned by or licensed to CMIGL Escrow. You may not copy,
                distribute, modify, or create derivative works without our
                express written permission.
              </p>

              <h3 className="font-semibold mt-4">
                7. Disclaimer of Warranties
              </h3>
              <p>
                The Services are provided on an "AS IS" and "AS AVAILABLE"
                basis.
              </p>
              <p>
                CMIGL Escrow disclaims all warranties, express or implied,
                including merchantability, fitness for a particular purpose, and
                non-infringement.
              </p>
              <p>We do not guarantee that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The Services will meet your requirements.</li>
                <li>The Services will be uninterrupted or error-free.</li>
                <li>Any defects will be corrected.</li>
              </ul>

              <h3 className="font-semibold mt-4">8. Limitation of Liability</h3>
              <p>To the fullest extent permitted by law:</p>
              <p>
                CMIGL Escrow shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages.
              </p>

              <h3 className="font-semibold mt-4">9. Indemnification</h3>
              <p>
                You agree to indemnify, defend, and hold harmless CMIGL Escrow
                and its officers, directors, employees, and agents from any
                claims, liabilities, damages, judgments, and expenses arising
                out of your use of the Services or your violation of these
                Terms.
              </p>

              <h3 className="font-semibold mt-4">10. Termination</h3>
              <p>
                We reserve the right to suspend or terminate your access to the
                Services at our sole discretion, without notice, for conduct we
                believe violates these Terms or is harmful to CMIGL Escrow or
                other users.
              </p>

              <h3 className="font-semibold mt-4">11. Privacy</h3>
              <p>
                Our collection and use of your information is governed by our
                Privacy Policy.
              </p>

              <h3 className="font-semibold mt-4">12. Changes to Terms</h3>
              <p>
                We may update these Terms from time to time. Changes are
                effective when posted. Your continued use of the Services
                constitutes acceptance of the revised Terms.
              </p>

              <h3 className="font-semibold mt-4">13. Governing Law</h3>
              <p>
                These Terms are governed by the laws of the Nigerian State,
                without regard to conflict of law principles.
              </p>

              <h3 className="font-semibold mt-4">14. Contact Information</h3>
              <p>For questions regarding these Terms, please contact us at:</p>
              <p>
                CMIGL Escrow Services
                <br />
                Website: https://escrow.vokun.ng
                <br />
                Email: info@vokun.ng
              </p>

              <div ref={bottomRef} className="h-4"></div>
            </div>
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
