# Graph Report - muhammad-faza-portfolio  (2026-08-18)

## Corpus Check
- 42 files · ~51,490 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 216 nodes · 222 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3c691d85`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layout.tsx
- compilerOptions
- project.tsx
- devDependencies
- home.tsx
- dependencies
- include
- GradualBlur.tsx
- package.json
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
- TargetCursor.tsx

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Design: "Living Surface" — Polish UI/UX` - 9 edges
3. `include` - 7 edges
4. `Design: Spline 3D Robot di HeroSection` - 7 edges
5. `Global Constraints` - 6 edges
6. `Global Constraints` - 6 edges
7. `scripts` - 5 edges
8. `HeroSection()` - 4 edges
9. `lib` - 4 edges
10. `TargetCursor()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Spotlight()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/spotlight.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (24 total, 4 thin omitted)

### Community 0 - "layout.tsx"
Cohesion: 0.09
Nodes (8): blackOpsOne, chelseaMarket, metadata, playfair, ConstellationBackground(), Node, SOCIALS, NAV

### Community 1 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 2 - "project.tsx"
Cohesion: 0.15
Nodes (9): Filter, FILTERS, ProjectPage(), SkillPage(), Project, ProjectLinkType, projectsData, SkillCategory (+1 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 4 - "home.tsx"
Cohesion: 0.14
Nodes (6): ContactPage(), SOCIAL, HomePage(), RevealProps, TiltPhoto(), TiltPhotoProps

### Community 5 - "dependencies"
Cohesion: 0.11
Nodes (19): clsx, gsap, motion, next, dependencies, clsx, gsap, motion (+11 more)

### Community 6 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 7 - "GradualBlur.tsx"
Cohesion: 0.22
Nodes (9): CURVE_FUNCTIONS, CurveName, DEFAULT_CONFIG, getGradientDirection(), GradualBlur(), GradualBlurProps, Position, PresetConfig (+1 more)

### Community 8 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

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

### Community 24 - "TargetCursor.tsx"
Cohesion: 0.60
Nodes (4): getContainingBlock(), getContainingBlockOffset(), TargetCursor(), TargetCursorProps

## Knowledge Gaps
- **105 isolated node(s):** `NAV`, `SOCIAL`, `Filter`, `FILTERS`, `RevealProps` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `include`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `NAV`, `SOCIAL`, `Filter` to the rest of the system?**
  _105 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `layout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `project.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._