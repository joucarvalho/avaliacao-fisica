---
last_mapped: 2026-05-30
---

# CONVENTIONS.md — avaliacao-fisica

## Code Style

**Sem Prettier.** Estilo compacto manual — nunca rodar `pnpm format`. Validação: `pnpm check` (TypeScript) + `pnpm build` (Vite).

**TypeScript:** `strict: true`. Sem `any` implícito. Tipos inline preferidos a interfaces separadas para props simples.

**Componentes:** funcionais com hooks. Sem class components. Props desestruturadas na assinatura.

---

## Naming

| Categoria | Padrão | Exemplo |
|-----------|--------|---------|
| Componente React | PascalCase | `Section`, `TagInput`, `DateInputField` |
| Função utilitária | camelCase | `calculateIMC`, `salvarRascunho`, `mmssParaMinutos` |
| Constante de módulo | SCREAMING_SNAKE_CASE | `HERO_BANNER`, `CHAVE_RASCUNHO`, `DOBRAS_PROTOCOL_CONFIG` |
| Chave de `formData` | snake_case PT-BR | `header_nome`, `dc_protocolo`, `fc_max_estimada` |
| Arquivo de componente | PascalCase | `Home.tsx`, `ImageUpload.tsx` |
| Arquivo de lib | kebab-case | `lazy-relatorio.ts`, `pdf.ts` |
| Variável de estado | camelCase PT-BR preferido | `formData`, `rascunho`, `open` |

**Idioma:** Mix PT-BR + inglês. UI e labels em PT-BR. Nomes de funções React-standard em inglês (`updateField`, `onChange`, `handleExportarPDF`). Cálculos em PT-BR (`calcularIdade` → `calculateAge` — inglês aqui por decisão histórica).

---

## Patterns

### Componentes utilitários internos ao `Home.tsx`

Todos os componentes de campo (`Field`, `LinesField`, `TagInput`, `DateInputField`, etc.) são definidos **dentro do mesmo arquivo** `Home.tsx`, não em arquivos separados. Isso é intencional — são utilitários locais sem reutilização externa.

### Separadores de seção com ASCII art

Seções de código grandes são separadas com comentários decorativos:

```typescript
// ─── Nome da Seção ────────────────────────────────────────────
```

### Props via desestruturação inline

```typescript
function Field({ label, wide = false, mono = false, value, onChange, placeholder }: {
  label: string; wide?: boolean; mono?: boolean; value?: string; onChange?: (v: string) => void; placeholder?: string;
}) { ... }
```

### `formData` como flat object

Todo o estado da ficha é um `Record<string, string | number | boolean | string[]>`. Chaves compostas representam células de tabela: `tableKey_row_col` (ex: `bioimpedancia_0_0`).

### Cálculos derivados em `updateField`

Em vez de `useEffect` com deps complexas, os cálculos automáticos (IMC, RCQ, VO₂, dobras) são disparados **dentro do `setFormData` callback** em `updateField`, verificando se a chave alterada é relevante.

### Portal para dropdowns

`TagInput` usa `createPortal(dropdown, document.body)` para escapar do `overflow: hidden` da `Section`. O rect é calculado via `getBoundingClientRect()` no evento `onFocus`.

---

## Imports

Ordem convencional no projeto:

1. React e hooks (`import { useState, useCallback } from "react"`)
2. Bibliotecas de terceiros (`import { useLocation } from "wouter"`)
3. Aliases internos (`import { getPesoAtual } from "@shared/const"`)
4. Aliases do cliente (`import { ImageUpload } from "@/components/ImageUpload"`)
5. Dynamic imports (nunca no topo — sempre dentro de handlers)

### Dynamic imports para libs pesadas

PDF, HEIC conversion e html2canvas são carregados sob demanda:

```typescript
const { exportarPDF } = await import("@/lib/pdf");
```

Isso reduz o bundle inicial em ~200KB.

---

## Error Handling

### Erros de usuário (toast)

```typescript
try {
  const { exportarPDF } = await import("@/lib/pdf");
  await exportarPDF(...);
  toast.success("PDF exportado com sucesso.");
} catch (err) {
  console.error("[Home] erro ao exportar PDF", err);
  toast.error("Não foi possível exportar o PDF. Tente novamente.");
}
```

Padrão: `console.error("[Módulo] contexto do erro", err)` + `toast.error(mensagem)`.

### Falha silenciosa no localStorage

```typescript
try {
  localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(formData));
} catch {
  // Quota excedida. Falha silenciosa — app não quebra.
}
```

O rascunho é segurança; a perda dele não quebra o app.

### ErrorBoundary global

`client/src/components/ErrorBoundary.tsx` captura erros React não tratados no render. Exibe fallback. Cobre especialmente o Relatório (lazy-loaded, recharts pode falhar).

---

## Comments

**Regra:** comentar apenas o WHY não-óbvio. O QUE o código faz não é comentado (nomes auto-explicativos fazem esse papel).

**Exemplos de comentários presentes no projeto:**

```typescript
// Portal para o dropdown — escapa do overflow:hidden da Section
```

```typescript
// Passamos a mesma `location` ao <Switch> para "congelar" a página que sai
// na rota antiga durante a transição (senão ela viraria a página nova).
```

```typescript
// Quota excedida ou modo privado bloqueando storage.
// Falha silenciosa proposital — o app não deve quebrar por causa do rascunho.
```

**JSDoc:** usado em funções exportadas de `lib/storage.ts` (explica WHY e casos de falha). Não usado em componentes.

---

## Tailwind Patterns

| Pattern | Significado |
|---------|-------------|
| `text-foreground/50` | Cor com opacidade (CSS variable + opacity modifier) |
| `bg-teal/10` | Background com 10% de opacidade da cor teal |
| `section-card` | Classe CSS customizada para cards de seção (no CSS global) |
| `pdf-hide` | Classe que esconde elemento no PDF gerado |
| `pdf-hero` | Classe que marca o hero header para o PDF |
| `no-print` | Esconde no `print` media query |
| `print:*` | Sobreescrita para impressão |

**Cores temáticas:**

| Cor | Hexadecimal | Uso |
|-----|-------------|-----|
| Teal | `#0A6B7C` | Composição Corporal + Antropometria |
| Orange | `#D4622B` | Performance / Cardio |
| Green | `#5A8C6A` | Mobilidade / FMS |
| Neutral | `text-foreground/70` | Seções gerais (Anamnese, Dados Pessoais) |

---

## TypeScript Strictness

`tsconfig.json` tem `strict: true`. Pontos notáveis:

- Sem `any` declarado — usa `unknown` quando necessário
- `FormData` é `Record<string, string | number | boolean | string[]>` — type casting explícito com `as string` nas leituras
- Retrocompatibilidade de dados antigos tratada com guards de tipo inline no `useState` initializer

```typescript
if (typeof rascunho.objetivo === "string") {
  rascunho.objetivo = rascunho.objetivo ? [rascunho.objetivo as string] : [];
}
```
