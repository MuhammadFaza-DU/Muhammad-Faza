# Spline 3D Robot di HeroSection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti badge logo MF + spinning rings di panel kiri HeroSection dengan scene Spline 3D (robot), mempertahankan identitas visual & info cards.

**Architecture:** Menambahkan `SplineScene` (lazy-loaded wrapper dari `@splinetool/react-spline`) dan `Spotlight` (diadaptasi dari `framer-motion` → `motion/react`) di bawah `src/components/ui/`. Membuat helper `cn()` di `src/lib/utils.ts`. Merebus HeroSection untuk meletakkan robot 3D di slot bekas logo, mempertahankan panel & info cards. Robot responsif dan interaktif hanya di pointer-fine (desktop); di touch device spotlight dimatikan tapi 3D tetap render.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS 4, Motion (`motion/react`, versi 12.42), `@splinetool/react-spline`, `clsx`, `tailwind-merge`.

## Global Constraints

- Scene URL sementara: `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode`
- TIDAK mengubah konten/data (proyek, skill, sosial, resume) dan identitas visual (warna emerald/sky, font, treatment `.panel`)
- TIDAK install `framer-motion` — gunakan `motion/react` yang sudah ada (API identik)
- TIDAK pakai `shadcn/card` — pakai `.panel` yang sudah ada
- Hapus: `pulse-glow`, `spin-ring-emerald`, `spin-ring-sky`, hairline ring, badge logo MF, `.float`
- Pertahankan: info cards (ENV/EXPERTISE/STATUS) dengan grid `sm:grid-cols-3`
- TIDAK ada unit test framework di project — verifikasi via `npm run lint`, `npm run build`, dan manual check

---

### Task 0: Fix lint error pre-existing (blokir build)

**Files:**
- Modify: `src/components/GradualBlur.tsx`
- Modify: `src/components/HeroSection.tsx`
- Modify: `src/app/contact/contact.tsx`

**Interfaces:**
- Produces: project yang lolos `next build` (lint error = 0).

- [ ] **Step 1: Fix `GradualBlur.tsx` prefer-const**

`let progress` di baris ~109 (tidak pernah di-reassign) → ganti ke `const progress`.

- [ ] **Step 2: Fix unescaped apostrophe di `HeroSection.tsx`**

Baris ~57 berisi `I'm always drawn...` → ganti apostrophe `'` menjadi `&apos;` (di dalam JSX text).

- [ ] **Step 3: Fix unescaped apostrophe di `contact.tsx`**

Baris ~86 berisi `if you'd like` → ganti `'` menjadi `&apos;` (di dalam JSX text).

- [ ] **Step 4: Verifikasi lint 0 error**

Run: `npm run lint`
Expected: tidak ada error (warning `<img>` boleh tersisa, itu warning bukan error).

- [ ] **Step 5: Commit**

```bash
git add src/components/GradualBlur.tsx src/components/HeroSection.tsx src/app/contact/contact.tsx
git commit -m "fix: resolve pre-existing lint errors blocking build"
```

---

### Task 1: Install dependencies + setup lib/utils

**Files:**
- Create: `src/lib/utils.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]) => string` (export function `cn`)

- [ ] **Step 1: Install dependencies**

```bash
npm install @splinetool/react-spline @splinetool/runtime clsx tailwind-merge
```

Expected: semuanya masuk ke `dependencies` di package.json, tanpa `framer-motion`.

- [ ] **Step 2: Buat `src/lib/utils.ts`**

Buat folder `src/lib/` jika belum ada, lalu:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Verifikasi resolusi path & lint**

Run: `npm run lint`
Expected: tidak ada error baru terkait `src/lib/utils.ts` (bisa masih ada error yang sudah ada sebelumnya dari file lain — catat jangan ganggu).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/utils.ts
git commit -m "feat: add spline/react-spline deps and cn() util"
```

---

### Task 2: Buat `SplineScene` component

**Files:**
- Create: `src/components/ui/splite.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `SplineScene({ scene: string, className?: string })` — lazy-loads `@splinetool/react-spline`, render `<Spline scene={scene} className={className} />` dengan Suspense fallback loader.

- [ ] **Step 1: Buat folder & file**

Buat `src/components/ui/` jika belum ada, lalu tulis:

```tsx
"use client";

import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full flex items-center justify-center">
          <span className="loader" />
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
```

- [ ] **Step 2: Lint cek**

Run: `npm run lint`
Expected: tidak ada error baru di file ini.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/splite.tsx
git commit -m "feat: add lazy-loaded SplineScene component"
```

---

### Task 3: Buat `Spotlight` component (diadaptasi Motion)

**Files:**
- Create: `src/components/ui/spotlight.tsx`

**Interfaces:**
- Consumes: `cn` dari `@/lib/utils`
- Produces: `Spotlight({ className?: string, size?: number, springOptions?: SpringOptions })` — layered radial-gradient yang mengikuti cursor di dalam parent element.

- [ ] **Step 1: Tulis komponen (adaptasi framer-motion → motion/react)**

```tsx
"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, useSpring, useTransform, type SpringOptions } from "motion/react";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  className?: string;
  size?: number;
  springOptions?: SpringOptions;
};

export function Spotlight({
  className,
  size = 200,
  springOptions = { bounce: 0 },
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null);

  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);

  const spotlightLeft = useTransform(mouseX, (x) => `${x - size / 2}px`);
  const spotlightTop = useTransform(mouseY, (y) => `${y - size / 2}px`);

  useEffect(() => {
    if (containerRef.current) {
      const parent = containerRef.current.parentElement;
      if (parent) {
        parent.style.position = "relative";
        parent.style.overflow = "hidden";
        setParentElement(parent);
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!parentElement) return;
      const { left, top } = parentElement.getBoundingClientRect();
      mouseX.set(event.clientX - left);
      mouseY.set(event.clientY - top);
    },
    [mouseX, mouseY, parentElement]
  );

  useEffect(() => {
    if (!parentElement) return;
    parentElement.addEventListener("mousemove", handleMouseMove);
    parentElement.addEventListener("mouseenter", () => setIsHovered(true));
    parentElement.addEventListener("mouseleave", () => setIsHovered(false));
    return () => {
      parentElement.removeEventListener("mousemove", handleMouseMove);
      parentElement.removeEventListener("mouseenter", () => setIsHovered(true));
      parentElement.removeEventListener("mouseleave", () => setIsHovered(false));
    };
  }, [parentElement, handleMouseMove]);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops),transparent_80%)] blur-xl transition-opacity duration-200",
        "from-zinc-50 via-zinc-100 to-zinc-200",
        isHovered ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ width: size, height: size, left: spotlightLeft, top: spotlightTop }}
    />
  );
}
```

- [ ] **Step 2: Lint cek**

Run: `npm run lint`
Expected: tidak ada error baru di file ini.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/spotlight.tsx
git commit -m "feat: add spotlight component adapted to motion/react"
```

---

### Task 4: Edit HeroSection — ganti logo MF dengan Spline robot

**Files:**
- Modify: `src/components/HeroSection.tsx`

**Interfaces:**
- Consumes: `SplineScene` dari `@/components/ui/splite`, `Spotlight` dari `@/components/ui/spotlight`
- Produces: HeroSection dengan robot 3D di panel kiri, info cards tetap, spotlight pointer-fine only.

- [ ] **Step 1: Baca file hero terbaru**

Run `read` pada `src/components/HeroSection.tsx` untuk konteks persis (hindari mengedit dari hafalan).

- [ ] **Step 2: Tambahkan imports**

```tsx
import { useEffect, useState } from "react";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";

const SPLINE_SCENE_URL = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
```

Tambahkan deteksi `isTouchDevice` (data di awal komponen, bukan state — dihitung sekali):

```tsx
const isTouchDevice =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);
```

- [ ] **Step 3: Ganti blok badge logo (grid h-48 w-48 ... sampai logo MF) dengan slot robot**

Hapus div `pulse-glow`, `spin-ring-emerald`, `spin-ring-sky`, hairline ring, dan badge MF (`float` + `<img mf_fix2.svg>`).

Ganti dengan:

```tsx
<div className="relative w-full max-w-[300px] aspect-[3/4] sm:max-w-[340px] md:max-w-[380px]">
  {!isTouchDevice && <Spotlight className="-top-10 left-0" />}
  <SplineScene scene={SPLINE_SCENE_URL} className="h-full w-full" />
</div>
```

> Catatan: `Spotlight` parent auto-set `position: relative; overflow: hidden` — pastikan wrapper robot yang menampungnya. Block info cards (ENV/EXPERTISE/STATUS) TETAP, jangan dihapus. Gradient overlay panel kiri pertahankan tapi kurangi opacity agar robot jelas.

- [ ] **Step 4: Kurangi opacity gradient overlay panel kiri**

Pada `bg-linear-to-br from-emerald-500/10 via-transparent to-sky-400/10` → ubah ke opacity lebih redup (mis. `/5` dan `/5`), supaya tidak menutupi robot.

- [ ] **Step 5: Lint + build verifikasi**

Run: `npm run lint` lalu `npm run build`
Expected: lint tanpa error baru; build sukses. Perhatikan: build akan fetch scene Spline internet saat render? — `SplineScene` adalah client component (lazy), jadi tidak di-render saat SSR; build seharusnya jalan. Jika ada error "import not found" di `@splinetool/react-spline`, cek versi yang ter-install dan sesuaikan import path.

- [ ] **Step 6: Manual check (dev mode)**

Jalankan `npm run dev`, buka `http://localhost:3000`, verifikasi:
- Robot 3D muncul di panel kiri (desktop & mobile)
- Spotlight hanya aktif di desktop/hover
- Info cards tetap tampil di bawah robot
- Luar panel tidak terpengaruh; kesalahan scene tidak merusak layout (loader tampil)

- [ ] **Step 7: Commit**

```bash
git add src/components/HeroSection.tsx
git commit -m "feat: replace MF logo with Spline 3D robot in HeroSection"
```

---

## Self-Review

**Spec coverage:**
- SplineScene component ✓ (Task 2)
- Spotlight adapted to motion/react ✓ (Task 3)
- Hapus logo MF + rings ✓ (Task 4)
- Info cards dipertahankan ✓ (Task 4)
- Panel dipertahankan, gradient dikurangi ✓ (Task 4)
- Mobile: robot render, spotlight off ✓ (Task 4 via `isTouchDevice`)
- cn() util ✓ (Task 1)
- Tidak install framer-motion / shadcn card ✓ (Global Constraints + Task 1)

**Placeholder scan:** Semua langkah punya kode konkret; tidak ada TBD/TODO.

**Type consistency:** `SplineScene({ scene, className })` konsisten dipakai di Task 4; `Spotlight({ className, size, springOptions })` konsisten; `cn() import { cn } from "@/lib/utils"` konsisten dipakai Spotlight.

**Catatan lint existing:** Project punya 3 error lint yang sudah ada sebelumnya (GradualBlur prefer-const, unescaped `'` di HeroSection & contact). Jangan "perbaiki" error tersebut di task ini — di luar scope Fase ini. `npm run build` bisa gagal karena react/no-unescaped-entities? — NO, error itu warning/error level eslint tapi Next build dengan eslint-config-next akan raise error pada lint saat build? — perlu cek: Next.js `next build` menjalankan lint otomatis dan GAGAL jika ada lint error. **Risiko blokir build.** Ini perlu dicek saat Task 4 Step 5; jika build gagal karena pre-existing lint errors, laporkan ke user (bukan perbaiki diam-diam karena di luar scope).