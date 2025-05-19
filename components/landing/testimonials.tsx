"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

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

  const cardVariants = {
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

  const testimonials = [
    {
      name: "Ibrahim Shehu",
      role: "Buyer",
      initials: "IS",
      content:
        "I was hesitant to buy expensive electronics online, but Vokun Escrow made it safe and secure. The seller only received payment after I confirmed everything was as described. Great service!",
    },
    {
      name: "Ademola Jerry",
      role: "Seller",
      initials: "JS",
      content:
        "As a small business owner, I've had issues with payment disputes. CMIGL Escrow has eliminated that problem completely. Now I know I'll get paid when I deliver quality products.",
    },
    {
      name: "Ugochukwu Sunday",
      role: "Buyer",
      initials: "US",
      content:
        "I use CMIGL Escrow for all my high-value transactions. The process is straightforward, and the peace of mind is worth every penny of the small fee they charge.",
    },
  ];

  return (
    <section
      ref={ref}
      className="w-full py-12 md:py-24 lg:py-32 bg-muted/50 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-full h-full opacity-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="quote-pattern"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <text x="0" y="15" fontSize="20" fill="currentColor">
                  "
                </text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#quote-pattern)" />
          </svg>
        </motion.div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          className="flex flex-col items-center justify-center space-y-4 text-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <div className="space-y-2">
            <motion.div
              className="inline-block rounded-lg bg-muted px-3 py-1 text-sm"
              variants={itemVariants}
            >
              Testimonials
            </motion.div>
            <motion.h2
              className="text-3xl font-bold tracking-tighter md:text-4xl/tight"
              variants={itemVariants}
            >
              Trusted by Buyers and Sellers
            </motion.h2>
            <motion.p
              className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
              variants={itemVariants}
            >
              See what our users have to say about their experience with Vokun
              Escrow Services.
            </motion.p>
          </div>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              whileHover="hover"
            >
              <Card className="h-full bg-background/80 backdrop-blur-sm border-primary/10 relative overflow-hidden">
                {/* Decorative quote mark */}
                <motion.div
                  className="absolute -top-6 -right-6 text-8xl text-primary/10 font-serif pointer-events-none"
                  initial={{ opacity: 0, rotate: -20 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
                >
                  "
                </motion.div>

                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: 0.3 + i * 0.2,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                    >
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {testimonial.initials}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <div>
                      <motion.p
                        className="text-sm font-medium"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.2, duration: 0.3 }}
                      >
                        {testimonial.name}
                      </motion.p>
                      <motion.p
                        className="text-sm text-muted-foreground"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.2, duration: 0.3 }}
                      >
                        {testimonial.role}
                      </motion.p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.p
                    className="text-sm relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.2, duration: 0.5 }}
                  >
                    {testimonial.content}
                  </motion.p>

                  {/* Star rating */}
                  <motion.div
                    className="flex items-center mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.2, duration: 0.3 }}
                  >
                    {[...Array(5)].map((_, starIndex) => (
                      <motion.svg
                        key={starIndex}
                        className="w-4 h-4 text-yellow-500 fill-current"
                        viewBox="0 0 24 24"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.8 + i * 0.2 + starIndex * 0.1,
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                        }}
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </motion.svg>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
