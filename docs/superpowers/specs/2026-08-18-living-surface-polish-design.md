# Design: "Living Surface" — Polish UI/UX

**Tanggal:** 2026-08-18
**Status:** Disetujui user (3 section approved)
**Arah:** Polished sci-fi — tetap identitas emerald/dark, fokus menghidupkan yang statis. Bukan overhaul visual, tapi polish motion/komponen/background.

## Problem Statement

User merasa UI/UX "kurang banget": motion, komponen, BG, efek kurang menarik. Akar masalah terkuat: **kurang hidup/dinamis**. Latar statis, konten muncul sekaligus, komponen terasa flat.

## Approach: A — "Living Surface"

Tambahkan animated constellation network di background, scroll-reveal di semua section, page transition yang lebih halus, dan hover micro-interaction yang lebih responsif. Tanpa mengubah konten/data, layout struktur, atau identitas visual (warna emerald, font, dark theme).

## Constraints

- TIDAK mengubah konten/data (teks, proyek, skill, sosial, resume).
- TIDAK mengubah identitas visual (warna emerald/sky, font Black Ops One/Chelsea/Playfair, dark theme).
- TIDAK overhaul layout — polish di atas struktur yang ada.
- `prefers-reduced-motion` WAJIB dihormati di semua motion baru.
- Performa: constellation canvas dibatasi node count di mobile, gunakan rAF, jangan ganggu scroll.
- Robot Spline di HeroSection tetap — polish di sekitarnya saja.

## Section 1 — Background: Constellation Network

**Rencana:** Tambah layer animated constellation network via `<canvas>` custom (vanilla TS, tanpa library baru).

- ~60–90 node titik kecil bergerak pelan, terhubung garis tipis saat berdekatan (seperti referensi user: jaringan konstelasi).
- Warna node/garis: emerald (#34d399) + sky (#38bdf8), opacity rendah supaya subtle.
- Interaksi: node bereaksi halus ke posisi cursor (repel lembut / avoid radius kecil).
- `prefers-reduced-motion` → static (hanya background image).
- Mobile: node count dibatasi (~30-40) untuk performa.
- Layer ditaruh di atas ParallaxBackground (atau menggantikan bagian jaringan), di bawah konten (z-index tepat).

**File baru:** `src/components/ConstellationBackground.tsx` (client component, self-contained).

## Section 2 — Motion System

**Rencana:**

1. **Scroll reveal** — komponen `Reveal` reusable pakai Motion `whileInView`:
   - Fade in + slide up 24px, duration 0.6s, ease-out.
   - `viewport={{ once: true, amount: 0.3 }}`.
   - Stagger untuk item list (delay 60-80ms per item).
   - Terapkan di section utama: Hero, Stats, Hiring (home) + Project, Skill, Contact.

2. **Page transition** — refine dari scale-pop ke fade + subtle y-slide:
   - Dari `initial={{ opacity: 0, scale: 0.94 }}` → `initial={{ opacity: 0, y: 20 }}`.
   - Lebih premium, tidak "zoom".

3. **Section stagger** — project cards, skill badges muncul berurutan.

**File baru:** `src/components/Reveal.tsx` (reusable wrapper).
**File diubah:** `src/components/PageTransition.tsx`.

## Section 3 — Component Polish

**Rencana:**

1. **Panel/cards** — inner border highlight + layered shadow:
   - Tambah `border-t border-white/8` untuk highlight atas (depth fisik).
   - Layered shadow: outer soft shadow + subtle inner glow.

2. **Buttons** — hover shine sweep + press state:
   - Shine sweep: gradient geser saat hover.
   - `:active` scale 0.98 (tactile).

3. **Badges** — glow tipis emerald saat hover (accent badges).

4. **Project cards** — hover lift + border highlight ke emerald.

5. **Navbar** — hide saat scroll down, muncul saat scroll up.

**File diubah:** `src/app/globals.css` (panel, btn, badge utilities), `src/components/Navbar.tsx`, `src/app/project/project.tsx`.

## File yang dibuat/diubah (ringkas)

**Baru:**
- `src/components/ConstellationBackground.tsx`
- `src/components/Reveal.tsx`

**Diubah:**
- `src/app/globals.css` (constellation layer styles, panel/btn/badge polish)
- `src/app/layout.tsx` (integrasi ConstellationBackground)
- `src/components/PageTransition.tsx`
- `src/components/Navbar.tsx` (hide on scroll)
- `src/app/home.tsx` (Reveal wrappers)
- `src/app/project/project.tsx` (stagger reveal)
- `src/app/skill/skill.tsx` (Reveal wrappers)
- `src/app/contact/contact.tsx` (Reveal wrappers)

## Out of Scope

- Mengubah konten/data (teks, proyek, skill).
- Mengubah layout struktur (grid, breakpoint).
- Mengubah warna/font/theme.
- Overhaul navbar/sidebar.
- Menghapus robot Spline.
- Fase 1 SEO/perf/a11y (sudah di fase lain).