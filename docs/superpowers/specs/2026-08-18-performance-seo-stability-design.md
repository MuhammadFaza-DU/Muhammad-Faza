# Design: Performance, SEO & Metadata, Bug Stabilization

**Date:** 2026-08-18
**Status:** Approved (pending user spec review)
**Project:** muhammad-faza-portfolio (Next.js 16, Tailwind 4, Motion, Spline)

## Context

Portfolio personal Muhammad Faza — target audiens recruiter tech/startup dan klien
freelance. Site live di Vercel (`muhammadfaza.vercel.app`). Pengguna melaporkan
rasa lambat, dan belum ada SEO/metadata lengkap. Audit baseline dilakukan
2026-08-18: build lolos (0 error), lint 0 error / 10 warning, seluruh halaman
statis, `lang="id"` dengan konten 100% English, metadata hanya title+description
di root layout.

## Goals & Success Criteria

1. **Performa**: LCP terbaik yang bisa dicapai tanpa menghilangkan momen branding;
   payload aset turun signifikan (ukur byte sebelum/sesudah); tidak ada warning build.
2. **SEO**: metadata lengkap (root + per-page), sitemap, robots, JSON-LD, OpenGraph,
   social share image; `lang="en"`.
3. **Bug & stabilitas**: 0 lint warning, typo content fix, env bersih, keterbacaan
   teks membaik, 404/error boundary hadir.
4. **Security gate**: scan Strix sebelum deploy; temuan critical/high ditangani atau
   keputusan menerima risiko secara eksplisit.

## Phase 1 — Performance

### 1.1 Intro overlay (LCP blocker, `src/app/intro.tsx`)

Masalah: overlay hitam penuh ±1950ms menutupi konten setiap sesi baru → menahan
LCP. Tidak menghormati `prefers-reduced-motion`.

- Hormati `prefers-reduced-motion: reduce` → skip total (tidak render overlay).
- Persingkat total durasi: 1950ms → ±1100ms. Fade-out mulai lebih awal, animasi
  logo dipadatkan (pop ~0.5s, shine ~0.7s, fade-out ~0.35s).
- Tidak menghapus intro secara permanen — branding dipertahankan.

### 1.2 Spline 3D hero (`src/components/HeroSection.tsx`, `src/components/ui/splite.tsx`)

Keputusan user: **robot tetap tampil di semua device** (tidak di-skip).

- Tetap gunakan `React.lazy` untuk code-split engine.
- Defer pemuatan scene: tunggu hingga konten LCP selesai tampil + hero terlihat
  (`IntersectionObserver` pada container hero) → baru mount Spline.
  Selama belum dimuat, tampilkan fallback statis (loader/panel) yang tidak
  memblokir first paint.
- `prefers-reduced-motion`: robot tetap tampil, tapi animasi dibekukan
  (`app.setTimeScale(0)` setelah load) → frame statis.
- Tidak ada penurunan kualitas untuk mobile (sesuai keputusan user).

### 1.3 Optimasi aset (script Node + sharp)

Target sebelum/sesudah (byte turun):

| Aset | Ukuran sekarang | Target | Catatan |
|------|----------------|--------|---------|
| `public/assets/images/Foto Profil.png` | 374 KB | ~3-10 KB | Tampil 32px di navbar → webp 256px |
| `public/assets/icon/icon/mf_fix2.svg` | 499 KB | <50 KB | Minify/bersihkan (intro logo) |
| `public/assets/images/BG_Statis.webp` | 278 KB | ~120 KB | Background fix tiap halaman |
| `public/assets/images/FOTO TERKEREN.webp` | 267 KB | ~150 KB | Foto profile (HiringSection) |

- Foto profil → `next/image` (Navbar).
- `TiltPhoto` / `HiringSection` → `next/image` untuk foto.
- Ikon SVG kecil tetap `<img>` + eslint-disable per baris (terlalu kecil untuk
  `next/image` SVG yang butuh `dangerouslyAllowSVG`).
- Hapus aset tak terpakai (±390KB): `mf_fix.svg`, `mf.svg`, `sprite.svg`,
  `email.png`, `email.jpg`, `next.svg`, `vercel.svg`, `window.svg`, `globe.svg`,
  `file.svg` (verifikasi ulang via `git grep` sebelum hapus).

### 1.4 ConstellationBackground (`src/components/ConstellationBackground.tsx`)

- Jeda `requestAnimationFrame` saat `document.visibilityState !== "visible"`.
- DPR cap 1.5 untuk mobile (`width < 768`), 2 untuk desktop.

### 1.5 Konfigurasi build (`next.config.ts`)

- Set `turbopack.root` (root project) → hilangkan warning "workspace root inferred"
  yang disebabkan lockfile di folder parent (`WEB-PORTOFOLIO/package-lock.json`).

### 1.6 Font

- Keputusan user: **pertahankan 3 font** (Black Ops One, Chelsea Market, Playfair
  Display). Tidak ada perubahan.

### Verifikasi Fase 1

- `npm run build` sukses tanpa warning workspace root; catat ukuran bundle/aset
  sebelum vs sesudah.
- `npm run lint` tetap 0 error.
- Cek manual di browser: intro lebih pendek, robot muncul semua device, reduced-motion
  → robot statis & tanpa intro, animasi background jeda saat tab hidden.

## Phase 2 — SEO & Metadata

### 2.1 Root metadata (`src/app/layout.tsx`)

- `metadataBase: new URL("https://muhammadfaza.vercel.app")`
- `title.template = "%s | Muhammad Faza"` + default title "Muhammad Faza — Computer Engineer, AI Engineer, Embedded AI & Web Developer" (bahasa Inggris; fix typo "Portofolio").
- `description` English yang menarget recruiter/klien (hybrid hardware+software).
- `keywords`, `authors`, `creator`, `robots: { index, follow }`.
- `alternates.canonical: "/"`.
- `openGraph`: type `website`, `locale: "en_US"`, `url`, `siteName`, title, description, `images` (og.png).
- `twitter`: `card: "summary_large_image"`, title, description, image.
- `generator` tetap (Next.js) — tidak menghapus.

### 2.2 Metadata per halaman

Tambah `export const metadata` (atau `generateMetadata`) di:
- `/` (home): title "Muhammad Faza — Computer Engineer, AI Engineer, Embedded AI & Web Developer"; description ringkas peran + status terbuka kerja.
- `/project`: "Projects — Muhammad Faza"; description gallery proyek.
- `/skill`: "Skills — Muhammad Faza"; description skill matrix.
- `/contact`: "Contact — Muhammad Faza"; description channel kontak.

### 2.3 File baru

- `src/app/sitemap.ts` — daftar route statis (`/`, `/project`, `/skill`, `/contact`,
  `/resume`) + URL kanonik, lastModified.
- `src/app/robots.ts` — allow all + `Sitemap: <base>/sitemap.xml`.

### 2.4 JSON-LD structured data

- Di root layout: schema `Person` (name, url, jobTitle list, sameAs social,
  email) + `WebSite` (name, url).

### 2.5 Lainnya

- `lang="id"` → `lang="en"` di `<html>`.
- Generate **OG image** `public/og.png` 1200×630 (branded: dark background +
  emerald accents + logo/photo) via script Node + sharp.
- Generate **apple-touch-icon** `public/apple-touch-icon.png` 180×180 dari logo
  (SVG → PNG via sharp); update metadata `icons.apple`.

### Verifikasi Fase 2

- `npm run build` sukses; cek HTML output berisi meta description/OG/twitter,
  `<link rel="canonical">`, JSON-LD, dan `lang="en"`.
- `/sitemap.xml` dan `/robots.txt` merespons 200.

## Phase 3 — Bug & Stabilization

### 3.1 Lint warnings (10 → 0)

- Foto: konversi ke `next/image` (Navbar, TiltPhoto/HiringSection).
- Ikon SVG kecil: tetap `<img>` + `// eslint-disable-next-line @next/next/no-img-element`
  (baris foto saja; untuk ikon boleh aturan disable per file dengan komentar).
- `contact.tsx`: hapus import `Link` tak terpakai.
- `TargetCursor.tsx:264`: fix exhaustive-deps — salin `activeStrengthRef.current`
  ke variabel lokal di dalam effect sebelum dipakai di cleanup.

### 3.2 Typo

- `src/app/skill/skill.tsx:20` "Shoftware" → "Software".

### 3.3 Env bersih

- `.env`: hapus variabel `OPENAI_*` yang tidak terpakai di kode (sisa template).
- `.env.example`: kosongkan/update agar tidak menyesatkan.

### 3.4 Keterbacaan teks

- Hapus `p { text-align: justify }` global di `globals.css` (merusak keterbacaan
  dan spacing antar-kata). Terapkan justify hanya di paragraf deskripsi yang
  memang dimaksudkan (opsional via class).

### 3.5 Error handling

- Buat `src/app/not-found.tsx` (404 custom, selaras desain).
- Buat `src/app/error.tsx` (error boundary sederhana, tombol retry).

### Verifikasi Fase 3

- `npm run lint` → 0 warning, 0 error.
- `npm run build` sukses.
- Navigasi manual semua halaman; 404 route; tidak ada console error.

## Phase 4 — Security Gate (pre-deploy)

- Setelah Fase 1-3 stabil dan sebelum deploy, jalankan **security scan Strix**
  (sub-skill `software-engineering/security-testing`) pada target berizin:
  `https://muhammadfaza.vercel.app` (domain milik user).
- Konfirmasi biaya & estimasi ke user sebelum scan.
- Triage hasil: fix temuan critical/high (pakai skill fix-security-vulnerabilities),
  atau user memutuskan menerima risiko secara eksplisit.
- Output scan di `strix_runs/` (sudah di-ignore).
- Setelah scan selesai (mode lokal): `docker system prune -f`.

## Batas Lingkup (non-goals)

- Tidak menambah fitur baru (blog, form kontak, dark mode).
- Tidak mengganti desain visual / brand identity.
- Tidak men-drop font.
- Tidak menghapus Spline dari device mana pun.

## Risiko & Trade-offs

- Persingkat intro → kehilangan sebagian dramatisasi branding (dikompensasi
  dengan tetap ada, hanya lebih singkat).
- Defer Spline → robot muncul sedikit setelah hero teks (fallback statis selama
  menunggu). Disepakati user.
- Hapus aset tak terpakai → pastikan tidak dipakai (verifikasi `git grep` dulu).
