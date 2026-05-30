# CLAUDE.md — avaliacao_fisica

> **As regras gerais de trabalho vivem no global `~/.claude/CLAUDE.md` e valem aqui:**
> idioma PT-BR, fluxo obrigatório de 4 fases (Implementation Plan → `to-do.md` →
> microtarefas → auditoria sênior), perfil do usuário júnior + comunicação em 3 camadas
> (lógica → sintaxe → porquê), e git manual com `git.txt`.
> **Este arquivo cobre apenas o que é específico deste projeto.**

---

## ⚙️ Comandos do Projeto

```bash
pnpm dev        # Sobe o servidor Vite de desenvolvimento (porta 3000)
pnpm build      # Gera o build SPA estático em dist/public/
pnpm preview    # Serve o build de produção gerado
pnpm start      # Alias de pnpm preview
pnpm check      # Verifica erros de tipagem TypeScript (não gera arquivos)
```

Não há testes automatizados. **Nunca rodar `pnpm format`** — ver Convenções abaixo.

---

## 📋 Contexto rápido

SPA pura (sem servidor, sem banco) de ficha de avaliação física para personal trainers.  
Dados vivem em memória (`useState`), rascunho em `localStorage`, e exportam/importam via PDF com `ficha.json` anexo.

---

## 🔧 Convenções específicas

- **Branches:** não criar branches novas — todo trabalho acontece na branch ativa.
- **Deploy:** `main` = produção; todo push redeploya automaticamente na Vercel.
- **Formatação:** `pnpm format` (Prettier) **não é usado** — estilo compacto manual. Validar com `pnpm check` + `pnpm build`.

---

## 📁 Documentação de referência

Consultar apenas quando a tarefa exigir — não ler por padrão:

| Arquivo | Quando consultar |
|---|---|
| `.claude/docs/arquitetura.md` | Ao adicionar deps, entender rotas, hospedagem ou code splitting |
| `.claude/docs/persistencia.md` | Ao mexer em estado, localStorage ou `formData` |
| `.claude/docs/fluxos.md` | Ao mexer em upload de imagens, exportar/importar PDF ou lazy loading |
| `.claude/docs/secoes.md` | Ao adicionar/editar seções, cores, chaves de tabela ou cálculos |
| `.claude/docs/design-system.md` | Ao mexer em UI, cores CSS, tipografia ou estilos de impressão |
