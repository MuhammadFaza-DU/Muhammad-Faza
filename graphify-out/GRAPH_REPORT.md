# Graph Report - .  (2026-08-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 148 nodes · 160 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 1,852 input · 0 output

## Graph Freshness
- Built from commit: `f86b72f8`
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
- contact.tsx
- TargetCursor.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `include` - 7 edges
3. `scripts` - 5 edges
4. `TargetCursor()` - 4 edges
5. `lib` - 4 edges
6. `GradualBlur()` - 3 edges
7. `Navbar()` - 3 edges
8. `projectsData` - 3 edges
9. `skillsData` - 3 edges
10. `gsap` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (18 total, 4 thin omitted)

### Community 0 - "layout.tsx"
Cohesion: 0.13
Nodes (11): Intro(), blackOpsOne, chelseaMarket, metadata, playfair, Footer(), SOCIALS, NAV (+3 more)

### Community 1 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 2 - "project.tsx"
Cohesion: 0.16
Nodes (9): Filter, FILTERS, ProjectPage(), SkillPage(), Project, ProjectLinkType, projectsData, SkillCategory (+1 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 4 - "home.tsx"
Cohesion: 0.23
Nodes (6): HomePage(), HeroSection(), HiringSection(), StatsSection(), TiltPhoto(), TiltPhotoProps

### Community 5 - "dependencies"
Cohesion: 0.18
Nodes (11): gsap, motion, next, dependencies, gsap, motion, next, react (+3 more)

### Community 6 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 7 - "GradualBlur.tsx"
Cohesion: 0.22
Nodes (9): CURVE_FUNCTIONS, CurveName, DEFAULT_CONFIG, getGradientDirection(), GradualBlur(), GradualBlurProps, Position, PresetConfig (+1 more)

### Community 8 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 10 - "TargetCursor.tsx"
Cohesion: 0.60
Nodes (4): getContainingBlock(), getContainingBlockOffset(), TargetCursor(), TargetCursorProps

## Knowledge Gaps
- **66 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `include`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `layout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13157894736842105 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._