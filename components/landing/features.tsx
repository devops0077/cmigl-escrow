"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FadeIn } from "@/components/animations/fade-in";

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  const featureCardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        delay: i * 0.1,
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

  const iconContainerVariants = {
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
      rotate: 15,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const features = [
    {
      title: "Secure Escrow",
      description:
        "Funds are held securely until both parties are satisfied with the transaction.",
      icon: ShieldIcon,
    },
    {
      title: "Flat 2.5% Fee",
      description:
        "Simple and transparent pricing with a flat 2.5% fee on all transactions.",
      icon: PercentIcon,
    },
    {
      title: "Integrated Wallet",
      description: "Manage your funds easily with our built-in wallet system.",
      icon: WalletIcon,
    },
    {
      title: "Real-time Notifications",
      description:
        "Stay updated with real-time notifications on transaction status changes.",
      icon: BellIcon,
    },
    {
      title: "Transaction History",
      description: "Access your complete transaction history at any time.",
      icon: HistoryIcon,
    },
    {
      title: "24/7 Support",
      description:
        "Our support team is available around the clock to assist you.",
      icon: HeadphonesIcon,
    },
  ];

  return (
    <FadeIn>
      <section
        ref={ref}
        className="w-full py-12 md:py-24 lg:py-32 bg-muted relative overflow-hidden"
      >
        {/* Animated background elements */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/5"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 100 - 50],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
            />
          ))}
        </motion.div>

        <div className="container px-4 md:px-6 relative z-10">
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
                Features
              </motion.div>
              <motion.h2
                className="text-3xl font-bold tracking-tighter sm:text-5xl"
                variants={itemVariants}
              >
                Everything You Need
              </motion.h2>
              <motion.p
                className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                variants={itemVariants}
              >
                Our platform provides all the tools you need to conduct secure
                transactions with confidence.
              </motion.p>
            </div>
          </motion.div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center space-y-2 rounded-lg border p-6 bg-background/80 backdrop-blur-sm"
                custom={i}
                variants={featureCardVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                whileHover="hover"
              >
                <motion.div
                  className="rounded-full bg-primary p-2 text-white"
                  variants={iconContainerVariants}
                  whileHover="hover"
                >
                  <feature.icon className="h-6 w-6" />
                </motion.div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-center text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </FadeIn>
  );
}

function ShieldIcon(props) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

function PercentIcon(props) {
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
      <line x1="19" x2="5" y1="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function WalletIcon(props) {
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
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function BellIcon(props) {
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function HistoryIcon(props) {
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
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function HeadphonesIcon(props) {
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
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}
