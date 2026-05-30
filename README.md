# Ficha de Avaliação Física 🏋️

Aplicação **SPA** em **React 19 + TypeScript** para personal trainers registrarem e acompanharem a avaliação física dos alunos. Faz **cálculos automáticos** (IMC, % de gordura, VO₂ máx.), gera **gráficos de progresso** e exporta um **PDF que é, ao mesmo tempo, o relatório impresso e o backup dos dados** — tudo rodando **100% no navegador**, sem backend, sem banco e sem variáveis de ambiente.

🔗 **Demo ao vivo:** https://avaliacao-fisica-umber.vercel.app

---

## Arquitetura

```
        ┌─────────────────────────────────────────┐
        │           Navegador (cliente)           │
        │                                         │
        │     React 19 · Vite · Tailwind v4       │
        │      Wouter  ·  Home / Relatório        │
        └────────────────────┬────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
      ┌────────────────┐          ┌────────────────────┐
      │  localStorage  │          │  PDF + ficha.json  │
      │   (rascunho)   │          │  pdf-lib  ·  anexo │
      └────────────────┘          └────────────────────┘
       rascunho da sessão          relatório + backup

      100% client-side — sem servidor, sem banco, sem API
```

O conceito central é simples: **o PDF é o banco de dados portátil**. Ao exportar, o app embute um arquivo `ficha.json` dentro do próprio PDF (via `pdf-lib`). Ao reimportar esse mesmo PDF, ele lê o anexo e reconstrói a ficha exatamente como estava. O `localStorage` guarda apenas o rascunho da sessão atual, salvo automaticamente a cada alteração.

### Decisões de Arquitetura

| Componente | Escolha | Justificativa |
|---|---|---|
| **Persistência** | PDF + `localStorage` | O PDF embute o `ficha.json` e vira relatório **e** backup ao mesmo tempo; nenhum dado sai do navegador |
| **Geração do PDF** | `html2canvas-pro` + `jsPDF` | O `html2canvas` oficial está sem manutenção e não entende `oklch()` do Tailwind v4; `html-to-image` quebra no Safari (`SecurityError`) |
| **Anexo de dados** | `pdf-lib` | Permite embutir o `ficha.json` dentro do PDF e lê-lo de volta na importação |
| **Roteamento** | `Wouter` | Router minúsculo, suficiente para 3 rotas — evita o peso do React Router |
| **Animações** | `motion` (Framer) | Transições entre páginas que esperam o chunk do Relatório carregar (lazy-load) |
| **Gráficos** | `Recharts` | Isolado em chunk próprio, baixado só quando o usuário abre `/relatorio` |
| **Fotos de iPhone** | `heic2any` | Converte HEIC → JPEG no próprio navegador, sem servidor |
| **Code splitting** | `manualChunks` (Vite) | Separa `recharts` e o trio de PDF em chunks cacheáveis de forma independente |

---

## Requisitos

- [Node.js](https://nodejs.org/) ≥ 20
- [pnpm](https://pnpm.io/) ≥ 10
- Um navegador moderno (Chrome, Firefox, Safari ou Edge)

---

## Início Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/joucarvalho/avaliacao-fisica.git
cd avaliacao-fisica

# 2. Instale as dependências
pnpm install

# 3. Suba o servidor de desenvolvimento
pnpm dev          # http://localhost:3000

# 4. (Opcional) Gere e sirva o build de produção
pnpm build        # gera a SPA estática em dist/public/
pnpm preview      # serve o build gerado
```

> Não há testes automatizados. Para validar mudanças, use `pnpm check` (tipagem TypeScript) e `pnpm build`.

---

## Rotas da Aplicação

| Rota | Página | Descrição |
|---|---|---|
| `/` | `Home` | Formulário interativo com as 11 seções da ficha |
| `/relatorio` | `Relatório` | Gráficos de evolução (Recharts), carregado sob demanda via `lazy()` |
| `*` | `NotFound` | Página 404 |

---

## Como Usar

1. Abra a aplicação e preencha as seções da ficha — tudo é salvo sozinho no navegador.
2. Conforme você digita, o app calcula **IMC, RCQ, % de gordura e VO₂ máx.** automaticamente.
3. Envie **fotos posturais** e o **laudo de bioimpedância** — imagens de iPhone (HEIC) viram JPEG na hora.
4. Clique em **Exportar PDF**: você baixa um arquivo com o relatório **e** os dados embutidos.
5. Para continuar outro dia, clique em **Importar PDF** e escolha aquele mesmo arquivo — a ficha volta de onde parou.
6. Acesse **`/relatorio`** para ver os gráficos de progresso do aluno ao longo das avaliações.

---

## Seções da Ficha

| Nº | Seção | Grupo (cor) |
|---|---|---|
| I | Dados Pessoais | neutro |
| II | Anamnese de Saúde | neutro |
| III | Anamnese Comportamental e Estilo de Vida | neutro |
| IV | Composição Corporal (Bioimpedância) | 🟦 teal |
| V | Medidas Antropométricas | 🟦 teal |
| VI | Dobras Cutâneas | 🟦 teal |
| VII | Avaliação Postural | 🟩 green |
| VIII | Avaliação de Movimento e Mobilidade | 🟩 green |
| IX | Avaliação de Força | 🟧 orange |
| X | Condicionamento Cardiorrespiratório | 🟧 orange |
| XI | Observações e Plano de Ação | neutro |

> As cores agrupam seções por tema — **teal** `#0A6B7C` (composição/medidas), **green** `#5A8C6A` (postura/movimento) e **orange** `#D4622B` (força/cardio). Sexo e idade preenchidos na Seção I são propagados automaticamente para as demais seções.

---

## Cálculos Automáticos

| Cálculo | Fórmula / Método |
|---|---|
| **IMC** | peso ÷ (altura ÷ 100)² |
| **Relação Cintura/Quadril (RCQ)** | cintura ÷ quadril |
| **% de Gordura** | Jackson & Pollock 3, Pollock 7 ou Guedes 3 (selecionável) |
| **VO₂ Máximo** | Cooper, Rockport ou Karvonen |

---

## Fluxo de Exportar / Importar PDF

```
  EXPORTAR                                   IMPORTAR
  ════════                                   ════════

  Ficha preenchida na tela                   Usuário seleciona o PDF
          │                                          │
          ▼  html2canvas-pro captura cada            ▼  pdf-lib acha o anexo
             página (entende oklch / Safari)            "ficha.json" no arquivo
          │                                          │
          ▼  jsPDF monta as páginas                  ▼  JSON.parse reconstrói
             pdf-lib anexa o ficha.json                 o formData da ficha
          │                                          │
          ▼                                          ▼
  PDF final = relatório + backup             Ficha volta como estava —
  num único arquivo                          é só continuar editando
```

---

## Estrutura do Projeto

```
avaliacao-fisica/
├── client/
│   ├── index.html                  # HTML raiz da SPA
│   └── src/
│       ├── main.tsx                # Ponto de entrada do React
│       ├── App.tsx                 # Rotas (Wouter)
│       ├── index.css               # Tailwind v4 + tema (cores oklch)
│       ├── pages/
│       │   ├── Home.tsx            # Formulário das 11 seções + cálculos
│       │   ├── Relatorio.tsx       # Gráficos de evolução (lazy)
│       │   └── NotFound.tsx        # Página 404
│       ├── components/
│       │   ├── ImageUpload.tsx     # Upload de fotos (HEIC → JPEG)
│       │   ├── ErrorBoundary.tsx   # Captura erros de renderização
│       │   └── ui/
│       │       └── sonner.tsx      # Wrapper dos toasts (shadcn)
│       └── lib/
│           ├── pdf.ts              # Exporta/importa o PDF + ficha.json
│           ├── storage.ts          # Rascunho no localStorage
│           ├── lazy-relatorio.ts   # Carrega o Relatório sob demanda
│           └── utils.ts            # Helpers (cn / merge de classes)
├── shared/
│   └── const.ts                    # Constantes compartilhadas
├── vite.config.ts                  # Aliases, code splitting, porta 3000
├── vercel.json                     # Deploy (build + rewrite SPA)
└── package.json
```

---

## Variáveis de Ambiente

**Nenhuma.** O projeto é uma SPA estática — não há `.env`, chaves de API nem configuração de servidor a definir.

---

## Tecnologias Utilizadas

- **React 19** + **TypeScript** — interface e tipagem
- **Vite 7** — bundler e servidor de desenvolvimento
- **Tailwind CSS v4** — estilização (com cores `oklch`)
- **Wouter** — roteamento minimalista (3 rotas)
- **Recharts** — gráficos de evolução
- **jsPDF** + **html2canvas-pro** — geração do PDF fiel ao design (entende `oklch` e funciona no Safari)
- **pdf-lib** — embute e lê o `ficha.json` dentro do PDF
- **heic2any** — converte fotos HEIC (iPhone) → JPEG
- **motion** — animações e transições entre páginas
- **sonner** — notificações (toasts)
- **lucide-react** — ícones

---

## Deploy

SPA estática publicada na **Vercel**. Cada push na branch `main` dispara um deploy automático.
Configuração em `vercel.json`: comando `pnpm build`, saída em `dist/public` e rewrite de SPA (`/(.*) → /index.html`).

---

Desenvolvido por **[Julio Carvalho](https://github.com/joucarvalho)**.
