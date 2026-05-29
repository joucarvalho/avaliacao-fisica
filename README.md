# 🏋️ Ficha de Avaliação Física

SPA em **React + TypeScript** para personal trainers registrarem e acompanharem a avaliação física de seus alunos — com cálculos automáticos, gráficos de progresso e exportação/reimportação via PDF.

🔗 **Demo ao vivo:** https://avaliacao-fisica-umber.vercel.app

## ✨ Sobre

Cada ficha é um **documento independente**: o profissional preenche tudo digitalmente, **exporta como PDF** (com os dados embutidos) e pode **reimportar** esse mesmo PDF depois para continuar editando — tudo sem servidor nem banco de dados.

## 🎯 Destaques técnicos

- **100% client-side** — sem backend nem banco; os dados vivem no navegador (`localStorage`) e no PDF exportado.
- **PDF como "banco de dados" portátil** — o export embute um `ficha.json` dentro do próprio PDF (via `pdf-lib`); ao reimportar, o app lê esse anexo e reconstrói a ficha. O arquivo é, ao mesmo tempo, o relatório impresso **e** o backup dos dados.
- **Cálculos automáticos** — IMC, relação cintura/quadril, percentual de gordura (Jackson & Pollock, Pollock 7, Guedes) e VO₂ máx (Cooper, Rockport, Karvonen).
- **Gráficos de evolução** — acompanhamento do progresso do aluno ao longo das avaliações (Recharts).
- **Upload de imagens** — fotos posturais e laudo de bioimpedância, com conversão automática de HEIC (iPhone) → JPEG.
- **PDF fiel ao design** — captura via `html2canvas-pro` (suporta as cores `oklch` do Tailwind v4 e funciona no Safari).

## 🛠️ Stack

`React 19` · `TypeScript` · `Vite` · `Tailwind CSS v4` · `shadcn/ui` · `Wouter` · `Recharts` · `pdf-lib` · `jsPDF` · `html2canvas-pro`

## 🚀 Rodando localmente

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # build de produção em dist/public/
pnpm preview    # serve o build de produção
```

## ☁️ Deploy

SPA estática publicada na **Vercel** — cada push na branch `main` dispara um deploy automático.

---

Desenvolvido por **[Julio Carvalho](https://github.com/joucarvalho)**.
