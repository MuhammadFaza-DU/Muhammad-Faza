<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="Muhammad Faza MF monogram" />
</p>

<h1 align="center">Muhammad Faza · Portfolio</h1>

<p align="center">
  AI, Software, &amp; Embedded Systems
</p>

<p align="center">
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Astro-171717?style=flat&amp;logo=astro&amp;logoColor=white" alt="Astro" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-171717?style=flat&amp;logo=react&amp;logoColor=61DAFB" alt="React" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-171717?style=flat&amp;logo=typescript&amp;logoColor=3178C6" alt="TypeScript" /></a>
  <a href="https://www.cloudflare.com/"><img src="https://img.shields.io/badge/Cloudflare-171717?style=flat&amp;logo=cloudflare&amp;logoColor=F38020" alt="Cloudflare" /></a>
</p>

I built this portfolio to bring my software projects and embedded-system work
into one place. Each project has its own context, source or demo links where
available, and genuine screenshots or implementation evidence.

The current application is V2: a static Astro site with React islands for the
interactive components. The original Next.js version remains in a frozen archive.

**Live portfolio:** [mfazaa.my.id](https://mfazaa.my.id/)

Hosted on Cloudflare Pages, with HTTPS and a redirect from the stable
`pages.dev` address to the production domain.

## What is inside

- Complete Indonesian and English routes, with a language switcher and light/dark themes.
- An interactive Lanyard card, portrait reveal with orbiting tools, and a skill explanation panel.
- Five featured projects presented with ScrollStack, plus a searchable catalog of eleven projects.
- Project detail pages with implementation notes, genuine media, status, and available demo/source links.
- Persistent project comments backed by a separate Cloudflare Worker and D1 database, with Turnstile validation.
- A Contact form using Formspree, direct social links, and a downloadable resume.

The catalog distinguishes ongoing work, prototypes, and published versions.
A public repository or demo link is not presented as proof that every project
is complete or exclusively authored by me.

## Stack

| Layer | Technology |
| --- | --- |
| Static pages and routing | Astro 7.4.12 |
| Interactive islands | React 19.2.4 and Three.js |
| Language and styling | TypeScript, plain CSS, and Archivo |
| Frontend hosting | Cloudflare Pages |
| Comments | Cloudflare Workers, D1, and Turnstile |
| Contact delivery | Formspree |
| Checks | Node test runner, ESLint, Astro check, and TypeScript |

## Run locally

Use Node.js **22.23.4 or newer** and npm. Dependencies are pinned through
`package-lock.json`.

```sh
npm ci
```

Copy `.env.example` to `.env.local` and set the two public frontend values:

```dotenv
PUBLIC_PROJECT_COMMENTS_API_URL=https://your-comments-worker.example
PUBLIC_TURNSTILE_SITE_KEY=your-public-turnstile-site-key
```

```sh
npm run dev
```

Astro serves the application locally. Use `/id/` for Indonesian and `/en/`
for English. The root route selects a language using the visitor's preference.

The comments API is a separate service:

```sh
npm run comments:dev
```

Local backend tests use an isolated workerd/D1 instance and synthetic challenge
fixtures. Running them does not require creating real public comments.

## Verify a release

Build before running the full unit suite because some tests inspect `dist/`.

```sh
npm run lint
npm run typecheck
npm run build
npm test
npm run comments:test:local
node scripts/verify-relocation.mjs --active-only
npm run check:release-secrets
```

To review the production build locally:

```sh
npm run start -- --host 127.0.0.1 --port 4321
```

Browser regression checks live in `scripts/browser/`. Test results describe the
environment actually exercised, not a guarantee about every browser or device.

## Project structure

```text
src/                   Pages, layouts, components, content, and client code
public/                Curated assets and Pages deployment controls
services/comments/     Comments Worker, D1 migrations, and local fixtures
scripts/tests/         Behavioral, asset, configuration, and build-output tests
scripts/browser/       Browser regression checks
docs/v2/assets/        Asset provenance and build-time media manifests
assets/masters/        Source artwork and captures, outside the served output
```

The media manifests in `docs/v2/assets/` are required build inputs. Keep them
when preparing a build or a sanitized source copy.

This public repository contains the active V2 source. Historical V1 snapshots,
internal working notes, and raw diagnostics stay in the local maintainer
workspace. Archive-preservation checks are separate from `--active-only`
verification and are not claimed for this public export.
The unit suite reports three archive-dependent checks as skipped when those
local snapshots are absent. Active application checks still run.

## Deployment and credentials

Publish **only `dist/`** to Cloudflare Pages. Do not upload the repository root,
archives, master assets, or environment files.

The frontend's API URL and Turnstile site key are public identifiers included
in the browser bundle. `TURNSTILE_SECRET` and `ABUSE_HASH_SALT` belong only in
Worker secret bindings, or ignored `services/comments/.dev.vars` for local tests.
Never give a private credential a `PUBLIC_` prefix.

When changing the frontend hostname, update the canonical site URL, Worker
allowed origins/hostnames, and Turnstile widget hostnames together. Rebuild the
frontend after changing public environment values. Keep origin matching exact,
rather than allowing arbitrary preview domains.

`check:release-secrets` compares private project values locally against the
working source, public/build output, index, and reachable Git history. It emits
redacted findings and fails closed on unsupported environment syntax. It cannot
verify secrets that are unavailable locally.

Third-party font, icon, and component notices are preserved under
[`public/licenses/`](public/licenses/). Personal imagery and project evidence
are not generic placeholder assets.
