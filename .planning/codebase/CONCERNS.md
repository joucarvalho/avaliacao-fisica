# Codebase Concerns

**Analysis Date:** 2026-05-30

---

## Tech Debt

**FormData type duplicada em três arquivos:**
- Issue: `interface FormData` é definida localmente em `client/src/pages/Home.tsx` (linha 30) e `client/src/pages/Relatorio.tsx` (linha 24), enquanto o tipo canônico existe em `client/src/lib/storage.ts` (linha 12) como `export type FormData`. As páginas não importam o tipo compartilhado — definem o próprio.
- Files: `client/src/pages/Home.tsx`, `client/src/pages/Relatorio.tsx`, `client/src/lib/storage.ts`
- Impact: Se o shape do formData mudar (ex: adicionar um campo tipado), é necessário atualizar três lugares. A divergência silenciosa entre os tipos já acontece: `storage.ts` usa `Record<string, FormDataValue>` explícito; as páginas usam `[key: string]: string | number | boolean | string[]` inline.
- Fix approach: Remover as interfaces locais e importar `FormData` de `@/lib/storage` em ambas as páginas.

**`_goalInvert` — função implementada mas nunca chamada:**
- Issue: A função `_goalInvert` em `client/src/pages/Relatorio.tsx` (linha 219) está decorada com `// eslint-disable-next-line @typescript-eslint/no-unused-vars` e nunca é invocada. É código que foi escrito para colorir os badges de tendência conforme o objetivo do aluno, mas a integração não foi concluída — todos os badges de tendência usam `invert` fixo (falso por padrão).
- Files: `client/src/pages/Relatorio.tsx` (linhas 218–226)
- Impact: A lógica de "queda de peso é boa para emagrecimento, ruim para hipertrofia" existe mas não é aplicada. O badge de tendência do peso mostra "vermelho" para qualquer queda, independentemente do objetivo.
- Fix approach: Invocar `_goalInvert` nos `TrendBadge` relevantes (peso, gordura, músculo) ou remover a função se a funcionalidade for descartada.

**`<p>` vazio no hero de Home e Relatorio:**
- Issue: Há um parágrafo `<p className="mt-3 font-body...">` sem conteúdo em `client/src/pages/Home.tsx` (linha 904–906) e mesmo padrão em `client/src/pages/Relatorio.tsx` (linha 351–353). Provavelmente era um subtítulo/tagline que foi removido mas o container ficou.
- Files: `client/src/pages/Home.tsx` (linhas 904–906), `client/src/pages/Relatorio.tsx` (linhas 351–353)
- Impact: Renderiza espaço em branco desnecessário no hero. Sem impacto funcional, mas é ruído de markup.
- Fix approach: Remover os dois elementos `<p>` vazios.

**Nome do treinador hardcoded:**
- Issue: `"Julio Carvalho"` é o valor inicial de `header_treinador` hardcoded em dois lugares: inicialização do `useState` (linha 665) e `handleNovaFicha` (linha 846) em `client/src/pages/Home.tsx`.
- Files: `client/src/pages/Home.tsx` (linhas 665, 846)
- Impact: O app não é reutilizável por outros personal trainers sem editar o código-fonte. Ao clicar "Nova Ficha", o nome sempre volta para "Julio Carvalho".
- Fix approach: Persistir o nome do treinador separadamente no localStorage (chave `avaliacao_fisica_treinador`) e usá-lo como valor padrão, com fallback para string vazia.

**Accordion animado com `max-h-[8000px]`:**
- Issue: O componente `Section` em `client/src/pages/Home.tsx` (linha 74) usa `max-height` como proxy de animação de colapso: `max-h-[8000px]` quando aberto, `max-h-0` quando fechado. O valor `8000px` é um chute conservador.
- Files: `client/src/pages/Home.tsx` (linha 74)
- Impact: A transição de abertura é imperceptível (de 0 a 8000px em 300ms — o conteúdo aparece quase de imediato). Se alguma seção crescer além de 8000px, o conteúdo seria cortado. O Framer Motion (já dependência do projeto) oferece `AnimatePresence` + `motion.div` com altura real.
- Fix approach: Substituir pela abordagem com `motion.div` usando `height: "auto"` e `overflow: hidden`.

**Dois formatos de data em `data_avaliacao`:**
- Issue: O header usa `header_data` (formato `"DD/MM/AAAA"` como string livre) que é sincronizado para `data_avaliacao` via `updateField` (linha 709 de `client/src/pages/Home.tsx`). A Seção XI tem um segundo campo `data_avaliacao` editável manualmente (linha 1754) em formato livre `"__/__/____"`. Os dois podem divergir sem aviso.
- Files: `client/src/pages/Home.tsx` (linhas 709, 1754)
- Impact: Um usuário pode editar a data na Seção XI sem perceber que o header já tem outra data. O PDF pode mostrar datas inconsistentes.
- Fix approach: Tornar o campo de Seção XI somente-leitura (espelhando `header_data`) ou remover a duplicação, mantendo apenas uma fonte de verdade.

---

## Known Bugs

**`storage` event não atualiza Relatorio na mesma aba:**
- Symptoms: O evento `window.addEventListener("storage", ...)` em `client/src/pages/Relatorio.tsx` (linha 204) só dispara para mudanças feitas em **outras abas**. Se o usuário navega Home → Relatorio na mesma aba/SPA, o `storage` event não dispara — o Relatorio lê o rascunho do momento da montagem via `useState` inicial (linha 194) e não reage a mudanças feitas no Home durante a mesma sessão.
- Files: `client/src/pages/Relatorio.tsx` (linhas 194–205)
- Trigger: Editar dado no Home, navegar para /relatorio sem recarregar a página.
- Workaround: O dado mais recente está no localStorage (salvo com debounce de 500ms). Funciona se o usuário esperar ~500ms antes de navegar, mas não há garantia. Recarregar a página do Relatorio corrige.

**Seção não abre no PDF se `max-h-0`:**
- Symptoms: Seções colapsadas no momento da exportação PDF são capturadas via `html2canvas-pro` com `max-height: 0` e `overflow: hidden` — o conteúdo não aparece no PDF mesmo que a seção esteja ativa no formData.
- Files: `client/src/lib/pdf.ts`, `client/src/pages/Home.tsx` (linha 74)
- Trigger: Colapsar qualquer `Section` antes de exportar o PDF.
- Workaround: Nenhum automático. O usuário precisa expandir todas as seções antes de exportar. Não há aviso nem expansão automática durante a exportação.

**`ocultos.forEach` não restaura se `exportarPDF` lançar após ocultar:**
- Symptoms: Em `client/src/lib/pdf.ts` (linhas 243–287), os elementos com `.pdf-hide` são ocultados antes do `try` que contém o processamento hero. Se o bloco `finally` do hero restaurar estilos mas o processamento dos grupos falhar depois (ex: seção com conteúdo problemático), `ocultos.forEach((el) => { el.style.display = ""; })` (linha 287) **só é chamado após o `for` de grupos** — fora de um `finally` global. Se uma exceção ocorrer no loop de grupos, os elementos `.pdf-hide` ficam invisíveis.
- Files: `client/src/lib/pdf.ts` (linhas 243, 287)
- Trigger: Erro durante captura de qualquer seção que não o hero.

---

## Security Considerations

**Dados sensíveis de saúde no localStorage sem proteção:**
- Risk: O `localStorage` armazena CPF, histórico de saúde, medicações, doenças, lesões e fotos base64 de pacientes — dados de saúde sensíveis e dados pessoais identificáveis (PII). Qualquer script JavaScript na origem (`avaliacao-fisica-smoky.vercel.app`) pode ler esses dados. Extensões de browser maliciosas ou XSS (se houver) teriam acesso completo.
- Files: `client/src/lib/storage.ts`, `client/src/pages/Home.tsx` (linha 672–677)
- Current mitigation: Nenhuma. Os dados são serializados em JSON puro.
- Recommendations: Para uso pessoal/único treinador, o risco é aceitável. Se o app vier a ser usado por múltiplos treinadores ou dados de múltiplos pacientes, considerar criptografia no localStorage ou migração para solução com autenticação.

**Importação de PDF sem validação de conteúdo:**
- Risk: `importarPDF` em `client/src/lib/pdf.ts` (linha 306) lê qualquer arquivo `.pdf` e executa `JSON.parse` no conteúdo do anexo embutido sem validar o schema do JSON resultante. Um PDF malicioso com um `ficha.json` contendo chaves arbitrárias sobrescreve o formData inteiro.
- Files: `client/src/lib/pdf.ts` (linhas 306–347)
- Current mitigation: O parse lança exceção em JSON inválido (capturado em `handleImportarArquivo`). Mas JSON válido porém com schema inesperado é aceito silenciosamente.
- Recommendations: Adicionar validação de schema básica (verificar que as chaves têm os tipos esperados de `FormDataValue`) antes de chamar `setFormData`.

**Imagens de pacientes em base64 no PDF exportado:**
- Risk: O PDF exportado contém as fotos posturais do paciente embutidas diretamente no JPEG (via `html2canvas-pro`) e também no `ficha.json` anexo (como strings base64). Se o PDF for compartilhado por engano, os dados de imagem do paciente vazam.
- Files: `client/src/lib/pdf.ts` (linhas 292–302)
- Current mitigation: Nenhuma — é uma característica deliberada do design (dados auto-contidos).
- Recommendations: Documentar esse comportamento para o usuário. Sem mudança de arquitetura não há mitigação técnica.

---

## Performance Bottlenecks

**Exportação de PDF — captura sequencial de todas as seções:**
- Problem: `exportarPDF` em `client/src/lib/pdf.ts` (linhas 231–303) captura cada seção em sequência via `await capturarElemento(secao)`. Com 11 seções + hero, são 12+ capturas sequenciais, cada uma invocando `html2canvas-pro` (que percorre o DOM inteiro do elemento). Em fichas completas com fotos, isso pode levar 10–30 segundos.
- Files: `client/src/lib/pdf.ts` (linhas 191–214)
- Cause: As capturas são aguardadas sequencialmente porque o `jsPDF` acumula estado — mas o `html2canvas-pro` em si poderia potencialmente rodar em paralelo se o output fosse buffered.
- Improvement path: Capturar todas as seções em paralelo (`Promise.all`) e depois adicionar ao PDF na ordem correta. Requer refatorar `colocarGrupoNaPagina` para separar captura de inserção.

**localStorage com imagens base64 — risco de quota excedida:**
- Problem: Fotos posturais (até 4 imagens de 9:16) + foto da bioimpedância são armazenadas como strings base64 dentro do `formData` no localStorage. 5 fotos de 2000px × JPEG 0.85 podem totalizar 3–8 MB. O limite típico do localStorage é 5–10 MB por origem.
- Files: `client/src/lib/storage.ts` (linha 22, comentário documenta o risco), `client/src/pages/Home.tsx` (linhas 1136–1147, 1333–1351)
- Cause: Design deliberado (sem servidor). O `salvarRascunho` tem try/catch silencioso, então a falha por quota não é visível ao usuário.
- Improvement path: Exibir um toast de aviso quando `salvarRascunho` falhar por `QuotaExceededError`. Identificável pela instância de `DOMException` com `name === "QuotaExceededError"`.

**`Section` renderiza todo conteúdo mesmo quando colapsado:**
- Problem: O componente `Section` em `client/src/pages/Home.tsx` (linha 74) usa CSS `max-height: 0 + overflow: hidden` para colapsar, mas o JSX filho é sempre renderizado no DOM. Todas as 11 seções (incluindo as tabelas com centenas de inputs) são montadas no DOM ao carregar a página.
- Files: `client/src/pages/Home.tsx` (linha 74)
- Cause: Escolha de implementação simples (CSS toggle vs desmontagem condicional).
- Improvement path: Baixo impacto em performance real (os inputs são leves). O risco maior é para `pdf.ts`, que precisa que o DOM esteja renderizado para capturar — não é candidato à desmontagem.

---

## Fragile Areas

**`importarPDF` — acesso ao PDF via internals não tipados da `pdf-lib`:**
- Files: `client/src/lib/pdf.ts` (linhas 310–347)
- Why fragile: O código de importação acessa estruturas internas da `pdf-lib` via `(obj as any).lookup()`, `.asArray()`, `.get()`, `.getContents()`, `.dict`, etc. — sete casts `as any` para navegar no object graph interno do PDF. Qualquer atualização da `pdf-lib` que altere sua estrutura interna (não sua API pública) quebra a importação silenciosamente ou lança `TypeError` em runtime.
- Safe modification: Sempre testar importação de PDF após atualizar `pdf-lib`. Não atualizar `pdf-lib` como dependência semver automática.
- Test coverage: Nenhum teste automatizado.

**`capturarElemento` — dependência de comportamento do DOM em tempo de captura:**
- Files: `client/src/lib/pdf.ts` (linhas 54–171)
- Why fragile: A função inlineia estilos computados, substitui `<input>` por `<div>`, remove `backdropFilter`, e depende de `getBoundingClientRect()`. Qualquer mudança de layout (nova propriedade CSS, novo elemento filho, mudança de fonte) pode alterar o resultado da captura. A ordem de `bgRestores` (que restaura os estilos no `finally`) é crítica — se uma prop for adicionada antes de outra no mesmo elemento, a restauração pode sobrescrever na ordem errada.
- Safe modification: Testar o PDF visual após qualquer mudança de CSS nas seções ou no design system.
- Test coverage: Nenhum.

**`updateField` — giant switch implícito via `if` encadeado:**
- Files: `client/src/pages/Home.tsx` (linhas 701–808)
- Why fragile: O `useCallback` `updateField` contém 8 blocos `if` com lógica de cálculo automático (IMC, RCQ, Dobras, FC, VO₂). Cada novo cálculo requer edição deste bloco. Os blocos dependem de regex (`/^bioimpedancia_0_\d$/`) e de chaves de tabela específicas (`perimetros_6_0`, `perimetros_7_0`). Se as chaves das tabelas mudarem (ex: reordenar linhas na tabela de perímetros), os cálculos de RCQ quebram silenciosamente.
- Safe modification: Ao reordenar linhas de qualquer tabela, verificar se alguma chave do tipo `tableKey_N_M` é referenciada em `updateField`.
- Test coverage: Nenhum.

**`colocarGrupoNaPagina` — seção maior que A4 é truncada sem aviso:**
- Files: `client/src/lib/pdf.ts` (linhas 191–214)
- Why fragile: Se a altura de uma seção exceder a página A4 disponível, `altFinal = Math.min(altMM, altMaxLocal)` silenciosamente trunca o conteúdo. Não há aviso, quebra de página automática para o conteúdo excedente, nem indicação no PDF de que algo foi cortado. Seções com muitas fotos (ex: Avaliação Postural com 4 fotos verticais) são candidatas a este problema.
- Safe modification: Inspecionar o PDF visual ao adicionar conteúdo que possa crescer verticalmente.
- Test coverage: Nenhum.

---

## Scaling Limits

**Fichas múltiplas — sem suporte:**
- Current capacity: O localStorage guarda apenas uma ficha por vez (chave única `avaliacao_fisica_rascunho`). Não há histórico, lista de alunos, ou namespace por aluno.
- Limit: Um personal trainer com múltiplos alunos precisa exportar o PDF de cada um antes de abrir a ficha do próximo. Abrir "Nova Ficha" apaga o rascunho anterior sem aviso de que não foi exportado.
- Scaling path: Introduzir um sistema de fichas indexadas no localStorage (`avaliacao_fisica_fichas[id]`) com uma listagem na home. Requer refatoração significativa do fluxo de persistência em `client/src/lib/storage.ts`.

**localStorage — limite de 5–10 MB por origem:**
- Current capacity: 5 fotos base64 × ~1 MB cada = ~5 MB. Mais dados textuais = ~5.1–5.5 MB total estimado.
- Limit: Quando a quota é excedida, `salvarRascunho` falha silenciosamente (try/catch vazio em `client/src/lib/storage.ts` linha 25). O usuário não percebe que o rascunho não está sendo salvo.
- Scaling path: Migrar imagens para `IndexedDB` (sem limite prático) e manter apenas dados textuais no localStorage.

---

## Dependencies at Risk

**`heic2any@0.0.4` — versão muito antiga, sem manutenção ativa:**
- Risk: A versão 0.0.4 (de 2019) é a única disponível no npm. O pacote não é atualizado há anos. Depende de `libheif-js` internamente, que pode ter problemas de compatibilidade com novos formatos HEIC do iPhone (HEIC com profundidade, HDR, etc.).
- Impact: Falha silenciosa ao processar fotos HEIC de iPhones mais recentes em Chrome/Firefox. O pipeline tem fallback que exibe toast de erro, mas o usuário perde a imagem.
- Files: `client/src/components/ImageUpload.tsx` (linha 79)
- Migration plan: Avaliar `heic-convert` (wasm-based, mais ativo) como alternativa. No Safari, o fallback nativo funciona sem `heic2any`.

**`html2canvas-pro@2.0.4` — fork, não pacote oficial:**
- Risk: `html2canvas-pro` é um fork comunitário do `html2canvas` oficial (abandonado). Não há garantia de manutenção de longo prazo. Atualizações de CSS do Tailwind ou do browser podem introduzir bugs de renderização não cobertos pelo fork.
- Impact: Quebra na geração visual do PDF sem aviso antecipado.
- Files: `client/src/lib/pdf.ts` (linha 19)
- Migration plan: Monitorar o repositório do fork. Alternativa futura: `html-to-image` (mas incompatível com Safari por `SecurityError`) ou renderização server-side via Puppeteer (requer backend).

---

## Missing Critical Features

**Confirmação antes de "Nova Ficha":**
- Problem: O botão "Nova Ficha" em `client/src/pages/Home.tsx` (linhas 845–849) apaga o rascunho e limpa o formData imediatamente, sem dialog de confirmação. Se o usuário clicar por acidente sem ter exportado o PDF, perde todos os dados.
- Blocks: Segurança básica de dados do paciente.

**Sem indicação de status do rascunho:**
- Problem: O indicador "Rascunho local" na toolbar (linha 944 de `client/src/pages/Home.tsx`) é estático — pisca sempre, independentemente de o rascunho estar atualizado, desatualizado, ou com falha de gravação (quota excedida). Não há feedback de "salvo há X segundos" nem alerta de falha.
- Blocks: O usuário não tem como saber se o rascunho está realmente salvo.

**Sem expansão automática de seções durante exportação:**
- Problem: Seções colapsadas não aparecem no PDF (ver Known Bugs). Não há lógica de expansão automática em `exportarPDF` em `client/src/lib/pdf.ts`.
- Blocks: PDFs incompletos gerados silenciosamente quando seções estão colapsadas.

**ErrorBoundary exibe mensagem em inglês:**
- Problem: `client/src/components/ErrorBoundary.tsx` (linha 34) exibe `"An unexpected error occurred."` em inglês. Todo o restante da interface é em PT-BR.
- Blocks: Consistência de idioma.

---

## Test Coverage Gaps

**Sem qualquer teste automatizado:**
- What's not tested: 100% do código. Cálculos científicos (IMC, RCQ, Dobras, VO₂ max, FC de reserva), lógica de importação/exportação de PDF, processamento de imagens HEIC, persistência localStorage, rota de importação com JSON malformado.
- Files: Todo o diretório `client/src/`
- Risk: Regressões em cálculos científicos passam despercebidas. A fórmula Rockport converte peso para libras (`kg × 2.20462`) — um erro numérico aqui afeta diretamente a prescrição de exercícios.
- Priority: Alto para cálculos (`calculateDensity`, `bodyFatFromDensity`, `calculateVO2MaxRockport`). Alto para `importarPDF` (retorna dados que sobrescrevem o estado inteiro). Médio para `capturarElemento` (difícil testar headless).

---

*Concerns audit: 2026-05-30*
