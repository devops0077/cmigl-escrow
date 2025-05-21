"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useInView,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useTheme } from "next-themes";

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  const controls = useAnimation();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

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
    visible: (i: any) => ({
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
      scale: 1.03,
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

  // 3D floating elements configuration
  const floatingElements = [
    { size: 80, initialX: "10%", initialY: "20%", speed: 20 },
    { size: 120, initialX: "85%", initialY: "15%", speed: 25 },
    { size: 60, initialX: "75%", initialY: "60%", speed: 15 },
    { size: 100, initialX: "20%", initialY: "70%", speed: 30 },
    { size: 70, initialX: "50%", initialY: "30%", speed: 22 },
    { size: 90, initialX: "30%", initialY: "40%", speed: 18 },
  ];

  const features = [
    {
      title: "Secure Escrow",
      description:
        "Funds are held securely until both parties are satisfied with the transaction.",
      icon: ShieldIcon,
      gradient: "from-blue-500 to-purple-600",
    },
    {
      title: "Flat 2.5% Fee",
      description:
        "Simple and transparent pricing with a flat 2.5% fee on all transactions.",
      icon: PercentIcon,
      gradient: "from-purple-500 to-pink-600",
    },
    {
      title: "Integrated Wallet",
      description: "Manage your funds easily with our built-in wallet system.",
      icon: WalletIcon,
      gradient: "from-pink-500 to-orange-600",
    },
    {
      title: "Real-time Notifications",
      description:
        "Stay updated with real-time notifications on transaction status changes.",
      icon: BellIcon,
      gradient: "from-orange-500 to-amber-600",
    },
    {
      title: "Transaction History",
      description: "Access your complete transaction history at any time.",
      icon: HistoryIcon,
      gradient: "from-amber-500 to-green-600",
    },
    {
      title: "24/7 Support",
      description:
        "Our support team is available around the clock to assist you.",
      icon: HeadphonesIcon,
      gradient: "from-green-500 to-blue-600",
    },
  ];

  // Determine gradient based on theme
  const gradientClasses = mounted && theme === "dark" ? "" : "";

  return (
    <section
      ref={ref}
      className={`w-full py-12 md:py-24 lg:py-32 relative overflow-hidden dark:bg-gradient-to-br dark:from-zinc-900 dark:via-green-900 dark:to-zinc-900 bg-gradient-to-br from-slate-100 via-purple-100 to-blue-100`}
      style={{
        backgroundSize: "200% 200%",
        animation: "gradientAnimation 15s ease infinite",
      }}
    >
      {/* 3D Floating Elements */}
      {mounted &&
        !prefersReducedMotion &&
        floatingElements.map((element, i) => (
          <FloatingElement
            key={i}
            size={element.size}
            initialX={element.initialX}
            initialY={element.initialY}
            speed={element.speed}
            isDarkTheme={theme === "dark"}
          />
        ))}

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="flex flex-col items-center justify-center space-y-4 text-center"
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          <div className="space-y-2">
            <motion.div
              className="inline-block rounded-lg bg-primary/20 px-3 py-1 text-sm font-medium text-primary"
              variants={itemVariants}
            >
              Features
            </motion.div>
            <motion.h2
              className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl"
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
              className="group flex flex-col items-center space-y-4 rounded-xl border bg-background/80 backdrop-blur-sm p-6 shadow-sm transition-all"
              custom={i}
              variants={featureCardVariants}
              initial="hidden"
              animate={controls}
              whileHover={prefersReducedMotion ? {} : "hover"}
            >
              <motion.div
                className={`rounded-full bg-gradient-to-r ${feature.gradient} p-3 text-white shadow-lg`}
                variants={iconContainerVariants}
                whileHover={prefersReducedMotion ? {} : "hover"}
              >
                <feature.icon className="h-6 w-6" />
              </motion.div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-center text-muted-foreground">
                {feature.description}
              </p>

              {/* Card background gradient */}
              <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx global>{`
        @keyframes gradientAnimation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </section>
  );
}

// 3D Floating Element Component
// @ts-ignore
function FloatingElement({ size, initialX, initialY, speed, isDarkTheme }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Random rotation for each element
  const rotate = useMotionValue(Math.random() * 360);

  // Transform the motion values for parallax effect
  const translateX = useTransform(x, [-100, 100], [-15, 15]);
  const translateY = useTransform(y, [-100, 100], [-15, 15]);

  // Handle mouse movement for parallax effect
  const handleMouseMove = (event: any) => {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;

    const mouseX = clientX / innerWidth - 0.5;
    const mouseY = clientY / innerHeight - 0.5;

    x.set(mouseX * 200);
    y.set(mouseY * 200);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Determine element style based on theme
  const elementStyle = isDarkTheme
    ? {
        background:
          "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(30, 64, 175, 0.05) 100%)",
        border: "1px solid rgba(139, 92, 246, 0.2)",
      }
    : {
        background:
          "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)",
        border: "1px solid rgba(139, 92, 246, 0.15)",
      };

  return (
    <motion.div
      className="absolute rounded-full backdrop-blur-md"
      style={{
        width: size,
        height: size,
        left: initialX,
        top: initialY,
        x: translateX,
        y: translateY,
        rotate,
        ...elementStyle,
      }}
      animate={{
        y: [0, -speed, 0],
        rotate: [0, 360],
      }}
      transition={{
        y: {
          repeat: Number.POSITIVE_INFINITY,
          duration: 10 + Math.random() * 10,
          ease: "easeInOut",
        },
        rotate: {
          repeat: Number.POSITIVE_INFINITY,
          duration: 20 + Math.random() * 10,
          ease: "linear",
        },
      }}
    />
  );
}

function ShieldIcon(props: any) {
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

function PercentIcon(props: any) {
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

function WalletIcon(props: any) {
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

function BellIcon(props: any) {
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

function HistoryIcon(props: any) {
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

function HeadphonesIcon(props: any) {
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
