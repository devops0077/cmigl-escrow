"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";

// Typewriter component
function Typewriter({
  text,
  speed = 70,
  className = "",
  onComplete,
}: {
  text: string;
  speed: number;
  className: string;
  onComplete: () => void;
}) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete && onComplete();
    }
  }, [currentIndex, speed, text, isComplete, onComplete]);

  return <span className={className}>{displayText}</span>;
}

// Process step animation component
function ProcessSteps() {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    {
      title: "Step 1: Buyer Creates Transaction",
      description:
        "Buyer initiates a secure transaction and deposits funds into escrow.",
    },
    {
      title: "Step 2: Seller Delivers",
      description:
        "Seller delivers the product or service to the buyer with confidence.",
    },
    {
      title: "Step 3: Buyer Approves",
      description:
        "Buyer verifies and approves the delivery, releasing funds to the seller.",
    },
  ];

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timeout = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 4000); // Change step every 4 seconds

      return () => clearTimeout(timeout);
    } else {
      // Reset to first step after a pause
      const timeout = setTimeout(() => {
        setCurrentStep(0);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [currentStep, steps.length]);

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <div className="bg-card/90 backdrop-blur-sm p-6 rounded-xl shadow-xl w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold text-primary">
              {steps[currentStep].title}
            </h3>
            <div className="h-20">
              <Typewriter
                text={steps[currentStep].description}
                speed={100}
                className="text-muted-foreground"
                onComplete={() => {}}
              />
            </div>

            {/* Progress indicator */}
            <div className="flex gap-2 justify-center mt-4">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full ${index === currentStep ? "bg-primary w-8" : "bg-muted w-2"}`}
                  initial={{ opacity: 0.5 }}
                  animate={{
                    opacity: index === currentStep ? 1 : 0.5,
                    width: index === currentStep ? 32 : 8,
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Animated arrows showing the flow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-20 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-16 h-16 border-t-4 border-r-4 border-primary transform rotate-45"
          animate={{
            x: [0, 20, 0],
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute w-24 h-24 rounded-full border-4 border-dashed border-primary"
          animate={{
            rotate: 360,
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-16 h-16 border-b-4 border-l-4 border-primary transform -rotate-45"
          animate={{
            x: [0, -20, 0],
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 1,
          }}
        />
      </div>
    </div>
  );
}

// Mouse follower component
function MouseFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      className="hidden md:block pointer-events-none fixed h-8 w-8 rounded-full bg-primary/20 mix-blend-screen"
      animate={{
        x: mousePosition.x - 16,
        y: mousePosition.y - 16,
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 15,
        opacity: {
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
        },
        scale: {
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
        },
      }}
    />
  );
}

export function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: { scale: 0.95 },
  };

  return (
    <>
      <MouseFollower />
      <motion.section
        ref={ref}
        style={{ y, opacity }}
        className="w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden"
      >
        <div className="container px-4 md:px-6 relative">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <motion.div
              className="flex flex-col justify-center space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <div className="space-y-2">
                <motion.h1
                  className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
                  variants={itemVariants}
                >
                  <span className="inline-block">Secure</span>{" "}
                  <span className="inline-block">Transactions</span>{" "}
                  <span className="inline-block">Made</span>{" "}
                  <span className="inline-block">Simple</span>
                </motion.h1>
                <motion.p
                  className="max-w-[600px] text-muted-foreground md:text-xl"
                  variants={itemVariants}
                >
                  CMIGL Escrow protects both buyers and sellers with our secure
                  escrow service. Pay with confidence, receive with peace of
                  mind.
                </motion.p>
              </div>
              <motion.div
                className="flex flex-col gap-2 min-[400px]:flex-row"
                variants={itemVariants}
              >
                <Link href="/auth/register">
                  <motion.div
                    variants={buttonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button size="lg" className="w-full">
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/help">
                  <motion.div
                    variants={buttonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button size="lg" variant="outline" className="w-full">
                      How It Works
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
              <motion.div
                className="flex items-center space-x-4 text-sm flex-wrap gap-2"
                variants={itemVariants}
              >
                <motion.div
                  className="flex items-center space-x-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-muted-foreground">Flat 2.5% fee</span>
                </motion.div>
                <motion.div
                  className="flex items-center space-x-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-muted-foreground">Secure payments</span>
                </motion.div>
                <motion.div
                  className="flex items-center space-x-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-muted-foreground">24/7 support</span>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl">
                {/* Animated Process Steps with Typewriter Effect */}
                <ProcessSteps />

                {/* Decorative elements */}
                <motion.div
                  className="absolute -z-10 top-0 left-0 h-20 w-20 rounded-full bg-primary/10 blur-xl"
                  animate={{
                    x: [0, 10, 0],
                    y: [0, 15, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute -z-10 bottom-0 right-0 h-24 w-24 rounded-full bg-primary/10 blur-xl"
                  animate={{
                    x: [0, -15, 0],
                    y: [0, -10, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <motion.div
            className="absolute -z-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl"
            style={{ top: "10%", left: "5%" }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -z-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
            style={{ bottom: "10%", right: "5%" }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </div>
      </motion.section>
    </>
  );
}

function CheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
