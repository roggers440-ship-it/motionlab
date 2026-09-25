'use client';
import { motion } from 'motion/react';

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <motion.circle cx="16" cy="16" r="14" fill="none" stroke="var(--cat)" strokeWidth="2.5"
        variants={{ rest: { pathLength: 0.78, rotate: -90 }, hover: { pathLength: 1, rotate: 270 } }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }} />
      <motion.circle cx="16" cy="16" r="5" fill="var(--color-fg)"
        variants={{ rest: { scale: 1 }, hover: { scale: 1.35 } }}
        transition={{ type: 'spring', stiffness: 500, damping: 12 }} />
    </motion.svg>
  );
}
