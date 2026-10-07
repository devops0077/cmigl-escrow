"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
export function ProcessSteps() {
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
      }, 7000); // Change step every 7 seconds

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
                speed={10}
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
