# Resume, Favicon, and Browser Title Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the supplied resume PDF and make the resume viewer use the requested `Resume Muhammad Faza` title while retaining the existing `M` favicon across the site.

**Architecture:** Keep the existing `/resume` HTML wrapper and static asset path. Replace the PDF at the path already consumed by the hero, contact page, and iframe route; update only the route's document and iframe titles. Verify the existing global favicon metadata instead of introducing a second icon system.

**Tech Stack:** Next.js 16.3.1, TypeScript, static assets, PowerShell, npm scripts.

## Global Constraints

- Replace `public/assets/documents/Resume.pdf` with `C:\Users\LENOVO\Downloads\Resume or CV.pdf`.
- Keep `public/favicon.svg`, which already matches the requested black square with white `M`.
- Use the exact resume title `Resume Muhammad Faza`.
- Do not change the resume URL or download filename.
- Do not modify unrelated tracked worktree changes.

---

### Task 1: Replace the Published Resume Asset

**Files:**
- Modify: `public/assets/documents/Resume.pdf`

**Interfaces:**
- Consumes: `C:\Users\LENOVO\Downloads\Resume or CV.pdf`.
- Produces: The same public asset path consumed by `src/app/resume/route.ts`, `src/components/HeroSection.tsx`, and `src/app/contact/contact.tsx`.

- [ ] **Step 1: Confirm the source and destination files exist**

Run:

```powershell
Test-Path -LiteralPath "C:\Users\LENOVO\Downloads\Resume or CV.pdf"
Test-Path -LiteralPath "public\assets\documents\Resume.pdf"
```

Expected: both commands return `True`.

- [ ] **Step 2: Record source metadata before copying**

Run:

```powershell
Get-FileHash -LiteralPath "C:\Users\LENOVO\Downloads\Resume or CV.pdf" -Algorithm SHA256
Get-Item -LiteralPath "C:\Users\LENOVO\Downloads\Resume or CV.pdf" | Select-Object Length
```

Expected: a SHA256 hash and source byte length are captured for comparison after the copy.

- [ ] **Step 3: Copy the source PDF over the existing public asset**

Run:

```powershell
Copy-Item -LiteralPath "C:\Users\LENOVO\Downloads\Resume or CV.pdf" -Destination "public\assets\documents\Resume.pdf" -Force
```

Expected: the destination is replaced without changing its URL.

- [ ] **Step 4: Verify the copied bytes match the source**

Run:

```powershell
Get-FileHash -LiteralPath "public\assets\documents\Resume.pdf" -Algorithm SHA256
Get-Item -LiteralPath "public\assets\documents\Resume.pdf" | Select-Object Length
```

Expected: destination SHA256 and length exactly match the source values.

### Task 2: Update Resume Viewer Titles

**Files:**
- Modify: `src/app/resume/route.ts:1-27`

**Interfaces:**
- Consumes: The existing static resume asset at `/assets/documents/Resume.pdf`.
- Produces: An HTML resume viewer whose document title and iframe title are both `Resume Muhammad Faza` and whose favicon remains `/favicon.svg`.

- [ ] **Step 1: Update the two route title strings**

Change the route wrapper to contain:

```html
<title>Resume Muhammad Faza</title>
<iframe src="/assets/documents/Resume.pdf" title="Resume Muhammad Faza"></iframe>
```

Keep this existing favicon reference unchanged:

```html
<link rel="icon" href="/favicon.svg" />
```

- [ ] **Step 2: Verify the route source contains the exact metadata**

Run:

```powershell
rg -n "Resume Muhammad Faza|favicon\.svg|assets/documents/Resume\.pdf" "src/app/resume/route.ts"
```

Expected: the exact title appears twice, the favicon path appears once, and the existing PDF path appears once.

### Task 3: Run Project Verification

**Files:**
- Verify: `src/app/layout.tsx`
- Verify: `src/app/resume/route.ts`
- Verify: `public/favicon.svg`
- Verify: `public/assets/documents/Resume.pdf`

**Interfaces:**
- Consumes: Tasks 1 and 2 outputs.
- Produces: Evidence that the requested asset and metadata are valid and the Next.js project remains buildable.

- [ ] **Step 1: Confirm the global favicon metadata remains correct**

Run:

```powershell
rg -n "icons:|favicon\.svg|apple-touch-icon" "src/app/layout.tsx"
```

Expected: the global metadata continues to point to `/favicon.svg` for `icon` and `shortcut`.

- [ ] **Step 2: Run lint**

Run:

```powershell
npm run lint
```

Expected: exit code `0` with no lint errors.

- [ ] **Step 3: Run the production build**

Run:

```powershell
npm run build
```

Expected: exit code `0` and a successful Next.js production build.

- [ ] **Step 4: Inspect the final worktree scope**

Run:

```powershell
git diff --stat -- src/app/resume/route.ts public/assets/documents/Resume.pdf
```

Expected: only the intended route and PDF changes are attributable to this task; pre-existing graph changes remain untouched.
