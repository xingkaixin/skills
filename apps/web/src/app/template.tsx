"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useNavDirection } from "./nav-direction";

export default function Template({ children }: { children: ReactNode }) {
  const direction = useNavDirection();

  return (
    <motion.div
      initial={{ opacity: 0, scale: direction === "forward" ? 0.96 : 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
