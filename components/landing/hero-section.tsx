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
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  Float,
  Text3D,
  OrbitControls,
} from "@react-three/drei";
import { Button } from "@/components/ui/button";

// 3D Transaction Model Component
function TransactionModel({ isAnimating }: { isAnimating: boolean }) {
  const { nodes, materials } = useGLTF("/assets/3d/transaction.glb") || {};
  const { viewport } = useThree();
  const group = useRef(null);

  // Fallback if model isn't available
  const BoxModel = () => {
    const buyerBox = useRef(null);
    const sellerBox = useRef(null);
    const escrowBox = useRef(null);

    useFrame(({ clock }) => {
      const t = clock.getElapsedTime();

      if (isAnimating) {
        // Animate the boxes to simulate a transaction
        buyerBox.current.position.y = Math.sin(t * 0.5) * 0.2;
        sellerBox.current.position.y = Math.sin(t * 0.5 + 2) * 0.2;
        escrowBox.current.position.y = Math.sin(t * 0.5 + 1) * 0.1;
        escrowBox.current.rotation.y += 0.01;
      }
    });

    return (
      <group>
        {/* Buyer */}
        <group ref={buyerBox} position={[-2, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#4f46e5" />
          </mesh>
          <Text3D
            font="/fonts/Inter_Bold.json"
            position={[0, -1.2, 0]}
            size={0.3}
            height={0.1}
            bevelEnabled
            bevelSize={0.01}
          >
            Buyer
            <meshStandardMaterial color="#ffffff" />
          </Text3D>
        </group>

        {/* Escrow */}
        <group ref={escrowBox} position={[0, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          <Text3D
            font="/fonts/Inter_Bold.json"
            position={[-0.8, -1.5, 0]}
            size={0.3}
            height={0.1}
            bevelEnabled
            bevelSize={0.01}
          >
            CMIGL Escrow
            <meshStandardMaterial color="#ffffff" />
          </Text3D>
        </group>

        {/* Seller */}
        <group ref={sellerBox} position={[2, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          <Text3D
            font="/fonts/Inter_Bold.json"
            position={[0, -1.2, 0]}
            size={0.3}
            height={0.1}
            bevelEnabled
            bevelSize={0.01}
          >
            Seller
            <meshStandardMaterial color="#ffffff" />
          </Text3D>
        </group>

        {/* Transaction Lines */}
        {isAnimating && (
          <>
            <mesh position={[-1, 0, 0]}>
              <boxGeometry args={[1, 0.05, 0.05]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[1, 0, 0]}>
              <boxGeometry args={[1, 0.05, 0.05]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </>
        )}
      </group>
    );
  };

  useFrame(({ clock }) => {
    if (group.current && isAnimating) {
      group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={group} dispose={null} scale={viewport.width > 5 ? 1 : 0.7}>
        {nodes ? (
          // Use the actual model if available
          <primitive object={nodes.Scene} />
        ) : (
          // Use the fallback model
          <BoxModel />
        )}
      </group>
    </Float>
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
  const [isAnimating, setIsAnimating] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    if (isInView) {
      setIsAnimating(true);
    }
  }, [isInView]);

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
                <div className="absolute inset-0">
                  <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight
                      position={[10, 10, 10]}
                      angle={0.15}
                      penumbra={1}
                      intensity={1}
                      castShadow
                    />
                    <TransactionModel isAnimating={isAnimating} />
                    <Environment preset="city" />
                    <OrbitControls
                      enableZoom={false}
                      enablePan={false}
                      minPolarAngle={Math.PI / 3}
                      maxPolarAngle={Math.PI / 2}
                    />
                  </Canvas>
                </div>

                <AnimatePresence>
                  {!isAnimating && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-black/50"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 10,
                        }}
                      >
                        <Button
                          size="lg"
                          onClick={() => setIsAnimating(true)}
                          className="bg-primary/80 backdrop-blur-sm hover:bg-primary/90"
                        >
                          See How It Works
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
