# Design: Spline 3D Robot di HeroSection

**Tanggal:** 2026-08-18
**Status:** Disetujui user
**Scope:** Fase 1 — kualitas teknis (integrasi 3D), bukan redesign menyeluruh.

## Goal

Ganti badge logo MF + spinning rings di panel kiri HeroSection dengan scene Spline 3D (robot), sambil mempertahankan identitas visual site (panel, warna emerald/sky, info cards) dan konten/data yang ada.

## Constraints (dari diskusi)

- **TIDAK mengubah** konten/data (teks, project, skill, sosial, resume).
- **TIDAK mengubah** identitas visual: warna emerald/sky, font (Black Ops One, Chelsea Market, Playfair), treatment `.panel`.
- **Logo MF + rings dihapus** dari HeroSection.
- **Info cards** (ENV / EXPERTISE / STATUS) **tetap** di bawah robot, ukuran robot disesuaikan.
- **Panel kiri dipertahankan** sebagai container robot (bukan full-bleed).
- **Mobile:** robot 3D tetap render; **hanya spotlight/hover-effect yang dimatikan** (touch device tidak punya cursor). Bukan fallback gambar statis.
- Scene URL: pakai demo `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode` untuk testing; API component menerima scene string, ganti URL nanti tanpa refactor.

## File yang diubah/dibuat

1. **`src/lib/utils.ts`** (baru) — helper `cn()` memakai `clsx` + `tailwind-merge`. Path alias `@/*` → `./src/*` sudah ada di tsconfig, jadi `@/lib/utils` valid.

2. **`src/components/ui/splite.tsx`** (baru) — `SplineScene`:
   - `"use client"`, lazy-load `@splinetool/react-spline` via `Suspense`.
   - Props: `scene: string`, `className?: string`.
   - Fallback loader saat scene dimuat.

3. **`src/components/ui/spotlight.tsx`** (baru) — `Spotlight`:
   - **Import diadaptasi dari `framer-motion` → `motion/react`** (project sudah pakai `motion`; TIDAK install framer-motion duplikat — API identik).
   - Hooks: `useRef`, `useState`, `useCallback`, `useEffect`; `motion`, `useSpring`, `useTransform`, `SpringOptions` dari `motion/react`.
   - Parent element di-set `position: relative; overflow: hidden` (seperti referensi).
   - Interaksi mouseenter/mousemove/mouseleave — hanya aktif di pointer-fine.

4. **`src/components/HeroSection.tsx`** (edit):
   - Hapus: `pulse-glow`, `spin-ring-emerald`, `spin-ring-sky`, hairline ring, badge logo MF (`mf_fix2.svg`), `.float` container.
   - Tambah: `SplineScene` (demo URL) dalam slot yang menggantikan badge, `Spotlight`, dan deteksi touch/pointer-fine.
   - Gradient overlay panel kiri (`bg-linear-to-br from-emerald-500/10 via-transparent to-sky-400/10`) dikurangi efeknya di area robot supaya jelas.
   - Info cards (ENV/EXPERTISE/STATUS) tetap, grid `sm:grid-cols-3` dipertahankan.
   - Robot: aspect-ratio + ukuran responsif mengikuti container (portrait, mengisi area bekas badge).
   - Fallback Scene error → tidak merusak panel (space kosong / loader).

## Dependencies baru

- `@splinetool/react-spline` (+ peer `@splinetool/runtime`)
- `clsx`, `tailwind-merge`

TIDAK install: `framer-motion` (pakai `motion` yang sudah ada), `shadcn/card` (pakai `.panel` yang sudah ada).

## Perilaku yang diharapkan

- **Desktop:** robot 3D interaktif + spotlight mengikuti cursor di dalam panel.
- **Mobile/touch:** robot 3D render statis (spotlight & hover mati).
- **Loader:** tampil saat scene Spline fetch; jika gagal, elemen tidak merusak layout panel.

## Out of Scope (Fase ini)

- SEO/perf/a11y pass menyeluruh (lint error, `<img>` → next/image, hapus GlitchOverlay) — masuk fase lanjutan.
- Typo "Shoftware" di skill pages — fase lanjutan (konten/data, perlu izin).
- Redesign visual lain.