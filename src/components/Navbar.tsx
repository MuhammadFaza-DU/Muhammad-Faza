"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

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

  const activeHref = useMemo(() => {
    if (!pathname) return "/";
    if (pathname === "/") return "/";
    const hit = NAV.find((n) => pathname.startsWith(n.href) && n.href !== "/");
    return hit?.href ?? "/";
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-black/35 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="focus-ring flex items-center gap-3 rounded-full px-2 py-1"
            onClick={() => setOpen(false)}
          >
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40 glow-ring">
              <img
                src="/assets/images/Foto%20Profil.png"
                alt="Logo MF"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="hidden text-sm font-medium tracking-wide text-zinc-100 sm:inline">
              Muhammad Faza
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-zinc-200 md:flex">
            {NAV.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "focus-ring rounded-full px-3 py-2",
                    active
                      ? "text-emerald-300 link-underline"
                      : "text-zinc-200/90 hover:text-zinc-100",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="focus-ring md:hidden inline-flex items-center justify-center rounded-full border border-white/10 bg-black/30 p-2 text-zinc-100"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="pb-4 pt-2 md:hidden">
            <div className="panel-soft rounded-2xl p-3">
              <div className="grid gap-1 text-sm">
                {NAV.map((item) => {
                  const active = activeHref === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={[
                        "focus-ring rounded-xl px-3 py-2",
                        active ? "text-emerald-300" : "text-zinc-200/90 hover:text-zinc-50",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

