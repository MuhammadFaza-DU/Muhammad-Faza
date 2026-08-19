# Graph Report - muhammad-faza-portfolio  (2026-08-18)

## Corpus Check
- 49 files · ~28,897 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 279 nodes · 275 edges · 32 communities (27 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3b50d0d3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layout.tsx
- compilerOptions
- home.tsx
- devDependencies
- Global Constraints
- dependencies
- Phase 1 — Performance
- package.json
- Design: Performance, SEO & Metadata, Bug Stabilization
- Global Constraints
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- Design: Spline 3D Robot di HeroSection
- 🚀 Personal Portfolio — Muhammad Faza
- AGENTS.md
- HeroSection.tsx
- Design: "Living Surface" — Polish UI/UX
- Global Constraints
- generate-assets.mjs
- contact.tsx
- include
- Project Card Editorial Rail Design
- Global Constraints

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Global Constraints` - 14 edges
3. `Design: Performance, SEO & Metadata, Bug Stabilization` - 9 edges
4. `Design: "Living Surface" — Polish UI/UX` - 9 edges
5. `Phase 1 — Performance` - 8 edges
6. `Phase 2 — SEO & Metadata` - 7 edges
7. `Phase 3 — Bug & Stabilization` - 7 edges
8. `include` - 7 edges
9. `Design: Spline 3D Robot di HeroSection` - 7 edges
10. `Global Constraints` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Spotlight()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/spotlight.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (32 total, 5 thin omitted)

### Community 0 - "layout.tsx"
Cohesion: 0.09
Nodes (12): blackOpsOne, chelseaMarket, metadata, playfair, Node, SOCIALS, NAV, PageTransition() (+4 more)

### Community 1 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 2 - "home.tsx"
Cohesion: 0.08
Nodes (15): metadata, metadata, Filter, FILTERS, metadata, HiringSection(), Reveal(), RevealProps (+7 more)

### Community 3 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, sharp, tailwindcss, @tailwindcss/postcss (+11 more)

### Community 4 - "Global Constraints"
Cohesion: 0.12
Nodes (16): Global Constraints, Performance, SEO & Stability Implementation Plan, Self-Review Notes, Task 10: Clear lint warnings, Task 11: Typo, env cleanup, text readability, Task 12: Custom 404 and error boundary, Task 13: Security gate — pre-deploy Strix scan (no code), Task 1: Shorten intro overlay + respect prefers-reduced-motion (+8 more)

### Community 5 - "dependencies"
Cohesion: 0.11
Nodes (19): clsx, gsap, motion, next, dependencies, clsx, gsap, motion (+11 more)

### Community 7 - "Phase 1 — Performance"
Cohesion: 0.25
Nodes (8): 1.1 Intro overlay (LCP blocker, `src/app/intro.tsx`), 1.2 Spline 3D hero (`src/components/HeroSection.tsx`, `src/components/ui/splite.tsx`), 1.3 Optimasi aset (script Node + sharp), 1.4 ConstellationBackground (`src/components/ConstellationBackground.tsx`), 1.5 Konfigurasi build (`next.config.ts`), 1.6 Font, Phase 1 — Performance, Verifikasi Fase 1

### Community 8 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 9 - "Design: Performance, SEO & Metadata, Bug Stabilization"
Cohesion: 0.10
Nodes (20): 2.1 Root metadata (`src/app/layout.tsx`), 2.2 Metadata per halaman, 2.3 File baru, 2.4 JSON-LD structured data, 2.5 Lainnya, 3.1 Lint warnings (10 → 0), 3.2 Typo, 3.3 Env bersih (+12 more)

### Community 10 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Self-Review, Spline 3D Robot di HeroSection — Implementation Plan, Task 0: Fix lint error pre-existing (blokir build), Task 1: Install dependencies + setup lib/utils, Task 2: Buat `SplineScene` component, Task 3: Buat `Spotlight` component (diadaptasi Motion), Task 4: Edit HeroSection — ganti logo MF dengan Spline robot

### Community 18 - "Design: Spline 3D Robot di HeroSection"
Cohesion: 0.25
Nodes (7): Constraints (dari diskusi), Dependencies baru, Design: Spline 3D Robot di HeroSection, File yang diubah/dibuat, Goal, Out of Scope (Fase ini), Perilaku yang diharapkan

### Community 19 - "🚀 Personal Portfolio — Muhammad Faza"
Cohesion: 0.50
Nodes (3): 🚀 Personal Portfolio — Muhammad Faza, 📂 Project Structure, 🛠️ Tech Stack & Architecture

### Community 21 - "HeroSection.tsx"
Cohesion: 0.22
Nodes (10): getServerSnapshot(), getSnapshot(), HeroSection(), subscribe(), Spline, SplineScene(), SplineSceneProps, Spotlight() (+2 more)

### Community 22 - "Design: "Living Surface" — Polish UI/UX"
Cohesion: 0.20
Nodes (9): Approach: A — "Living Surface", Constraints, Design: "Living Surface" — Polish UI/UX, File yang dibuat/diubah (ringkas), Out of Scope, Problem Statement, Section 1 — Background: Constellation Network, Section 2 — Motion System (+1 more)

### Community 23 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, "Living Surface" Polish Implementation Plan, Self-Review, Task 1: ConstellationBackground component + integrasi layout, Task 2: Reveal component + PageTransition refine, Task 3: globals.css component polish (panel, btn, badge), Task 4: Integrasi Reveal ke semua halaman, Task 5: Navbar hide on scroll down

### Community 24 - "generate-assets.mjs"
Cohesion: 0.33
Nodes (3): logoFromSource, mfSvgPath, root

### Community 29 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 30 - "Project Card Editorial Rail Design"
Cohesion: 0.40
Nodes (4): Behavior, Direction, Project Card Editorial Rail Design, Visual Rules

### Community 31 - "Global Constraints"
Cohesion: 0.50
Nodes (3): Global Constraints, Project Card Editorial Rail Implementation Plan, Task 1: Editorial Rail Project Cards

## Knowledge Gaps
- **148 isolated node(s):** `Task 1: Editorial Rail Project Cards`, `Direction`, `Behavior`, `Visual Rules`, `blackOpsOne` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `include`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `Task 1: Editorial Rail Project Cards`, `Direction`, `Behavior` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `layout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08615384615384615 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0784313725490196 - nodes in this community are weakly interconnected._