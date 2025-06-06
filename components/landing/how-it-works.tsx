"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { FadeIn } from "@/components/animations/fade-in";

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const progressLine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

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

  const stepVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: any) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        delay: i * 0.2,
      },
    }),
    hover: {
      y: -10,
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const numberVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
    hover: {
      scale: 1.2,
      backgroundColor: "var(--primary)",
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const steps = [
    {
      number: 1,
      title: "Create Transaction",
      description:
        "Buyer creates a transaction and funds are held securely in escrow.",
    },
    {
      number: 2,
      title: "Seller Ships Product",
      description:
        "Seller is notified and ships the product or delivers the service.",
    },
    {
      number: 3,
      title: "Funds Released",
      description:
        "Buyer confirms receipt and funds are released to the seller.",
    },
  ];

  return (
    <FadeIn>
      <section
        id="how-it-works"
        ref={ref}
        className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            className="absolute w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid-pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeOpacity="0.05"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>

          {/* Animated circles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/5"
              style={{
                width: Math.random() * 200 + 50,
                height: Math.random() * 200 + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <div className="space-y-2">
              <motion.div
                className="inline-block rounded-lg bg-muted-foreground/20 px-3 py-1 text-sm"
                variants={itemVariants}
              >
                How It Works
              </motion.div>
              <motion.h2
                className="text-3xl font-bold tracking-tighter sm:text-5xl"
                variants={itemVariants}
              >
                Simple, Secure Process
              </motion.h2>
              <motion.p
                className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                variants={itemVariants}
              >
                Our escrow service makes transactions safe and straightforward
                for both buyers and sellers.
              </motion.p>
            </div>
          </motion.div>

          <div className="mx-auto max-w-5xl py-12 relative">
            {/* Progress line */}
            <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-muted md:block hidden">
              <motion.div
                className="absolute left-0 top-0 h-full w-full bg-primary origin-top"
                style={{ scaleY: progressLine }}
              />
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col items-center space-y-4 rounded-lg border p-6 bg-background/80 backdrop-blur-sm relative z-10"
                  custom={i}
                  variants={stepVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  whileHover="hover"
                >
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/80 text-xl font-bold text-white"
                    variants={numberVariants}
                    whileHover="hover"
                  >
                    {step.number}
                  </motion.div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-center text-muted-foreground">
                    {step.description}
                  </p>

                  {/* Connecting lines for desktop */}
                  {i < steps.length - 1 && (
                    <motion.div
                      className="absolute top-1/2 left-full w-full h-0.5 bg-primary/30 -translate-y-1/2 hidden md:block"
                      style={{ width: "calc(100% - 3rem)" }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={
                        isInView
                          ? { scaleX: 1, opacity: 1 }
                          : { scaleX: 0, opacity: 0 }
                      }
                      transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="space-y-2 max-w-2xl mx-auto">
              <motion.h3
                className="text-xl font-bold"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                One-Time Registration Fee
              </motion.h3>
              <motion.p
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                Join CMIGL Escrow with a one-time registration fee of ₦500.
                After that, enjoy our services with just a flat 4.5% transaction
                fee.
              </motion.p>

              <motion.div
                className="pt-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={
                  isInView
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0.8, opacity: 0 }
                }
                transition={{
                  delay: 1.4,
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
              >
                <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                  <span className="mr-1">Only</span>
                  <span className="text-lg font-bold">₦500</span>
                  <span className="ml-1">to start</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </FadeIn>
  );
}
