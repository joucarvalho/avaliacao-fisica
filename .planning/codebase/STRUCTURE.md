---
last_mapped: 2026-05-30
---

# STRUCTURE.md — avaliacao-fisica

## Directory Layout

```
avaliacao-fisica/
├── client/                    # Frontend SPA (código-fonte principal)
│   ├── index.html             # HTML shell do Vite
│   └── src/
│       ├── main.tsx           # Entry point React — ReactDOM.createRoot
│       ├── App.tsx            # Router (wouter) + AnimatePresence + ErrorBoundary
│       ├── index.css          # CSS global (Tailwind directives + variáveis CSS)
│       ├── components/        # Componentes reutilizáveis globais
│       │   ├── ErrorBoundary.tsx    # Captura erros React
│       │   └── ImageUpload.tsx      # Upload de fotos com moldura 9:16
│       ├── lib/               # Utilitários e serviços
│       │   ├── lazy-relatorio.ts    # React.lazy + preload para Relatorio
│       │   ├── pdf.ts               # Exportar/importar PDF (dynamic import)
│       │   ├── storage.ts           # localStorage (rascunho)
│       │   └── utils.ts             # cn() helper (clsx + tailwind-merge)
│       └── pages/             # Páginas roteáveis
│           ├── Home.tsx             # Ficha principal (~1.778 linhas)
│           ├── Relatorio.tsx        # Relatório gráfico (lazy-loaded)
│           └── NotFound.tsx         # Página 404
│
├── shared/                    # Código compartilhado (client-only neste projeto)
│   └── const.ts               # getPesoAtual() — extrai peso da bioimpedância
│
├── dist/                      # Build de produção (gerado pelo Vite, não commitado)
│   └── public/
│       ├── index.html
│       └── assets/            # Chunks JS/CSS com hash (code splitting automático)
│
├── .claude/                   # Configurações e docs para Claude Code
│   ├── docs/                  # Documentação de referência do projeto
│   │   ├── arquitetura.md
│   │   ├── design-system.md
│   │   ├── fluxos.md
│   │   ├── persistencia.md
│   │   └── secoes.md
│   └── hooks/                 # Hooks customizados do Claude Code
│
├── .planning/                 # GSD planning artifacts (este mapeamento)
│   └── codebase/
│
├── CLAUDE.md                  # Instruções do projeto para Claude Code
├── package.json               # Dependências e scripts (pnpm)
├── pnpm-lock.yaml             # Lockfile
├── vite.config.ts             # Config do Vite (aliases, plugins, build)
├── tsconfig.json              # TypeScript config do cliente
├── tsconfig.node.json         # TypeScript config para ferramentas Node (Vite)
├── vercel.json                # Config de deploy na Vercel
├── components.json            # Config do shadcn/ui
├── git.txt                    # Log manual de commits (gerado pelo Claude Code)
├── to-do.md                   # To-do list ativa (fluxo de trabalho do Claude Code)
└── README.md
```

---

## Key Locations

| O que fazer | Onde ir |
|-------------|---------|
| Editar a ficha (campos, seções, cálculos) | `client/src/pages/Home.tsx` |
| Editar o relatório com gráficos | `client/src/pages/Relatorio.tsx` |
| Mexer em upload de fotos | `client/src/components/ImageUpload.tsx` |
| Mexer em exportar/importar PDF | `client/src/lib/pdf.ts` |
| Mexer em rascunho localStorage | `client/src/lib/storage.ts` |
| Adicionar utilitário de estilo (cn) | `client/src/lib/utils.ts` |
| Adicionar componente shadcn/ui | `client/src/components/ui/` |
| Mudar configuração do Vite (aliases, etc.) | `vite.config.ts` |
| Adicionar constante compartilhada | `shared/const.ts` |
| Variáveis CSS / Tailwind theme | `client/src/index.css` |
| Config deploy Vercel | `vercel.json` |

---

## Naming Conventions

| Categoria | Convenção | Exemplos |
|-----------|-----------|---------|
| Componentes React | PascalCase | `Home`, `ImageUpload`, `ErrorBoundary` |
| Funções utilitárias | camelCase | `calculateIMC`, `salvarRascunho`, `getPesoAtual` |
| Constantes de módulo | SCREAMING_SNAKE_CASE | `CHAVE_RASCUNHO`, `HERO_BANNER`, `DOBRAS_PROTOCOL_CONFIG` |
| Chaves do `formData` | snake_case em PT-BR | `header_nome`, `dc_protocolo`, `bioimpedancia_0_0` |
| Chaves de tabela | `{tableKey}_{row}_{col}` | `bioimpedancia_0_0`, `perimetros_6_0`, `dobras_9_2` |
| Arquivos de componente | PascalCase | `Home.tsx`, `ImageUpload.tsx` |
| Arquivos de lib | camelCase | `lazy-relatorio.ts`, `pdf.ts`, `storage.ts` |
| Labels de UI | PT-BR | "Massa Gorda (kg)", "Dobras Cutâneas" |
| Nomes de função/variável | Mix PT-BR + inglês | `salvarRascunho`, `updateField`, `carregarRelatorio` |

---

## Module Boundaries

```
client/src/pages/Home.tsx
    └─ imports → client/src/components/ImageUpload.tsx
    └─ imports → shared/const.ts  (getPesoAtual)
    └─ imports → client/src/lib/storage.ts
    └─ imports → client/src/lib/lazy-relatorio.ts
    └─ imports → client/src/lib/pdf.ts  (dynamic — só no clique)
    └─ imports → lucide-react, wouter, sonner, motion/react

client/src/App.tsx
    └─ imports → client/src/pages/Home.tsx
    └─ imports → client/src/pages/NotFound.tsx
    └─ imports → client/src/lib/lazy-relatorio.ts (Relatorio lazy)
    └─ imports → client/src/components/ErrorBoundary.tsx
    └─ imports → wouter, motion/react, sonner

shared/const.ts
    └─ nenhuma dependência interna (só lógica pura)
```

---

## Import Aliases (configurados no Vite)

| Alias | Resolve para |
|-------|-------------|
| `@/` | `client/src/` |
| `@shared/` | `shared/` |

---

## Code Splitting (automático via Vite)

| Chunk | Conteúdo | Quando carrega |
|-------|----------|----------------|
| `index-*.js` | App principal (Home, App, etc.) | Sempre |
| `Relatorio-*.js` | Relatório + recharts | Hover/clique em "Relatório" |
| `pdf-*.js` | pdf-lib | Clique em "Exportar PDF" |
| `pdf-*.js` (2) | jspdf + html2canvas | Clique em "Exportar/Importar PDF" |
| `recharts-*.js` | Recharts | Lazy com Relatorio |
| `heic2any-*.js` | HEIC converter | Lazy com ImageUpload |
| `html2canvas.esm-*.js` | html2canvas-pro | Lazy com PDF export |
| `purify.es-*.js` | DOMPurify | Sanitização de SVG |

---

## Static Assets

Não há `/public` com assets locais. Todas as imagens de hero e fundo são servidas via CloudFront (URLs hardcoded em `client/src/pages/Home.tsx`):

- `HERO_BANNER` — banner teal do cabeçalho
- `BODY_BG` — fundo da seção Composição Corporal
- `PERFORMANCE_BG` — fundo da seção Performance
- `MOBILITY_BG` — fundo da seção Mobilidade

Fotos dos alunos ficam como base64 dentro do `formData` / `localStorage` / PDF exportado.
