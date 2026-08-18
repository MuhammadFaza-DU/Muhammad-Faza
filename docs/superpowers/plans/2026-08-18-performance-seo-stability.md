# Performance, SEO & Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio feel fast (protected LCP), complete its SEO/metadata, and eliminate lint warnings, typos, and env cruft — then gate the result with a Strix security scan before deploy.

**Architecture:** Four sequential phases, one task each. Phase 1 attacks the LCP killers (heavier-than-duty intro overlay, Spline payload, oversized/dead assets) without removing the Spline robot from any device. Phase 2 fills the missing SEO stack (root + per-page metadata, JSON-LD, sitemap/robots, OG + apple icons). Phase 3 clears every lint warning, fixholds typo/env/readability and adds 404/error pages. Phase 4 is a documented pre-deploy Strix security gate.

**Tech Stack:** Next.js 16 (App Router, Turbopack), Tailwind CSS v4, motion (motion/react), GSAP, `@splinetool/react-spline`, added dev tooling: `sharp` (asset pipeline via one-off Node script).

## Global Constraints

- Spline robot must appear on **all devices** — never skip loading it per-device. Only defer *when* it loads and freeze animation for `prefers-reduced-motion`.
- Keep all 3 Google fonts (Black Ops One, Chelsea Market, Playfair Display). No font changes.
- No new features (no blog/form/dark mode). No brand redesign.
- `npm run lint` must end at **0 errors / 0 warnings** (intermediate tasks may temporarily reduce warnings).
- `npm run build` must succeed at every task, with zero warnings after Task 6 specifically (workspace-root warning).
- Raster photos → `next/image`. Keep `<img>` for small SVG icons, suppressed with `eslint-disable-next-line @next/next/no-img-element`.
- Commit at the end of every task. At execution time, ask the user for permission before each commit (per repo policy).
- `PRODUCT.md` is gitignored (internal) — do not commit it.
- All copy on the site is English → metadata strings in English.

---

### Task 1: Shorten intro overlay + respect prefers-reduced-motion

**Files:**
- Modify: `src/app/intro.tsx`
- Modify: `src/app/globals.css`

**Context from spec (1.1):** The full-screen black intro plays ±1950ms every new session and blocks LCP. Keep the branding moment but cut it to ±1100ms; skip entirely for reduced-motion users.

- [ ] **Step 1: Rewrite the effect in `src/app/intro.tsx`**

Replace lines 10-31 (the `useEffect`) so reduced-motion users skip the intro and total duration becomes 1100ms:

```tsx
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = window.sessionStorage.getItem(KEY);
    if (seen) return;

    window.sessionStorage.setItem(KEY, "1");
    const showId = window.setTimeout(() => setVisible(true), 0);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const hideId = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = prevOverflow;
    }, 1100);

    return () => {
      window.clearTimeout(showId);
      window.clearTimeout(hideId);
      document.body.style.overflow = prevOverflow;
    };
  }, []);
```

- [ ] **Step 2: Compress animation timings in `src/app/globals.css`**

In `.intro-overlay` (line ~238) change to:

```css
.intro-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: #000;
  display: grid;
  place-items: center;
  opacity: 0;
  animation: introFadeIn 0.18s ease forwards, introFadeOut 0.35s ease forwards;
  animation-delay: 0s, 0.72s;
}
```

Adjust the three child animations (keep keyframes untouched):

```css
.intro-logo {
  ...
  animation: introPop 0.45s cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
  animation-delay: 0.12s;
}

.intro-shine {
  ...
  animation: introShine 0.55s ease forwards;
  animation-delay: 0.3s;
}

.intro-spark {
  ...
  animation: introSpark 0.6s ease forwards;
  animation-delay: 0.16s;
}
```

Keep existing `transform`/`opacity` base values in those blocks untouched.

- [ ] **Step 3: Verify**

Run: `npm run lint` and `npm run build`
Expected: lint 0 errors; build succeeds. The `mf_intro_seen` flow still works (intro shows once per session).

Manual: open dev server (`npm run dev`). Fresh session → intro ends by ~1.1s. OS reduced-motion on → no intro at all.

- [ ] **Step 4: Commit**

```bash
git add src/app/intro.tsx src/app/globals.css
git commit -m "perf: shorten intro overlay and respect reduced motion"
```

---

### Task 2: Defer Spline load until LCP, freeze on reduced-motion

**Files:**
- Modify: `src/components/ui/splite.tsx`
- Modify: `src/components/HeroSection.tsx` (only if the wrapper needs the className prop)

**Context from spec (1.2):** Keep the robot on all devices. Gate the mount of the lazy WebGL engine until the hero container is near viewport (it already lazy-loads the code chunk, but currently mounts immediately at page load and competes with LCP). Freeze the scene for reduced-motion.

- [ ] **Step 1: Rewrite `src/components/ui/splite.tsx`**

Replace the whole file:

```tsx
"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldRender(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldRender(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);

    const fallback = window.setTimeout(() => {
      setShouldRender(true);
      io.disconnect();
    }, 3000);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center">
            <span className="loader" />
          </div>
        }
      >
        {shouldRender && (
          <Spline
            scene={scene}
            className="h-full w-full"
            onLoad={(spline) => {
              if (reduceMotion && typeof spline.setTimeScale === "function") {
                spline.setTimeScale(0);
              }
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Verify `HeroSection` still passes correct sizing**

`src/components/HeroSection.tsx:29` currently renders `<SplineScene scene={SPLINE_SCENE_URL} className="h-full w-full" />`. The `className` now lands on the wrapper `<div>` which sits inside the already-sized relative container (HeroSection lines 27-30). No change required — confirm the container keeps `h-full w-full`.

- [ ] **Step 3: Verify**

Run: `npm run lint` and `npm run build`
Expected: lint 0 errors; build succeeds; Spline chunk still code-split (appears as a separate dynamically-loaded chunk in build output under the home route).

Manual: load homepage → hero text/panels paint first, robot appears shortly after (loader `<span className="loader" />` shows meanwhile). `prefers-reduced-motion` on → robot renders as a static frame.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/splite.tsx src/components/HeroSection.tsx
git commit -m "perf: defer spline mount until hero visible and freeze on reduced motion"
```

---

### Task 3: Install sharp + write asset generation script

**Files:**
- Modify: `package.json` (add devDep `sharp`)
- Create: `scripts/generate-assets.mjs`

**Context from spec (1.3):** Asset audit found the real culprits: `Foto Profil.png` 374KB shown at 32px, `FOTO TERKEREN.webp` 267KB, `BG_Statis.webp` 278KB, and `mf_fix2.svg` 499KB (a thin SVG wrapper around one giant base64 PNG). The script extracts/downsizes/compresses, then regenerates brand assets (OG 1200×630, apple-touch-icon 180×180) for Task 7.

- [ ] **Step 1: Install sharp**

Run: `npm install -D sharp`
Expected: `sharp` added to `devDependencies`, `package-lock.json` updated.

- [ ] **Step 2: Create `scripts/generate-assets.mjs`**

```js
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (p) => readFileSync(resolve(root, p));
const write = (p, data) => writeFileSync(resolve(root, p), data);

const NAV_W = 256;
const PROFILE_W = 800;
const BG_W = 1920;
const LOGO_W = 512;

// 1) Navbar photo: from 374KB PNG shown at 32px
write(
  "public/assets/images/foto-profil-nav.webp",
  await sharp(read("public/assets/images/Foto Profil.png"))
    .resize(NAV_W)
    .webp({ quality: 80 })
    .toBuffer()
);

// 2) Profile photo (HiringSection / TiltPhoto)
write(
  "public/assets/images/profile.webp",
  await sharp(read("public/assets/images/FOTO TERKEREN.webp"))
    .resize(PROFILE_W, undefined, { withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer()
);

// 3) Full-screen fixed background
write(
  "public/assets/images/bg-statis.webp",
  await sharp(read("public/assets/images/BG_Statis.webp"))
    .resize(BG_W, undefined, { withoutEnlargement: true })
    .webp({ quality: 68 })
    .toBuffer()
);

// 4) Intro logo: extract the embedded PNG from the oversize SVG wrapper
const mfSvg = read("public/assets/icon/icon/mf_fix2.svg").toString("utf-8");
const match = mfSvg.match(/data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)/);
if (!match) throw new Error("mf_fix2.svg: embedded raster not found");
const logoInner = Buffer.from(match[1], "base64");

write(
  "public/assets/icon/icon/mf-intro.webp",
  await sharp(logoInner)
    .resize(LOGO_W, undefined, { withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
);

const logoRaster = await sharp(logoInner).resize(420).png().toBuffer();
const logoRasterSmall = await sharp(logoInner).resize(112).png().toBuffer();

// 5) OG image 1200x630 (text-free branded card; typography refinable later)
const glowSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="20%" cy="10%" r="60%">
      <stop offset="0%" stop-color="rgba(16,185,129,0.22)"/>
      <stop offset="100%" stop-color="rgba(16,185,129,0)"/>
    </radialGradient>
    <radialGradient id="g2" cx="82%" cy="25%" r="55%">
      <stop offset="0%" stop-color="rgba(52,211,153,0.16)"/>
      <stop offset="100%" stop-color="rgba(52,211,153,0)"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#05070b"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
</svg>`;

const ogBase = await sharp(Buffer.from(glowSvg)).resize(1200, 630).png().toBuffer();
write(
  "public/og.png",
  await sharp(ogBase)
    .composite([{ input: logoRaster, left: (1200 - 420) / 2, top: (630 - 420) / 2 }])
    .png()
    .toBuffer()
);

// 6) Apple touch icon 180x180 (iOS ignores SVG icons)
write(
  "public/apple-touch-icon.png",
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: "#05070b" },
  })
    .composite([{ input: logoRasterSmall, left: 34, top: 34 }])
    .png()
    .toBuffer()
);

console.log("assets generated");
```

- [ ] **Step 3: Verify script runs**

Run: `node scripts/generate-assets.mjs`
Expected: prints `assets generated`. Check new files exist and are smaller than the prior assets:

```powershell
Get-ChildItem public/assets/images/foto-profil-nav.webp, public/assets/images/profile.webp, public/assets/images/bg-statis.webp, public/assets/icon/icon/mf-intro.webp, public/og.png, public/apple-touch-icon.png | Select-Object Name, Length
```

`foto-profil-nav.webp` should be ≈KB-scale (target <10KB); `mf-intro.webp` should be a fraction of the 499KB source; `bg-statis.webp` ≈120KB; `profile.webp` ≈150KB.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json scripts/generate-assets.mjs public/
git commit -m "perf: add sharp asset pipeline and regenerate heavy images"
```

---

### Task 4: Wire new assets into code + delete unused assets

**Files:**
- Modify: `src/components/Navbar.tsx` (`<img>` → `next/image`, new src)
- Modify: `src/components/TiltPhoto.tsx` (`<img>` → `next/image` with `fill`)
- Modify: `src/components/HiringSection.tsx` (photo src)
- Modify: `src/app/globals.css` (background url)
- Modify: `src/app/intro.tsx` (intro logo src)
- Delete: `public/assets/images/Foto Profil.png`, `FOTO TERKEREN.webp`, `BG_Statis.webp`, `public/assets/icon/icon/mf_fix2.svg`, `mf_fix.svg`, `mf.svg`, `sprite.svg`, `email.png`, `email.jpg`, and template leftovers `public/next.svg`, `vercel.svg`, `window.svg`, `globe.svg`, `file.svg`

**Context from spec (1.3, 3.6):** Point the code at optimized assets and remove ~390KB of dead weight. `git grep` verified all deleted files are unreferenced in `src/`. Re-run that check before deleting in case the file changed.

- [ ] **Step 1: Navbar — `src/components/Navbar.tsx`**

Add import after line 3 (`import Link from "next/link";`):

```tsx
import Image from "next/image";
```

Replace the `<img>` at lines 79-83:

```tsx
                <Image
                  src="/assets/images/foto-profil-nav.webp"
                  alt=""
                  width={32}
                  height={32}
                  className="h-full w-full object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100"
                />
```

- [ ] **Step 2: TiltPhoto — `src/components/TiltPhoto.tsx`**

Add import after line 3:

```tsx
import Image from "next/image";
```

Replace line 66:

```tsx
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 68vw, 384px"
          className="object-cover"
        />
```

(The parent `motion.div` already has `relative overflow-hidden` — required for `fill`.)

- [ ] **Step 3: HiringSection — `src/components/HiringSection.tsx`**

In line 60 change `src="/assets/images/FOTO%20TERKEREN.webp"` → `src="/assets/images/profile.webp"`.

- [ ] **Step 4: Background url — `src/app/globals.css`**

In `.bg-stage-layer` (line 71) change `url("/assets/images/BG_Statis.webp")` → `url("/assets/images/bg-statis.webp")`.

- [ ] **Step 5: Intro logo — `src/app/intro.tsx`**

Line 40 change `src="/assets/icon/icon/mf_fix2.svg"` → `src="/assets/icon/icon/mf-intro.webp"`.

- [ ] **Step 6: Re-verify nothing references files about to be deleted**

Run:

```powershell
git grep -l "Foto Profil\|FOTO TERKEREN\|BG_Statis\|mf_fix2\|mf_fix\b\|mf\.svg\|sprite\.svg\|email\.\(png\|jpg\)\|next\.svg\|vercel\.svg\|window\.svg\|globe\.svg\|file\.svg" -- ':!docs' ':!scripts'
```

Expected: no hits in `src/`. (Docs/specs may mention `mf_fix2` — those are historical docs, leave them.)

- [ ] **Step 7: Delete unused files**

```bash
git rm "public/assets/images/Foto Profil.png" "public/assets/images/FOTO TERKEREN.webp" public/assets/images/BG_Statis.webp public/assets/icon/icon/mf_fix2.svg public/assets/icon/icon/mf_fix.svg public/assets/icon/icon/mf.svg public/assets/icon/icon/sprite.svg public/assets/icon/icon/email.png public/assets/icon/icon/email.jpg public/next.svg public/vercel.svg public/window.svg public/globe.svg public/file.svg
```

- [ ] **Step 8: Verify**

Run: `npm run lint` and `npm run build`
Expected: build succeeds. Lint warnings for `Navbar` and `TiltPhoto` `<img>` are gone (photos now use Image). Remaining `<img>` warnings: Footer:36, HiringSection:38, contact:72, contact:74, project:91, intro:40 — all SVG icons/logo (to be suppressed in Task 10). That's fine here.

Manual: navbar avatar renders, TiltPhoto photo renders with correct aspect, background image unchanged visually, intro logo still centered.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "perf: use optimized assets, next/image for photos, drop unused assets"
```

---

### Task 5: Pause ConstellationBackground when tab hidden + mobile DPR cap

**Files:**
- Modify: `src/components/ConstellationBackground.tsx`

**Context from spec (1.4):** Canvas keeps animating with O(n²) distance checks every frame regardless of page visibility. Pause scheduling when the tab is hidden; cap device pixel ratio to 1.5 on mobile instead of 2.

- [ ] **Step 1: Change DPR to be resolution-aware**

Replace line 23 (`const DPR = Math.min(window.devicePixelRatio || 1, 2);`) with:

```tsx
    const DPR = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
```

- [ ] **Step 2: Add visibility-aware scheduling**

Replace the `tick` definition (lines 59-111) — keep the entire paint body, but guard scheduling:

```tsx
    let running = true;
    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (!running) cancelAnimationFrame(raf);
      else tick();
    };

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;

        // repel dari cursor
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const md = Math.hypot(dx, dy);
        if (md < REPEL_DIST && md > 0) {
          const force = (REPEL_DIST - md) / REPEL_DIST;
          n.x += (dx / md) * force * 1.2;
          n.y += (dy / md) * force * 1.2;
        }

        // pantul tepi
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        n.x = Math.max(0, Math.min(width, n.x));
        n.y = Math.max(0, Math.min(height, n.y));
      }

      // garis koneksi
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.16;
            ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // node
      for (const n of nodes) {
        ctx.fillStyle =
          n.hue === 1 ? "rgba(56, 189, 248, 0.5)" : "rgba(52, 211, 153, 0.45)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
```

- [ ] **Step 3: Register listener + update cleanup**

Replace the block at lines 113-124:

```tsx
    resize();
    tick();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
```

- [ ] **Step 4: Verify**

Run: `npm run lint` and `npm run build`
Expected: lint 0 errors; build succeeds.

Manual: switch to another tab and back — canvas animation stops while hidden and resumes on return. Mobile viewport renders at reduced DPR (no visible quality change on typical phone screens).

- [ ] **Step 5: Commit**

```bash
git add src/components/ConstellationBackground.tsx
git commit -m "perf: pause constellation canvas when tab hidden, lower mobile DPR"
```

---

### Task 6: Fix build workspace-root warning via turbopack.root

**Files:**
- Modify: `next.config.ts`

**Context from spec (1.5):** Next.js inferred the workspace root from a lockfile in the parent folder (`WEB-PORTOFOLIO/package-lock.json`) because `turbopack.root` is unset.

- [ ] **Step 1: Set turbopack.root**

Replace the whole `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: build succeeds and the "Next.js inferred your workspace root" warning is **gone**.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: pin turbopack root to silence workspace-root warning"
```

---

### Task 7: Complete root metadata, lang=en, apple icon, JSON-LD

**Files:**
- Modify: `src/app/layout.tsx`

**Context from spec (2.1, 2.4, 2.5):** Replace the partial metadata with a complete stack; fix `lang="id"` → `"en"`, fix "Portofolio" typo, embed Person+WebSite JSON-LD, and point the apple icon at the generated PNG. OG image (`/og.png`) and apple icon (`/apple-touch-icon.png`) are already produced by Task 3's script.

- [ ] **Step 1: Replace metadata export (lines 30-39)**

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://muhammadfaza.vercel.app"),
  title: {
    default: "Muhammad Faza — Computer Engineer, AI Engineer, Embedded AI & Web Developer",
    template: "%s | Muhammad Faza",
  },
  description:
    "Portfolio of Muhammad Faza — a hybrid engineer bridging hardware and software: Computer Engineering, AI Engineering, Embedded AI, and Web Development. Open for full-time, freelance, and collaboration.",
  keywords: [
    "Muhammad Faza",
    "Computer Engineer",
    "AI Engineer",
    "Embedded AI",
    "Web Developer",
    "Software Engineer",
    "Hardware Engineer",
    "Portfolio",
  ],
  authors: [{ name: "Muhammad Faza" }],
  creator: "Muhammad Faza",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://muhammadfaza.vercel.app",
    siteName: "Muhammad Faza",
    title: "Muhammad Faza — Computer Engineer, AI Engineer, Embedded AI & Web Developer",
    description:
      "Portfolio of Muhammad Faza — a hybrid engineer bridging hardware and software. Open for full-time, freelance, and collaboration.",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Muhammad Faza Portfolio" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muhammad Faza — Computer Engineer, AI Engineer",
    description:
      "Portfolio of Muhammad Faza — a hybrid engineer bridging hardware and software.",
    images: ["/og.png"],
  },
};
```

- [ ] **Step 2: Fix lang and add JSON-LD**

Change `<html lang="id"` → `<html lang="en"` (line 48).

Add the structured-data script immediately before the closing `</body>` tag (after `<TargetCursor ... />`):

```tsx
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": "https://muhammadfaza.vercel.app/#person",
                  name: "Muhammad Faza",
                  url: "https://muhammadfaza.vercel.app",
                  email: "mailto:lexfaza@gmail.com",
                  jobTitle: [
                    "Computer Engineer",
                    "AI Engineer",
                    "Embedded AI Engineer",
                    "Web Developer",
                  ],
                  sameAs: [
                    "https://www.instagram.com/mfaz.aa",
                    "https://github.com/MuhammadFaza-DU",
                    "https://www.linkedin.com/in/m-faza-443479372",
                    "https://www.youtube.com/@MuhammadFaza-justone",
                    "https://www.tiktok.com/@mfaz.aa",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://muhammadfaza.vercel.app/#website",
                  name: "Muhammad Faza",
                  url: "https://muhammadfaza.vercel.app",
                  inLanguage: "en",
                },
              ],
            }),
          }}
        />
```

- [ ] **Step 3: Verify**

Run: `npm run lint` and `npm run build`
Expected: build succeeds. Inspect the static HTML output:

```powershell
Get-ChildItem .next/server/app/index.html | Select-String -Pattern 'application/ld\+json','description','og:', 'rel="canonical"','<html lang="en"'
```

All should match. Also confirm `/apple-touch-icon.png` and `/og.png` exist in `public/`.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): complete root metadata, JSON-LD, lang en, apple icon"
```

---

### Task 8: Per-page metadata

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/project/page.tsx`
- Modify: `src/app/skill/page.tsx`
- Modify: `src/app/contact/page.tsx`

**Context from spec (2.2):** Each route gets its own title/description/canonical. Sub-pages use the `%s | Muhammad Faza` template; home uses an absolute title to avoid duplication.

- [ ] **Step 1: Home — `src/app/page.tsx`**

Replace the whole file:

```tsx
import type { Metadata } from "next";
import HomePage from "./home";

export const metadata: Metadata = {
  title: {
    absolute: "Muhammad Faza — Computer Engineer, AI Engineer, Embedded AI & Web Developer",
  },
  description:
    "Hybrid engineer bridging hardware and software. Open for full-time, freelance, and collaboration.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomePage />;
}
```

- [ ] **Step 2: Project — `src/app/project/page.tsx`**

Replace the whole file:

```tsx
import type { Metadata } from "next";
import ProjectPage from "./project";

export const metadata: Metadata = {
  title: "Projects",
  description: "Project gallery of Muhammad Faza — proof of the journey toward becoming a hybrid engineer.",
  alternates: { canonical: "/project" },
};

export default function Page() {
  return <ProjectPage />;
}
```

- [ ] **Step 3: Skill — `src/app/skill/page.tsx`**

Replace the whole file:

```tsx
import type { Metadata } from "next";
import SkillPage from "./skill";

export const metadata: Metadata = {
  title: "Skills",
  description: "Skill matrix of Muhammad Faza — core roles and supporting skills across hardware, AI, and web development.",
  alternates: { canonical: "/skill" },
};

export default function Page() {
  return <SkillPage />;
}
```

- [ ] **Step 4: Contact — `src/app/contact/page.tsx`**

Replace the whole file:

```tsx
import type { Metadata } from "next";
import ContactPage from "./contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Muhammad Faza via Instagram or email. Open for full-time, freelance, and collaboration.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <ContactPage />;
}
```

- [ ] **Step 5: Verify**

Run: `npm run lint` and `npm run build`
Expected: build succeeds. Inspect generated HTML heads:

```powershell
Select-String -Path .next/server/app/project.html,.next/server/app/skill.html,.next/server/app/contact.html,index.html -Pattern '<title>'
```

Home → "Muhammad Faza — Computer Engineer, AI Engineer, Embedded AI & Web Developer"; others → "Projects | Muhammad Faza", "Skills | Muhammad Faza", "Contact | Muhammad Faza".

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/app/project/page.tsx src/app/skill/page.tsx src/app/contact/page.tsx
git commit -m "feat(seo): add per-page metadata"
```

---

### Task 9: sitemap.ts + robots.ts

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

**Context from spec (2.3):** Static site — hand-declare the five real routes.

- [ ] **Step 1: Create `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";

const BASE = "https://muhammadfaza.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/project`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/skill`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/resume`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
```

- [ ] **Step 2: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

const BASE = "https://muhammadfaza.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: build succeeds. `GET /sitemap.xml` and `GET /robots.txt` return 200 with expected XML/text (via `npm start` after build, or check `.next/server/app/robots.txt.body` / `sitemap.xml.body` exist in build output).

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat(seo): add sitemap and robots"
```

---

### Task 10: Clear lint warnings

**Files:**
- Modify: `src/app/contact/contact.tsx` (remove unused import; suppress SVG `<img>`)
- Modify: `src/components/TargetCursor.tsx` (exhaustive-deps fix)
- Modify: `src/components/Footer.tsx` (suppress SVG `<img>`)
- Modify: `src/components/HiringSection.tsx` (suppress SVG `<img>`)
- Modify: `src/app/project/project.tsx` (suppress SVG `<img>`)
- Modify: `src/app/intro.tsx` (suppress SVG `<img>`)

**Context from spec (3.1):** Get `npm run lint` from 10 warnings → 0. Photos already converted in Task 4; the six remaining are deliberately-kept SVG `data:`/icon `<img>`.

- [ ] **Step 1: contact.tsx — remove unused import**

Delete line 1 (`import Link from "next/link";`).

- [ ] **Step 2: TargetCursor.tsx — fix exhaustive-deps (line 264)**

Inside the main `useEffect` (starting line 98), add a captured ref as the first statement after `if (isMobile || !cursorRef.current) return;`:

```tsx
    const activeStrength = activeStrengthRef.current;
```

In the cleanup (line 264), change:

```tsx
      activeStrengthRef.current.current = 0;
```

to:

```tsx
      activeStrength.current = 0;
```

(Other `activeStrengthRef.current.current` uses inside handlers are fine — only the cleanup was flagged.)

- [ ] **Step 3: Suppress SVG `<img>` warnings (6 sites)**

Add the disable comment directly above each remaining `<img>`:

- `src/app/intro.tsx:40`
- `src/components/Footer.tsx:36`
- `src/components/HiringSection.tsx:38`
- `src/app/contact/contact.tsx:72` and `:74`
- `src/app/project/project.tsx:91`

```tsx
                  {/* eslint-disable-next-line @next/next/no-img-element */}
```

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: **0 problems (0 errors, 0 warnings)**.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/contact/contact.tsx src/components/TargetCursor.tsx src/components/Footer.tsx src/components/HiringSection.tsx src/app/project/project.tsx src/app/intro.tsx
git commit -m "fix: clear all lint warnings"
```

---

### Task 11: Typo, env cleanup, text readability

**Files:**
- Modify: `src/app/skill/skill.tsx`
- Modify: `.env` (local, gitignored)
- Modify: `.env.example`
- Modify: `src/app/globals.css`

**Context from spec (3.2, 3.3, 3.4):** Fix the "Shoftware" typo; remove leftover `OPENAI_*` secrets that no code uses; stop global justified text.

- [ ] **Step 1: Fix typo — `src/app/skill/skill.tsx:20`**

Change `Shoftware Engineer` → `Software Engineer`.

- [ ] **Step 2: Clean `.env`**

Do **not** print the file's contents (contains secrets). Strip the three `OPENAI_*` lines in place:

```powershell
(Get-Content .env | Where-Object { $_ -notmatch '^\s*OPENAI_' }) | Set-Content .env
```

- [ ] **Step 3: Clean `.env.example`**

Replace its whole content with:

```
# No environment variables are required by this project.
```

- [ ] **Step 4: Remove global justify — `src/app/globals.css`**

Delete the block at lines 45-48:

```css
p {
  text-align: justify;
  text-justify: inter-word;
}
```

- [ ] **Step 5: Verify**

Run: `npm run lint` and `npm run build`
Expected: lint 0/0; build succeeds.

Manual: paragraphs now left-aligned (default), which is more readable on narrow screens.

- [ ] **Step 6: Commit**

```bash
git add src/app/skill/skill.tsx .env.example src/app/globals.css
git commit -m "fix: correct typo, clean unused env, drop global justified text"
```

---

### Task 12: Custom 404 and error boundary

**Files:**
- Create: `src/app/not-found.tsx`
- Create: `src/app/error.tsx`

**Context from spec (3.5):** Replace default bland 404 with on-brand styling; add a client error boundary with a retry button.

- [ ] **Step 1: Create `src/app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 pt-10 pb-16 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-emerald-300/80">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-zinc-50 md:text-5xl">Page Not Found</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-300/90">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="btn btn-primary focus-ring mt-8 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium text-emerald-100"
      >
        Back to Home
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 pt-10 pb-16 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-emerald-300/80">ERROR</p>
      <h1 className="mt-3 text-3xl font-semibold text-zinc-50 md:text-4xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-300/90">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn btn-primary focus-ring mt-8 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium text-emerald-100"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint` and `npm run build`
Expected: lint 0/0; build succeeds; `/_not-found` route becomes a custom page (check `npm start` and hit a bogus URL → styled 404).

Manual: visit `/does-not-exist` → custom 404 with "Back to Home".

- [ ] **Step 4: Commit**

```bash
git add src/app/not-found.tsx src/app/error.tsx
git commit -m "feat: add custom 404 and error boundary"
```

---

### Task 13: Security gate — pre-deploy Strix scan (no code)

**Files:** none (orchestration only). Output lands in `strix_runs/` (gitignored).

**Context from spec (Phase 4):** User approved a Strix security scan as the final gate before deploying this work to the live Vercel site.

- [ ] **Step 1: Confirm with user**

Before running anything: confirm scope (target `https://muhammadfaza.vercel.app`, a domain owned by the user), cost, and time estimate (quick ±5 min / standard ±30 min). Get explicit approval — scans are not run automatically.

- [ ] **Step 2: Run scan**

Invoke sub-skill `software-engineering/security-testing` (Strix). Use mode appropriate to the target (self-hosted CLI or managed app.strix.ai). Expect validated findings with PoCs.

- [ ] **Step 3: Triage**

- Exit code 0 (clean) → finish.
- Exit code 2 (findings) → triage by severity. Use `fix-security-vulnerabilities-with-strix` for critical/high; re-scan to prove each fix closes the exploit. If the user decides to accept a risk, record that decision explicitly in the run report.

- [ ] **Step 4: Docker hygiene**

If the scan used the local/Docker mode, after the scan completes run:

```bash
docker system prune -f
```

- [ ] **Step 5: Report**

Summarize findings/decisions to the user and offer the final deploy checkpoint (commit + tag `stable-2026-08-18-vN`) after everything is stable.

---

## Self-Review Notes

- **Spec coverage:** every Phase 1-3 spec bullet maps to a task: 1.1→T1, 1.2→T2, 1.3→T3+T4, 1.4→T5, 1.5→T6, 1.6→(no-op, kept 3 fonts), 2.1+2.4+2.5→T7, 2.2→T8, 2.3→T9, 3.1→T4 (photos) + T10 (icons/refs), 3.2/3.3/3.4→T11, 3.5→T12, Phase 4→T13.
- **Placeholder scan:** none — every step carries real code or a concrete command with expected output.
- **Type consistency:** `SplineScene` keeps the same `{ scene, className }` props; `TiltPhoto` keeps `{ src, alt, name?, role? }`; `activeStrength` is captured once and used for the cleanup only; metadata exports use `MetadataRoute` from `next`.
- **Runtime ordering:** T3 must run before T4 (files referenced) and before T7 (og/apple icons); T7's `apple-touch-icon.png` reference depends on T3 having run. Tasks are executed sequentially.