# Fluxos — avaliacao_fisica

## Fluxo de imagens (componente `ImageUpload.tsx`)

1. Usuário arrasta/seleciona arquivo
2. Tenta abrir nativamente
3. Se for HEIC e o browser não suportar → `heic2any` como fallback
4. Redimensiona para no máximo 2000 px no lado maior via Canvas
5. Reencoda como JPEG @ 0.85
6. Converte para data URL base64 via `FileReader.readAsDataURL`
7. String base64 salva no `formData` (ex: `foto_anterior`, `bioimpedancia_imagem`)

## Fluxo Exportar PDF (`client/src/lib/pdf.ts`)

1. `html2canvas-pro` captura cada `.section-card` como JPEG @ scale 2
2. `jspdf` monta PDF A4 com cada captura virando uma página
3. `pdf-lib` carrega o PDF resultante e anexa o `formData` como `ficha.json` via `pdfDoc.attach()`
4. PDF final é baixado pelo navegador

## Fluxo Importar PDF

1. Usuário seleciona PDF exportado anteriormente
2. `pdf-lib` carrega o PDF
3. Código navega no catálogo PDF (`Catalog → Names → EmbeddedFiles`) para localizar `ficha.json`
4. Como o `pdf-lib` salva com `/FlateDecode`, descomprime via `DecompressionStream("deflate")` (API nativa, sem dep extra)
5. JSON descomprimido vira o novo `formData`, hidratando todos os campos

## Lazy loading do Relatório (`client/src/lib/lazy-relatorio.ts`)

O Relatório carrega `recharts` (~340 KB gz) só quando o usuário navega para `/relatorio`.  
O mesmo import serve ao `lazy()` e ao preload — o browser cacheia o chunk, então a 2ª chamada reutiliza a 1ª.

```ts
const carregarRelatorio = () => import("@/pages/Relatorio");
export const Relatorio = lazy(carregarRelatorio);
export const preloadRelatorio = carregarRelatorio;
```
