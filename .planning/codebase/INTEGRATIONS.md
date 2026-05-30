# External Integrations

**Analysis Date:** 2026-05-30

## APIs & External Services

**Image CDN:**
- Amazon CloudFront — serves static background images (hero banner, body composition, performance, mobility backgrounds) used in `client/src/pages/Home.tsx` and `client/src/pages/Relatorio.tsx`
  - Base URL: `https://d2xsxph8kpxj0f.cloudfront.net/`
  - Usage: `<img>` and CSS `backgroundImage` — read-only, no auth required
  - Assets: `hero-banner-*.webp`, `body-composition-bg-*.webp`, `performance-bg-*.webp`, `mobility-bg-*.webp`
  - Note: These URLs are hardcoded constants at the top of `Home.tsx` and `Relatorio.tsx`. The PDF export pipeline strips external `https://` `background-image` URLs before canvas capture to avoid CORS issues (`client/src/lib/pdf.ts`, line 79).

## Data Storage

**Databases:**
- None — no backend database

**Browser Storage:**
- localStorage — draft persistence under key `avaliacao_fisica_rascunho`
  - Implementation: `client/src/lib/storage.ts`
  - Functions: `salvarRascunho()`, `carregarRascunho()`, `limparRascunho()`
  - Stores the full `formData` object (including base64 image strings) as JSON
  - Silent failure on quota exceeded (common when images are large)
  - Typical limit: 5–10 MB per origin; photos encoded as base64 can push this

**File Storage:**
- Local filesystem (via browser download) — exported PDFs are downloaded to the user's device via `URL.createObjectURL` + `<a download>` in `client/src/lib/pdf.ts`
- No server-side file storage

**Caching:**
- None (no server-side cache layer)
- Browser cache handles Vite chunk files; `recharts` and `pdf` chunks are split manually for long-lived caching (`vite.config.ts`)

## Authentication & Identity

**Auth Provider:**
- None — no authentication system exists
- App is open-access; all data is local to the user's browser session

## Monitoring & Observability

**Error Tracking:**
- None — no error tracking service (Sentry, Datadog, etc.)
- Runtime errors caught by `client/src/components/ErrorBoundary.tsx` and displayed inline

**Logs:**
- No structured logging — browser `console` only (and `logging: false` is set in html2canvas-pro calls in `client/src/lib/pdf.ts`)

## CI/CD & Deployment

**Hosting:**
- Vercel — static SPA hosting
  - Production URL: `avaliacao-fisica-smoky.vercel.app`
  - Config: `vercel.json` at repo root
  - Build command: `pnpm build`
  - Output directory: `dist/public`

**CI Pipeline:**
- None — no CI service configured (no GitHub Actions, CircleCI, etc.)
- Deployment is triggered automatically by Vercel on push to `main`

## Environment Configuration

**Required env vars:**
- None — the application has zero runtime environment variable dependencies

**Secrets location:**
- Not applicable — no secrets, API keys, or credentials exist in this project

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Font Delivery

**Google Fonts CDN:**
- Loaded in `client/index.html` via `<link>` tags
- Families loaded: DM Sans (400/500/600/700), IBM Plex Mono (400/500/600), Source Sans 3 (300/400/500/600)
- Preconnect hints: `fonts.googleapis.com`, `fonts.gstatic.com`
- The PDF export pipeline calls `document.fonts.ready` before capturing to ensure fonts are fully loaded (`client/src/lib/pdf.ts`, line 149)

## PDF Format — Data Exchange

The app uses a self-contained PDF format as its data portability layer:

- **Export:** HTML sections are captured as JPEG via `html2canvas-pro` → assembled into A4 PDF via `jspdf` → `ficha.json` attachment embedded via `pdf-lib` (`client/src/lib/pdf.ts`, `exportarPDF()`)
- **Import:** `pdf-lib` reads the PDF, extracts the `ficha.json` attachment, decompresses if needed (FlateDecode), and parses JSON back into `FormData` (`client/src/lib/pdf.ts`, `importarPDF()`)
- This is the only data interchange format — there is no network API

---

*Integration audit: 2026-05-30*
