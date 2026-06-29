"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/project", label: "Project" },
  { href: "/skill", label: "Skill" },
  { href: "/contact", label: "Contact" },
] as const;

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 32, mass: 0.3 });

  const activeHref = useMemo(() => {
    if (!pathname) return "/";
    if (pathname === "/") return "/";
    const hit = NAV.find((n) => pathname.startsWith(n.href) && n.href !== "/");
    return hit?.href ?? "/";
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-white/6 bg-black/35 backdrop-blur-2xl">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="focus-ring cursor-target group flex items-center gap-3 rounded-lg"
            >
              <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/12 bg-black/40 transition-colors duration-300 group-hover:border-emerald-400/50">
                <img
                  src="/assets/images/Foto%20Profil.png"
                  alt=""
                  className="h-full w-full object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100"
                />
              </span>
              <span className="hidden text-sm font-medium tracking-tight text-zinc-100 sm:block">
                Muhammad Faza
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
              {NAV.map((item) => {
                const active = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "focus-ring cursor-target group relative rounded-sm py-2 text-[13px] font-medium transition-colors",
                      active ? "text-emerald-300" : "text-zinc-400 hover:text-zinc-100",
                    ].join(" ")}
                  >
                    {item.label}
                    <span
                      className={[
                        "absolute -bottom-0.5 left-0 h-px transition-all duration-300",
                        active
                          ? "w-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                          : "w-0 bg-zinc-300 group-hover:w-full",
                      ].join(" ")}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-zinc-100 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Scroll progress — thin, functional, no decoration */}
        <motion.div
          className="h-[2px] origin-left bg-linear-to-r from-emerald-400 via-emerald-300 to-sky-400"
          style={{ scaleX: progress }}
        />
      </div>

      {open ? (
        <div className="border-b border-white/6 bg-[rgba(5,7,11,0.92)] backdrop-blur-2xl md:hidden">
          <div className="mx-auto max-w-6xl px-5 py-3">
            <nav className="grid gap-1" aria-label="Mobile navigation">
              {NAV.map((item) => {
                const active = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "focus-ring rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "text-zinc-300 hover:bg-white/5 hover:text-zinc-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
