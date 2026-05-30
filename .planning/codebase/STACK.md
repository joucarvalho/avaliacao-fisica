# Technology Stack

**Analysis Date:** 2026-05-30

## Languages

**Primary:**
- TypeScript 5.6.3 — all application code in `client/src/` and `shared/`

**Secondary:**
- CSS (via Tailwind v4 utility classes + CSS custom properties) — `client/src/index.css`

## Runtime

**Environment:**
- Node.js v24 (detected at analysis time; no `.nvmrc` or `.node-version` present)

**Package Manager:**
- pnpm 10.4.1 (pinned via `packageManager` field in `package.json`)
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- React 19.2.1 — UI rendering, `client/src/main.tsx` → `client/src/App.tsx`
- React DOM 19.2.1 — DOM mounting

**Routing:**
- wouter 3.3.5 — lightweight client-side router; routes defined in `client/src/App.tsx`

**Animation:**
- motion 12.40.0 (Framer Motion) — page transitions via `AnimatePresence` + `motion.div` in `client/src/App.tsx`; respects `prefers-reduced-motion` via `useReducedMotion()`

**Styling:**
- Tailwind CSS 4.1.14 — utility-first CSS via Vite plugin (`@tailwindcss/vite`)
- tw-animate-css 1.4.0 — animation utility classes imported in `client/src/index.css`
- tailwind-merge 3.3.1 — conflict-safe class merging in `client/src/lib/utils.ts`
- clsx 2.1.1 — conditional class composition in `client/src/lib/utils.ts`

**Charts:**
- recharts 2.15.2 — area charts for progress tracking in `client/src/pages/Relatorio.tsx`; lazy-loaded via `client/src/lib/lazy-relatorio.ts`

**Notifications:**
- sonner 2.0.7 — toast notifications; component at `client/src/components/ui/sonner.tsx`

**UI Component base:**
- shadcn/ui (new-york style) — component scaffolding config at `components.json`; currently only `sonner.tsx` is present under `client/src/components/ui/`

**Build/Dev:**
- Vite 7.1.7 — dev server (port 3000) and production bundler; config at `vite.config.ts`
- `@vitejs/plugin-react` 5.0.4 — React JSX transform for Vite

**Type Checking:**
- TypeScript (strict mode, `noEmit`) — `tsconfig.json` + `tsconfig.node.json`
- `pnpm check` runs `tsc --noEmit`

## Key Dependencies

**PDF Generation:**
- jspdf 4.2.1 — creates the A4 PDF canvas structure (`client/src/lib/pdf.ts`)
- html2canvas-pro 2.0.4 — captures HTML sections as JPEG images for PDF embedding; chosen over official html2canvas for Safari compatibility and Tailwind v4 color support (`client/src/lib/pdf.ts`)
- pdf-lib 1.17.1 — embeds a `ficha.json` attachment inside the exported PDF for re-import (`client/src/lib/pdf.ts`)

**Image Handling:**
- heic2any 0.0.4 — lazy-imported fallback to convert HEIC/HEIF images (iPhone photos) to JPEG; used in `client/src/components/ImageUpload.tsx`

**Icons:**
- lucide-react 0.453.0 — SVG icon components used throughout `client/src/`

## Configuration

**Environment:**
- No `.env` files present at analysis time (`.gitignore` lists `.env`, `.env.local`, etc.)
- No environment variables required at runtime — app is fully client-side with no server

**Build:**
- `vite.config.ts` — root set to `client/`, output to `dist/public/`
- Manual chunk splitting: `recharts` and `pdf` (pdf-lib + jspdf + html2canvas-pro) in separate chunks for long-term browser caching
- Path aliases: `@` → `client/src/`, `@shared` → `shared/`

**TypeScript:**
- `tsconfig.json` — strict mode, bundler module resolution, paths for `@` and `@shared`
- `tsconfig.node.json` — covers `vite.config.ts` only; stricter (`noUnusedLocals`, `noUnusedParameters`)

**Deployment:**
- `vercel.json` — SPA rewrites: all routes → `/index.html`; `buildCommand: pnpm build`; `outputDirectory: dist/public`

## Platform Requirements

**Development:**
- pnpm 10.4.1 required (pinned)
- Node.js v18+ recommended (v24 used at analysis time)
- `pnpm dev` starts Vite on port 3000 with `--host`

**Production:**
- Vercel (static SPA hosting)
- No server process — pure static files served from `dist/public/`
- Auto-redeploy on push to `main` branch

---

*Stack analysis: 2026-05-30*
