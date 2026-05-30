# Arquitetura — avaliacao_fisica

## Stack técnica

| Camada | Tecnologia |
|---|---|
| UI | React 19 + TypeScript |
| Bundler | Vite 7 |
| CSS | Tailwind CSS v4 |
| Componentes | shadcn/ui reduzido (apenas wrapper de toast em `components/ui/sonner.tsx`) |
| Roteamento | Wouter |
| Animações | `motion` v12 (Framer Motion rebrandado) |
| Gráficos | Recharts |
| PDF (geração) | `jspdf` + `html2canvas-pro` |
| PDF (leitura/anexo) | `pdf-lib` |
| Imagens HEIC | `heic2any` |
| Toasts | `sonner` |

**Por que `html2canvas-pro` e não `html2canvas`:** o fork oficial (1.4.1) não tem manutenção e não entende `oklch()` do Tailwind v4. O `html-to-image` foi descartado porque usa SVG `<foreignObject>`, que o Safari rejeita com `SecurityError` em `canvas.toDataURL()`.

## Aliases de caminho (vite.config.ts)

- `@` → `client/src/`
- `@shared` → `shared/`

## Variáveis de ambiente

Nenhuma. O `.env` foi esvaziado na migração para SPA estática (coberto pelo `.gitignore`).

## Rotas de páginas (App.tsx via Wouter)

| Rota | Componente | Observação |
|---|---|---|
| `/` | `Home.tsx` | Formulário interativo com as 11 seções |
| `/relatorio` | `Relatorio.tsx` | Relatório de progresso com gráficos Recharts |
| `*` | `NotFound.tsx` | Fallback 404 |

`Relatorio` é carregado via `lazy()` + `Suspense` — ver `.claude/docs/fluxos.md`.

## Code splitting (vite.config.ts `manualChunks`)

- `recharts` → chunk próprio (carregado só em `/relatorio`)
- `pdf` → chunk próprio (`pdf-lib`, `jspdf`, `html2canvas-pro`)

Isso permite que o browser cache cada lib independentemente do app.

## Hospedagem

SPA estática na **Vercel**: https://avaliacao-fisica-smoky.vercel.app  
Branch `main` = produção — todo push redeploya automaticamente.  
Config em `vercel.json`: build `pnpm build`, saída `dist/public`, rewrite SPA `/(.*) → /index.html`.

GitHub: https://github.com/joucarvalho/avaliacao_fisica
