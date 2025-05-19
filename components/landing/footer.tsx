"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Footer() {
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

  const linkVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.05,
      color: "var(--primary)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      className="w-full border-t bg-background py-6 md:py-10 relative overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
        >
          <motion.path
            fill="currentColor"
            fillOpacity="0.03"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
      </div>

      <div className="container px-5 flex flex-col items-center justify-between gap-4 md:flex-row relative z-10">
        <motion.div
          className="flex flex-col items-center gap-4 md:items-start md:gap-2"
          variants={itemVariants}
        >
          <Link href="/" className="flex items-center space-x-2">
            <motion.span
              className="text-lg font-bold text-primary"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              CMIGL Escrow
            </motion.span>
          </Link>
          <motion.p
            className="text-center text-sm text-muted-foreground md:text-left"
            variants={itemVariants}
          >
            Secure transactions between buyers and sellers.
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-4 md:flex-row md:gap-6"
          variants={itemVariants}
        >
          <nav className="flex gap-4 md:gap-6">
            <motion.div
              variants={linkVariants}
              initial="initial"
              whileHover="hover"
            >
              <Link
                href="/terms"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms
              </Link>
            </motion.div>
            <motion.div
              variants={linkVariants}
              initial="initial"
              whileHover="hover"
            >
              <Link
                href="/privacy"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
            </motion.div>
            <motion.div
              variants={linkVariants}
              initial="initial"
              whileHover="hover"
            >
              <Link
                href="/help"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Help
              </Link>
            </motion.div>
          </nav>
          <motion.div
            className="text-sm text-muted-foreground"
            variants={itemVariants}
          >
            © {currentYear} CMIGL Escrow Services. All rights reserved.
          </motion.div>
        </motion.div>

        {/* Social media icons */}
        <motion.div
          className="flex items-center gap-4 mt-4 md:mt-0 absolute bottom-full right-5 mb-4 md:relative md:bottom-auto md:right-auto md:mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {[
            { icon: TwitterIcon, href: "#" },
            { icon: FacebookIcon, href: "#" },
            { icon: InstagramIcon, href: "#" },
          ].map((social, i) => (
            <motion.a
              key={i}
              href={social.href}
              className="text-muted-foreground hover:text-primary transition-colors"
              whileHover={{ scale: 1.2, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <social.icon className="h-5 w-5" />
            </motion.a>
          ))}
        </motion.div>
      </div>
    </motion.footer>
  );
}

function TwitterIcon(props) {
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
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function FacebookIcon(props) {
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
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon(props) {
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
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
