"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

const MAX_TILT = 15;

interface TiltPhotoProps {
  src: string;
  alt: string;
  name?: string;
  role?: string;
}

export default function TiltPhoto({ src, alt, name, role }: TiltPhotoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const shinePx = useMotionValue(50);
  const shinePy = useMotionValue(50);

  const rotateX = useSpring(rawX, { stiffness: 300, damping: 30, mass: 0.5 });
  const rotateY = useSpring(rawY, { stiffness: 300, damping: 30, mass: 0.5 });
  const shineX = useSpring(shinePx, { stiffness: 300, damping: 30 });
  const shineY = useSpring(shinePy, { stiffness: 300, damping: 30 });

  const shineBackground = useTransform(
    [shineX, shineY],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.11), transparent 65%)`
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    rawY.set(dx * MAX_TILT);
    rawX.set(-dy * MAX_TILT);
    shinePx.set(((e.clientX - rect.left) / rect.width) * 100);
    shinePy.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
    shinePx.set(50);
    shinePy.set(50);
  }

  return (
    <div className="relative mx-auto w-[68%] aspect-9/16 sm:w-full sm:max-w-sm">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          reduceMotion
            ? undefined
            : { rotateX, rotateY, transformPerspective: 800, transformStyle: "preserve-3d" }
        }
        className="relative h-full w-full cursor-pointer overflow-hidden rounded-3xl border border-emerald-400/30 shadow-2xl shadow-emerald-500/20"
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" />

        {/* Gradient bawah tipis untuk caption area */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

        {/* Caption badge bawah */}
        {(name || role) && (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
            <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
              {name && (
                <p className="text-sm font-semibold tracking-wide text-zinc-100">{name}</p>
              )}
              {role && (
                <p className="mt-0.5 text-[11px] tracking-wide text-emerald-300/80">{role}</p>
              )}
            </div>
          </div>
        )}

        {/* Sheen/gloss mengikuti kursor */}
        {!reduceMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: shineBackground }}
          />
        )}

        {/* Inner hairline border */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
      </motion.div>

      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />
    </div>
  );
}
