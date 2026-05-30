---
last_mapped: 2026-05-30
---

# TESTING.md — avaliacao-fisica

## Current State

**Não há testes automatizados neste projeto.**

Nenhum framework de teste está instalado. Nenhum arquivo `.test.ts`, `.spec.ts`, `.test.tsx` ou `.spec.tsx` existe. O `tsconfig.json` exclui explicitamente esses padrões:

```json
"exclude": ["**/*.test.ts", "**/*.spec.ts"]
```

---

## Validation Strategy (atual)

A validação acontece em dois níveis:

| Ferramenta | Comando | O que verifica |
|-----------|---------|----------------|
| TypeScript | `pnpm check` | Erros de tipo, contratos de interface |
| Vite build | `pnpm build` | Bundling, imports inválidos, tree-shaking |

**Não há:** Jest, Vitest, Testing Library, Playwright, Cypress, ou qualquer runner.

---

## Manual Testing (fluxo atual)

Todo QA é feito manualmente via `pnpm dev` (porta 3000):

1. Preencher campos e verificar cálculos automáticos (IMC, RCQ, VO₂, dobras)
2. Exportar PDF e verificar layout visual
3. Importar PDF exportado e verificar que os dados voltam corretamente
4. Navegar para `/relatorio` e verificar gráficos
5. Recarregar a página e verificar que o rascunho foi restaurado do localStorage
6. Testar em mobile (responsividade)

---

## What Could Be Tested (se implementado)

### Funções puras (alto valor, baixo custo)

Todas as funções de cálculo em `Home.tsx` e `shared/const.ts` são puras — sem efeitos colaterais, sem dependências externas:

```typescript
// Candidatas ideais para testes unitários:
calculateIMC(peso, altura)
calculateAge(birthDate)
calculateRCQ(cintura, quadril)
calculateDensity(protocol, sexo, idade, dobrasValues)
bodyFatFromDensity(density, formula)
calculateVO2MaxCooper(distancia)
calculateVO2MaxRockport(pesoKg, sexo, idade, tempo, fcFinal)
calculateFCMax(idade)
calculateFCReserva(fcMax, fcRepouso)
sanitizeScore(raw)
mmssParaMinutos(valor)
getVO2AgeGroup(idade)
getVO2Classification(vo2, sexo, idadeStr)
getPesoAtual(formData)  // shared/const.ts
```

### Storage (mock de localStorage)

```typescript
// client/src/lib/storage.ts
salvarRascunho(formData)
carregarRascunho()
limparRascunho()
```

Requer mock de `localStorage` (já é padrão em Vitest via `jsdom`).

### Integração de updateField

O fluxo `updateField → cálculos reativos → formData` poderia ser testado com React Testing Library, mas é complexo dado o tamanho do componente.

---

## Recommended Setup (se implementar)

**Framework sugerido:** Vitest + Testing Library (compatible com Vite sem configuração extra)

```bash
pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom
```

`vite.config.ts` — adicionar:

```typescript
test: {
  environment: "jsdom",
  globals: true,
}
```

`package.json` — adicionar:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Prioridade de implementação:**

1. Testes unitários para as ~15 funções de cálculo puras (retorno rápido, alto valor)
2. Testes de `storage.ts` (mock de localStorage)
3. Testes de integração de `updateField` (mais complexo, menos urgente)

---

## CI/CD

Não há pipeline de CI. Deploy automático via Vercel na branch `main`. Não há gate de qualidade antes do deploy além do `pnpm build` implícito no processo de deploy da Vercel.
