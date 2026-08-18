# "Living Surface" Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghidupkan UI/UX portfolio dengan animated constellation background, scroll-reveal motion, refined page transition, dan component depth polish — tanpa mengubah konten/layout/identitas visual.

**Architecture:** Tambah 2 komponen reusable (`ConstellationBackground` canvas + `Reveal` scroll wrapper), refine `PageTransition`, polish `globals.css` utilities (panel/btn/badge), integrasi Reveal ke semua halaman, dan Navbar hide-on-scroll. Semua motion hormati `prefers-reduced-motion`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS 4, Motion (`motion/react`), vanilla Canvas API. TIDAK ada dependency baru.

## Global Constraints

- TIDAK mengubah konten/data (teks, proyek, skill, sosial, resume).
- TIDAK mengubah identitas visual: warna emerald/sky (#34d399/#38bdf8), font, dark theme.
- TIDAK overhaul layout struktur (grid, breakpoint, container max-w-6xl).
- SEMUA motion hormati `prefers-reduced-motion` (static fallback).
- Constellation canvas: node count dibatasi mobile, pakai rAF, z-index di bawah konten.
- Robot Spline di HeroSection TIDAK disentuh.
- TIDAK ada unit test framework — verifikasi via `npm run lint` (0 errors) + `npm run build` (success).

---

### Task 1: ConstellationBackground component + integrasi layout

**Files:**
- Create: `src/components/ConstellationBackground.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (tambah canvas layer style)

**Interfaces:**
- Produces: `<ConstellationBackground />` — client component, fixed canvas layer, self-contained.

- [ ] **Step 1: Buat ConstellationBackground.tsx**

```tsx
"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number; hue: 0 | 1 };

export default function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const mouse = { x: -9999, y: -9999 };
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const LINK_DIST = 130;
    const REPEL_DIST = 110;

    let nodes: Node[] = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const isMobile = width < 768;
      const target = isMobile ? 34 : 72;
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.4 + 0.6,
        hue: Math.random() > 0.72 ? 1 : 0,
      }));
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const tick = () => {
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

    resize();
    tick();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="constellation-canvas" aria-hidden="true" />;
}
```

- [ ] **Step 2: Tambah style canvas di globals.css**

Tambahkan di akhir file:

```css
/* === Constellation background layer === */
.constellation-canvas {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
```

- [ ] **Step 3: Integrasi di layout.tsx**

Tambah import:
```tsx
import ConstellationBackground from "@/components/ConstellationBackground";
```

Di dalam `<body>`, tambahkan SETELAH `<ParallaxBackground />` dan SEBELUM `<GradualBlur>`:
```tsx
<ParallaxBackground />
<ConstellationBackground />
```

- [ ] **Step 4: Lint + build**

Run: `npm run lint` lalu `npm run build`
Expected: 0 errors, build success.

- [ ] **Step 5: Commit**

```bash
git add src/components/ConstellationBackground.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: add animated constellation network background"
```

---

### Task 2: Reveal component + PageTransition refine

**Files:**
- Create: `src/components/Reveal.tsx`
- Modify: `src/components/PageTransition.tsx`

**Interfaces:**
- Produces: `<Reveal delay={number?} className={string?}>children</Reveal>` — client wrapper scroll-reveal.
- Consumes: Motion `useReducedMotion`.

- [ ] **Step 1: Buat Reveal.tsx**

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
};

export default function Reveal({ children, delay = 0, className, y = 24 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Refine PageTransition.tsx (scale-pop → fade+slide)**

Ganti isi return motion.div:

```tsx
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
```

- [ ] **Step 3: Lint + build**

Run: `npm run lint` lalu `npm run build`
Expected: 0 errors, build success.

- [ ] **Step 4: Commit**

```bash
git add src/components/Reveal.tsx src/components/PageTransition.tsx
git commit -m "feat: add Reveal component and refine page transition"
```

---

### Task 3: globals.css component polish (panel, btn, badge)

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: style yang lebih depth/tactile untuk `.panel`, `.btn`, `.badge-accent`.

- [ ] **Step 1: Polish .panel — inner border highlight + layered shadow**

Ganti blok `.panel { ... }` menjadi:

```css
.panel {
  background: linear-gradient(180deg, rgba(18, 18, 24, 0.88), rgba(18, 18, 24, 0.72));
  border: 1px solid var(--stroke);
  box-shadow:
    0 18px 60px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

- [ ] **Step 2: Polish .btn — shine sweep + press state**

Ganti blok `.btn { ... }` dan `.btn:hover { ... }` menjadi:

```css
.btn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(24, 24, 27, 0.38);
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.btn::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.08) 48%, transparent 62%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
  pointer-events: none;
}

.btn:hover {
  border-color: rgba(52, 211, 153, 0.48);
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.55), 0 0 26px rgba(16, 185, 129, 0.14);
  transform: translateY(-1px);
}

.btn:hover::after {
  transform: translateX(100%);
}

.btn:active {
  transform: translateY(0) scale(0.98);
}
```

- [ ] **Step 3: Polish .badge-accent — glow saat hover**

Ganti blok `.badge-accent { ... }` menjadi:

```css
.badge-accent {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(52, 211, 153, 0.32);
  color: rgba(167, 243, 208, 0.96);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.badge-accent:hover {
  border-color: rgba(52, 211, 153, 0.55);
  box-shadow: 0 0 18px rgba(16, 185, 129, 0.22);
}
```

- [ ] **Step 4: Lint + build**

Run: `npm run lint` lalu `npm run build`
Expected: 0 errors, build success.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: polish panel/button/badge depth and micro-interactions"
```

---

### Task 4: Integrasi Reveal ke semua halaman

**Files:**
- Modify: `src/app/home.tsx`
- Modify: `src/app/project/project.tsx`
- Modify: `src/app/skill/skill.tsx`
- Modify: `src/app/contact/contact.tsx`

**Interfaces:**
- Consumes: `Reveal` dari `@/components/Reveal` (Task 2).

- [ ] **Step 1: home.tsx — wrap HeroSection, StatsSection, HiringSection**

```tsx
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import HiringSection from "@/components/HiringSection";
import Reveal from "@/components/Reveal";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <HeroSection />
      <Reveal>
        <StatsSection />
      </Reveal>
      <Reveal>
        <HiringSection />
      </Reveal>
    </div>
  );
}
```

- [ ] **Step 2: project.tsx — stagger reveal kartu**

Import `Reveal`, lalu wrap header section dengan `<Reveal>` dan ganti kartu map agar tiap kartu di-wrap `<Reveal delay={index * 0.08}>`.

Header section (yang berisi h1 "Project Gallery") → wrap dengan `<Reveal>`.

Pada bagian `filtered.map((p) => ( ... ))` → ubah jadi `filtered.map((p, i) => (<Reveal key={p.title} delay={i * 0.08}><a ...> ... </a></Reveal>))` (pindahkan key dari `<a>` ke `<Reveal>`).

- [ ] **Step 3: skill.tsx — wrap 2 kolom**

Import `Reveal`. Wrap section header (h1 "Skill Matrix") dengan `<Reveal>`. Wrap 2 kolom panel (hardware & software) masing-masing dengan `<Reveal delay={0.1}>` dan `<Reveal delay={0.2}>`.

- [ ] **Step 4: contact.tsx — wrap 2 kolom**

Import `Reveal`. Wrap section header (h1 "Let's Talk") dengan `<Reveal>`. Wrap 2 kolom (Social Profiles & Prefer channel) masing-masing dengan `<Reveal delay={0.1}>` dan `<Reveal delay={0.2}>`.

- [ ] **Step 5: Lint + build**

Run: `npm run lint` lalu `npm run build`
Expected: 0 errors, build success.

- [ ] **Step 6: Commit**

```bash
git add src/app/home.tsx src/app/project/project.tsx src/app/skill/skill.tsx src/app/contact/contact.tsx
git commit -m "feat: integrate scroll-reveal across pages"
```

---

### Task 5: Navbar hide on scroll down

**Files:**
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Consumes: Motion `useMotionValueEvent`, `useReducedMotion`, `useState`.

- [ ] **Step 1: Tambah import + state scroll direction**

Tambah `useMotionValueEvent` dan `useReducedMotion` ke import dari "motion/react", dan `useState` sudah ada.

Di dalam komponen Navbar, tambahkan:

```tsx
  const [hidden, setHidden] = useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (reduceMotion) return;
    const prev = scrollY.getPrevious() ?? 0;
    if (latest > prev && latest > 120) setHidden(true);
    else setHidden(false);
  });
```

Catatan: `useScroll()` sudah ada (untuk scrollYProgress) — tambahkan destructure `scrollY` dari hook yang sama: `const { scrollYProgress, scrollY } = useScroll();`

- [ ] **Step 2: Terapkan hidden ke header**

Ubah `<header className="sticky top-0 z-40">` menjadi motion header:

```tsx
    <motion.header
      className="sticky top-0 z-40"
      animate={{ y: hidden ? "-100%" : "0%" }}
  transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
>
```

Dan tutup `</motion.header>` di akhir (ganti `</header>`).

Tambahkan `motion`, `useMotionValueEvent`, dan `useReducedMotion` ke import: `import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";`

- [ ] **Step 3: Lint + build**

Run: `npm run lint` lalu `npm run build`
Expected: 0 errors, build success.

- [ ] **Step 4: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: hide navbar on scroll down, reveal on scroll up"
```

---

## Self-Review

**Spec coverage:**
- Section 1 Constellation ✓ (Task 1)
- Section 2 Reveal + PageTransition ✓ (Task 2)
- Section 2 scroll reveal ke semua halaman ✓ (Task 4)
- Section 3 panel/btn/badge polish ✓ (Task 3)
- Section 3 project card hover — sudah ada sebagian, diperkuat btn/panel CSS (Task 3)
- Section 3 Navbar hide on scroll ✓ (Task 5)
- prefers-reduced-motion ✓ (Task 1, 2)
- Mobile node count ✓ (Task 1)
- TIDAK ada dependency baru ✓ (semua pakai Motion + Canvas)

**Placeholder scan:** Semua step punya kode konkret, tidak ada TBD.

**Type consistency:** `Reveal` props `{children, delay?, className?, y?}` konsisten dipakai di Task 4. `ConstellationBackground` tanpa props. PageTransition refine konsisten.

**Catatan:** Skill/skill.tsx memakai data dari skillsData (static). Contact/contact.tsx punya unused `Link` import (warning pre-existing) — tidak disentuh. Project/project.tsx pakai motion AnimatePresence — Reveal wrapper akan di dalam motion.div, pastikan tidak konflik. Implementer harus verifikasi kartu tetap muncul dengan benar (AnimatePresence + Reveal).
