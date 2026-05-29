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
pnpm preview    # Serve o build de produção gerado (mesmo que pnpm start)
pnpm start      # Alias de pnpm preview
pnpm check      # Verifica erros de tipagem TypeScript (não gera arquivos)
```

Não há testes automatizados neste projeto. (Sobre `pnpm format`, ver "Convenções específicas".)

---

## 🏗️ Arquitetura

Aplicação **SPA pura** (sem servidor, sem banco de dados) de ficha de avaliação física para personal trainers. Cada ficha é um documento independente: o usuário preenche em memória, **exporta como PDF com JSON anexo**, e pode **reimportar** esse mesmo PDF para continuar editando depois.

**Stack:**
- React 19 + TypeScript
- Vite (bundler)
- Tailwind CSS v4
- shadcn/ui (componentes, baseados em Radix UI)
- Wouter (roteamento leve)
- Recharts (gráficos)
- `pdf-lib` + `jspdf` + `html2canvas-pro` (geração e leitura do PDF com anexo)
- `heic2any` (conversão HEIC → JPEG para iPhones)

**Persistência:**

Não há banco de dados. Os dados de uma ficha vivem em três lugares:

| Onde | O que guarda | Quando é usado |
|---|---|---|
| `useState` do `Home.tsx` | `formData` completo em memória | Sessão atual de edição |
| `localStorage` (chave `avaliacao_fisica_rascunho`) | Mesmo `formData` serializado | Rede de segurança — se fechar a aba sem exportar, recupera ao reabrir |
| PDF exportado (`.pdf` com `ficha.json` anexo) | Snapshot final do `formData` | Arquivo morto + meio de reimportar a ficha no futuro |

**Fluxo de imagens (4 fotos posturais + bioimpedância):**
O usuário arrasta um arquivo em `ImageUpload.tsx`. O componente: (1) tenta abrir a imagem nativamente; (2) se for HEIC e o browser não suportar, usa `heic2any` como fallback; (3) redimensiona para no máximo 2000 px no lado maior via Canvas; (4) reencoda como JPEG @ 0.85; (5) converte para data URL base64 via `FileReader.readAsDataURL`. A string base64 é guardada como mais um campo do `formData` (ex: `foto_anterior`, `bioimpedancia_imagem`), e portanto entra no rascunho local e no PDF anexo.

**Fluxo Exportar PDF (`client/src/lib/pdf.ts`):**
1. `html2canvas-pro` captura cada elemento com a classe `.section-card` como JPEG @ scale 2. Escolhemos o fork `html2canvas-pro` em vez do `html2canvas` oficial (1.4.1, sem manutenção) porque ele entende as cores `oklch()` do Tailwind v4 nativamente e corrige o posicionamento vertical de texto; e em vez do `html-to-image` porque este usa SVG `<foreignObject>`, que o Safari recusa em `canvas.toDataURL()` com `SecurityError` (marca o canvas como "origin-dirty").
2. `jspdf` monta um PDF A4 com cada captura virando uma página.
3. `pdf-lib` carrega o PDF resultante e usa `pdfDoc.attach(jsonBytes, "ficha.json", ...)` para embutir o `formData` como anexo.
4. O PDF final é baixado pelo navegador.

**Fluxo Importar PDF:**
1. Usuário seleciona um PDF previamente exportado.
2. `pdf-lib` carrega o PDF.
3. O código mergulha no catálogo PDF de baixo nível (`Catalog → Names → EmbeddedFiles`) para localizar o anexo `ficha.json`.
4. Como o `pdf-lib` salva os streams com `/FlateDecode`, descomprimimos os bytes via `DecompressionStream("deflate")` (API nativa do browser, sem dep extra).
5. O JSON descomprimido vira o novo `formData`, hidratando todos os campos da ficha.

**Rotas de páginas (`App.tsx` via Wouter):**
- `/` → `Home.tsx` — formulário interativo com as 11 seções de avaliação
- `/relatorio` → `Relatorio.tsx` — relatório de progresso com gráficos Recharts (lê o mesmo rascunho do `localStorage`)

**Seções do formulário em Home.tsx** (recolhíveis, com código de cores):
- Teal (verde-azulado) = composição (dados pessoais, anamnese, antropometria, composição corporal)
- Laranja = desempenho (força, aptidão cardiorrespiratória)
- Verde = mobilidade e postura

**Padrão de chaves para tabelas editáveis:**
```
${tableKey}_${linhaIndex}_${colunaIndex}
```
Exemplo: `bioimpedancia_0_0` = peso total na avaliação 1. O Relatório lê essas mesmas chaves para montar os gráficos.

**Cálculos automáticos** (implementados inline em Home.tsx com `useCallback`):
- IMC: `peso / (altura / 100)²`
- RCQ: `cintura / quadril`
- % Gordura: Jackson & Pollock 3, Pollock 7, ou Guedes 3 (escolha via dropdown)
- VO₂ Máximo: fórmula de Cooper (atlético), Rockport (sedentário), estimativa de Karvonen
- Sexo e idade sincronizam automaticamente da Seção I para as demais seções

**Aliases de caminho (vite.config.ts):**
- `@` → `client/src/`
- `@shared` → `shared/`

**Design system — "Clinical Sport Journal":**
Estilo editorial suíço. Variáveis CSS: `teal` (#0A6B7C), `orange` (#D4622B), `green` (#5A8C6A).
Tipografia: DM Sans (títulos), IBM Plex Mono (dados numéricos), Source Sans 3 (corpo).
Estilos de impressão via variantes `print:` do Tailwind — seções ficam expandidas ao imprimir.

**Variáveis de ambiente:**
Nenhuma. O `.env` foi esvaziado durante a migração para SPA estática (continua coberto pelo `.gitignore` por precaução).

**Hospedagem:**
SPA estática em produção na **Vercel**: https://avaliacao-fisica-smoky.vercel.app
A branch `main` é a de produção — **todo push na `main` dispara um redeploy automático na Vercel**. A config de deploy fica em `vercel.json` (raiz): build `pnpm build`, saída `dist/public`, e rewrites de SPA (`/(.*) → /index.html`, para as rotas client-side não darem 404 ao recarregar).
Localmente: `pnpm dev` para desenvolvimento; `pnpm build && pnpm preview` para validar o bundle de produção.

GitHub: `https://github.com/joucarvalho/avaliacao_fisica`

---

## 🔧 Convenções específicas deste projeto

- **Branches:** não criar branches novas para implementar features — todo o trabalho acontece na branch ativa. (Worktrees criadas pelo harness são internas; o código final vai para a branch do usuário via merge.)
- **Deploy:** a `main` é a branch de produção; todo push nela redeploya automaticamente na Vercel (ver "Hospedagem").
- **Formatação:** o script `pnpm format` (Prettier) existe no `package.json`, mas **não é usado** — o código segue um estilo compacto escrito à mão, e rodar o Prettier reformataria milhares de linhas. Valide mudanças com `pnpm check` + `pnpm build`.
