"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { projectsData, type ProjectLinkType } from "@/data/projectsData";
import Reveal from "@/components/Reveal";

type Filter = "all" | ProjectLinkType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "github", label: "GitHub" },
  { key: "demo", label: "Live Demo" },
];

export default function ProjectPage() {
  const [active, setActive] = useState<Filter>("all");

  const filtered =
    active === "all" ? projectsData : projectsData.filter((p) => p.type === active);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <Reveal>
        <section className="panel rounded-3xl p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-50 md:text-4xl">Project Gallery</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300/90">
                This is proof of my journey to become a hybrid engineer.
              </p>
            </div>

            {/* Filter nav */}
            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActive(f.key)}
                  className={[
                    "cursor-target rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200",
                    active === f.key
                      ? "border border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                      : "border border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-zinc-100",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <section className="mt-8 min-h-48">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex min-h-48 items-center justify-center"
            >
              <p className="text-sm text-zinc-500">No projects in this category yet.</p>
            </motion.div>
          ) : (
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((p, index) => (
                <Reveal key={p.title} delay={index * 0.08}>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="panel group relative flex min-h-[340px] cursor-target flex-col overflow-hidden rounded-2xl border-white/10 p-5 transition duration-200 hover:-translate-y-1 hover:border-emerald-400/35"
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "absolute inset-y-0 left-0 w-0.5 transition-colors duration-200",
                        p.type === "demo"
                          ? "bg-emerald-400/55 group-hover:bg-emerald-300"
                          : "bg-white/55 group-hover:bg-white/90",
                      ].join(" ")}
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">{p.tag}</p>
                        <h2 className="mt-2 text-lg font-semibold text-zinc-50">{p.title}</h2>
                      </div>
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            p.type === "github"
                              ? "/assets/icon/icon/github.svg"
                              : "/assets/icon/icon/external.svg"
                          }
                          alt=""
                          className="h-4 w-4 opacity-75 transition-opacity group-hover:opacity-100"
                        />
                      </span>
                    </div>
                    <p className="mt-5 line-clamp-4 max-w-[34ch] text-sm leading-6 text-zinc-300/90">
                      {p.description}
                    </p>
                    <div className="mt-auto flex min-h-8 flex-wrap gap-2 pt-6">
                      {p.tech.map((t) => (
                        <span key={t} className="badge rounded-full px-3 py-1 text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  </a>
                </Reveal>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
