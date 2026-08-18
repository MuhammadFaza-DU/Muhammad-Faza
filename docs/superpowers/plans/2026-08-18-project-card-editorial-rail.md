# Project Card Editorial Rail Implementation Plan

> **For agentic workers:** Implement the single task below with the existing frontend patterns and verify before completion.

**Goal:** Replace the loose project grid cards with compact, aligned Editorial Rail cards that remain readable over the constellation background.

**Architecture:** Modify only the project gallery component. Keep project data, filters, links, reveal animation, and responsive grid intact; change the card's internal layout and utility classes.

**Tech Stack:** Next.js 16.3.1, React, Motion, Tailwind CSS v4.

## Global Constraints

- Preserve all existing project copy and external URLs.
- Do not add dependencies.
- Keep `prefers-reduced-motion` behavior supplied by existing `Reveal` and Motion components.
- Keep the grid at one column on mobile, two columns from `sm`, and three columns from `lg`.
- Verify `npm run lint` and `npm run build`.

### Task 1: Editorial Rail Project Cards

**Files:**
- Modify: `src/app/project/project.tsx:77-114`

- [ ] Replace the card anchor classes with a compact flex column:

```tsx
className="panel group relative flex min-h-[340px] cursor-target flex-col overflow-hidden rounded-2xl border-white/10 p-5 transition duration-200 hover:-translate-y-1 hover:border-emerald-400/35"
```

- [ ] Add the emerald rail as the first child of the anchor:

```tsx
<span
  aria-hidden="true"
  className="absolute inset-y-0 left-0 w-0.5 bg-emerald-400/55 transition-colors duration-200 group-hover:bg-emerald-300"
 />
```

- [ ] Keep the existing tag/title/icon row, but reduce the icon wrapper to `h-9 w-9 rounded-xl` and the icon to `h-4 w-4`.
- [ ] Change the description to `mt-5 line-clamp-4 max-w-[34ch] text-sm leading-6 text-zinc-300/90`.
- [ ] Change the badge row to `mt-auto flex min-h-8 flex-wrap gap-2 pt-6` so badges align toward the card bottom without forcing mobile overflow.
- [ ] Keep the existing SVG icon source and lint suppression unchanged.

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Review the card at desktop and mobile widths; confirm no title/description overlap and filters still switch cards.

- [ ] Commit:

```bash
git add src/app/project/project.tsx
git commit -m "refine: align project cards with editorial rail layout"
```
