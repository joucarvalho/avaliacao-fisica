---
last_mapped: 2026-05-30
---

# ARCHITECTURE.md — avaliacao-fisica

## Pattern

**Single-Page Application (SPA) pura.** Sem servidor, sem banco de dados. Todo estado vive em memória React (`useState`), com rascunho automático em `localStorage`. Exportação/importação de dados via PDF com JSON embutido (`ficha.json` como attachment).

**Estilo arquitetural:** Monolito de frontend. Não há separação em serviços, camadas de API, ou contexto global (Redux, Zustand, etc.). Toda a lógica de negócio vive no componente `Home` (~1.778 linhas).

---

## Layers

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                  │
│  ┌───────────────────────────────────────────────────┐   │
│  │  App.tsx (ErrorBoundary + AnimatePresence Router) │   │
│  │  ┌──────────────────┐  ┌────────────────────────┐ │   │
│  │  │  /  → Home.tsx   │  │  /relatorio → Relatorio│ │   │
│  │  │  (1.778 linhas)  │  │  (lazy-loaded)         │ │   │
│  │  └──────────────────┘  └────────────────────────┘ │   │
│  │                                                    │   │
│  │  Shared state: formData (useState, Home)           │   │
│  │  Persistence: localStorage (auto-save 500ms)       │   │
│  │  Navigation: wouter                                │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  External: Vercel CDN (imagens de hero/bg via CloudFront) │
└─────────────────────────────────────────────────────────┘
```

---

## Entry Points

| Arquivo | Papel |
|---------|-------|
| `client/index.html` | HTML shell do Vite |
| `client/src/main.tsx` | `ReactDOM.createRoot` + `<App />` |
| `client/src/App.tsx` | Router (wouter) + AnimatePresence + ErrorBoundary |
| `client/src/pages/Home.tsx` | Ficha principal — toda a UI e lógica |
| `client/src/pages/Relatorio.tsx` | Página de relatório — lazy-loaded |

---

## Data Flow

```
User input (Form field)
      │
      ▼
updateField(key, value)   ← useCallback no Home.tsx
      │
      ├─→ setFormData (useState)
      │         │
      │         ├─→ Cálculos reativos inline (IMC, RCQ, VO₂, etc.)
      │         └─→ setTimeout 500ms → salvarRascunho() → localStorage
      │
      └─→ formData passa para componentes filhos como props
```

**Import/Export:**
- **Exportar PDF:** `handleExportarPDF` → dynamic import `@/lib/pdf` → `pdf-lib` + `html2canvas` → gera PDF com `ficha.json` embutido como attachment
- **Importar PDF:** `handleImportarArquivo` → dynamic import `@/lib/pdf` → extrai `ficha.json` do PDF → `setFormData(dados)`
- **Relatório:** navega para `/relatorio` passando `formData` via `preloadRelatorio` (chunk separado, recharts ~340KB gz)

**Nota:** O `formData` NÃO é passado via URL, context, ou store para o Relatório. O Relatório lê o `localStorage` diretamente para obter o rascunho atual.

---

## Key Abstractions

### Componentes internos de `Home.tsx`

| Componente | Papel |
|------------|-------|
| `Section` | Wrapper collapsible com cor temática e suporte a `pdfJoinPrev` |
| `Field` | Input simples com label (text/mono) |
| `LinesField` | Textarea com label |
| `DateInputField` | Input de data DD/MM/AAAA com auto-avanço entre campos |
| `TagInput` | Input com autocomplete e seleção por tags (portal dropdown) |
| `ScaleField` | Escala clicável 1–10 |
| `RadioCheck` | Botão radio estilizado como checkbox |
| `EditableTable` | Tabela editável com header de datas e linhas configuráveis |
| `HeaderDateInput` | Versão do DateInputField para o header hero (estilo branco) |

### Componentes externos

| Componente | Localização | Papel |
|------------|-------------|-------|
| `ImageUpload` | `client/src/components/ImageUpload.tsx` | Upload de fotos com moldura 9:16 e preview |
| `ErrorBoundary` | `client/src/components/ErrorBoundary.tsx` | Captura erros React e exibe fallback |
| `Toaster` | `sonner` (via shadcn) | Notificações toast |

---

## Cálculos Automáticos (inline em `updateField`)

| Gatilho | Cálculo | Destino |
|---------|---------|---------|
| `nascimento` | Idade via `calculateAge` | `formData.idade` + `formData.dc_idade` |
| `nascimento` / `idade` | FCmax (Tanaka) → FC Reserva (Karvonen) | `formData.fc_max_estimada` / `fc_reserva` |
| `altura` / `bioimpedancia_0_*` | IMC | `formData.imc` |
| `perimetros_6_0` / `perimetros_7_0` | RCQ | `formData.rcq` |
| `dobras_*` / `dc_protocolo` / `dc_sexo` | Somatório → Densidade → %Gordura | `dobras_9_*` / `dobras_10_*` / `dobras_11_*` |
| `vo2_formula` / `cooper_distancia` / `rockport_*` | VO₂ Max | `formData.vo2_resultado` |

---

## Routing

```
/            → Home (eager)
/relatorio   → Relatorio (lazy, Suspense, chunk separado)
*            → NotFound
```

Transições animadas via `AnimatePresence` (Framer Motion) com `mode="wait"`. Respeita `prefers-reduced-motion`.

---

## Lazy Loading Strategy

O `Relatório` (recharts ~340KB gz) é carregado via `React.lazy`:

1. **Hover/foco** no botão "Relatório" → `preloadRelatorio()` dispara o download antecipado
2. **requestIdleCallback** no mount do Home → rede de segurança para mobile (sem hover)
3. **Clique** → `await Promise.race([preloadRelatorio(), timeout 400ms])` antes de navegar
4. **Suspense fallback** → `<Carregando />` enquanto o chunk carrega

---

## Deployment

- **Build:** `pnpm build` → Vite gera SPA estática em `dist/public/`
- **Host:** Vercel (branch `main` = produção, auto-deploy no push)
- **Config:** `vercel.json` na raiz
- **CDN:** CloudFront para imagens de hero/fundo (URLs hardcoded no `Home.tsx`)

---

## Formatos de Persistência

| Destino | Formato | Conteúdo |
|---------|---------|----------|
| `localStorage` | JSON stringify | `formData` completo (inclui base64 de imagens) |
| PDF exportado | Arquivo binário | Layout visual (pdf-lib) + `ficha.json` como attachment |
| Import | Parsing do attachment | `ficha.json` extraído → `setFormData` |
