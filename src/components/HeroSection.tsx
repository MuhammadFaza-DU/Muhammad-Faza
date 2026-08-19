"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";

const SPLINE_SCENE_URL = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

const subscribe = () => () => {};

const getSnapshot = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;

const getServerSnapshot = () => false;

export default function HeroSection() {
  const isTouchDevice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const reduceMotion = useReducedMotion();

  return (
    <section className="grid gap-10 md:grid-cols-2 md:items-stretch">
      <div className="relative h-full">
        <div className="panel relative flex h-full flex-col overflow-hidden rounded-3xl p-7">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-sky-400/5" />
          <div className="relative flex flex-1 flex-col">
            <div />

            <div className="flex flex-1 flex-col items-center justify-center py-4">
              <div className="relative h-[260px] w-full max-w-[300px] sm:h-[300px] sm:max-w-[340px] md:h-[340px] md:max-w-[380px]">
                {!isTouchDevice && <Spotlight className="-top-10 left-0" />}
                <motion.div
                  className="h-full w-full"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <SplineScene scene={SPLINE_SCENE_URL} className="h-full w-full" />
                </motion.div>
              </div>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="panel-soft rounded-2xl p-3">
                <p className="font-mono text-[11px] text-zinc-400">ENV</p>
                <p className="mt-1 text-sm font-medium text-zinc-100">Hybrid</p>
              </div>
              <div className="panel-soft rounded-2xl p-3">
                <p className="font-mono text-[11px] text-zinc-400">EXPERTISE</p>
                <p className="mt-1 text-sm font-medium text-zinc-100">Hardware & Software</p>
              </div>
              <div className="panel-soft rounded-2xl p-3">
                <p className="font-mono text-[11px] text-zinc-400">STATUS</p>
                <p className="mt-1 text-sm font-medium text-emerald-200">Available</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="flex flex-col justify-center">
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-zinc-50 md:text-5xl">
          Hi, I’m <span className="text-emerald-300">Muhammad Faza</span>
        </h1>
        <p className="mt-4 text-sm font-light leading-relaxed text-zinc-200/80 md:text-base">
          Computer Engineer | AI Engineer | Embedded AI | Web Developer | App Developer | End-to-End Builder
        </p>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300/90">
          I build technology that connects AI, software, and embedded systems into real-world solutions. With experience in AI engineering, web development, and app development, I enjoy transforming ideas into functional, scalable, and useful products. I&apos;m always drawn to new challenges and innovations that push the boundaries of technology.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="badge-accent rounded-full px-3 py-1 text-sm">Python</span>
          <span className="badge-accent rounded-full px-3 py-1 text-sm">C / C++</span>
          <span className="badge-accent rounded-full px-3 py-1 text-sm">MySQL</span>
          <span className="badge rounded-full px-3 py-1 text-sm">TypeScript</span>
          <span className="badge rounded-full px-3 py-1 text-sm">JavaScript</span>
          <span className="badge rounded-full px-3 py-1 text-sm">Dart</span>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href="/resume"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary focus-ring cursor-target inline-flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-medium text-emerald-100"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
                ↓
              </span>
              Download Resume
            </span>
          </a>

          <a
            href="/project"
            className="btn focus-ring cursor-target inline-flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-medium text-zinc-100"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-zinc-200">
                →
              </span>
              Project
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
