"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export default function ParallaxBackground() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1200], [0, 170]);
  const scale = useTransform(scrollY, [0, 1200], [1, 1.07]);
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className="bg-stage-layer" aria-hidden="true" />;
  }

  return <motion.div className="bg-stage-layer" style={{ y, scale }} aria-hidden="true" />;
}
