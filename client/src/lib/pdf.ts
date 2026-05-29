/**
 * Export e import de fichas em PDF com JSON anexo.
 *
 * O PDF tem duas camadas:
 *   1. Visual — capturado do HTML renderizado via html2canvas-pro + jspdf.
 *      É o que humanos veem (cores, fotos, gráficos).
 *   2. Anexo — um arquivo `ficha.json` embutido via pdf-lib.
 *      É o que o app lê para reimportar e continuar editando.
 *
 * Usamos html2canvas-pro (fork mantido do html2canvas) por dois motivos:
 *   - Funciona no Safari: renderiza cada elemento CSS manualmente, sem o SVG
 *     <foreignObject> que faz o WebKit marcar o canvas como "origin-dirty" e
 *     bloquear canvas.toDataURL() com SecurityError.
 *   - Entende oklch()/oklab() nativamente (cores do Tailwind v4) e corrige o
 *     posicionamento vertical de texto — bugs que o html2canvas oficial (1.4.1,
 *     sem manutenção) nunca resolveu.
 */

import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { PDFDocument, AFRelationship } from "pdf-lib";
import type { FormData } from "./storage";

// ── Constantes do layout PDF ───────────────────────────────────
const A4_LARGURA_MM = 210;
const A4_ALTURA_MM = 297;
const MARGEM_MM = 5;

const NOME_ANEXO = "ficha.json";

// ── Helpers ────────────────────────────────────────────────────
function nomeArquivo(nomeAluno: string): string {
  const nome = nomeAluno
    .trim()
    .replace(/[/\\:*?"<>|]/g, "")
    .slice(0, 60) || "ficha";
  const hoje = new Date();
  const dd = String(hoje.getDate()).padStart(2, "0");
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const yy = String(hoje.getFullYear()).slice(2);
  return `Avaliação Física - ${nome} ${dd}-${mm}-${yy}.pdf`;
}

/**
 * Captura um elemento HTML como data URL JPEG via html2canvas-pro.
 *
 * Antes de capturar, inlinamos algumas propriedades de layout: o html2canvas-pro
 * tem seu próprio parser CSS e nem sempre resolve var(--spacing) do Tailwind v4,
 * então lemos os valores já computados pelo browser e os aplicamos inline.
 * Tudo é restaurado no finally — o usuário nunca vê a mudança.
 *
 * scale 2 = imagem nítida em telas retina.
 */
async function capturarElemento(elemento: HTMLElement): Promise<{
  dataUrl: string;
  largura: number;
  altura: number;
}> {
  const bgRestores: Array<{ el: HTMLElement; prop: string; original: string }> = [];
  const todosEls: HTMLElement[] = [elemento, ...Array.from(elemento.querySelectorAll<HTMLElement>("*"))];

  // Propriedades de layout a inlinar antes da captura.
  // getComputedStyle resolve var(--spacing) do Tailwind v4 para px; o html2canvas-pro
  // lê inline styles diretamente e não precisa resolver var().
  // getBoundingClientRect().height dá a altura REAL renderizada pelo browser —
  // usada como minHeight para o html2canvas-pro nunca renderizar o elemento menor.
  const LAYOUT_INLINE = [
    "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
    "rowGap", "columnGap",
    "height",
  ] as const;

  for (const el of todosEls) {
    const cs = window.getComputedStyle(el);
    const inlineStyle = el.style as unknown as Record<string, string>;

    // Remove background-image externo (http/https) para evitar problemas CORS.
    const inlineBg = el.style.backgroundImage;
    if (inlineBg && /url\(["']?https?:/.test(inlineBg)) {
      bgRestores.push({ el, prop: "backgroundImage", original: inlineBg });
      el.style.backgroundImage = "none";
    }

    // Inline layout props resolvidos pelo browser para contornar var() no html2canvas-pro.
    for (const prop of LAYOUT_INLINE) {
      const val = cs[prop as keyof CSSStyleDeclaration] as string;
      if (!val || val === "auto" || val === "0px") continue;
      const original = inlineStyle[prop] ?? "";
      if (original === val) continue;
      bgRestores.push({ el, prop, original });
      inlineStyle[prop] = val;
    }

    // Seta minHeight = altura real renderizada pelo browser (getBoundingClientRect).
    // Impede o html2canvas-pro de renderizar o elemento menor do que o browser renderiza.
    const rect = el.getBoundingClientRect();
    if (rect.height > 0) {
      const origMin = inlineStyle["minHeight"] ?? "";
      bgRestores.push({ el, prop: "minHeight", original: origMin });
      inlineStyle["minHeight"] = rect.height + "px";
    }

    // Remove backdropFilter: html2canvas-pro não suporta e pode truncar altura.
    if (cs.backdropFilter && cs.backdropFilter !== "none") {
      bgRestores.push({ el, prop: "backdropFilter", original: inlineStyle["backdropFilter"] ?? "" });
      bgRestores.push({ el, prop: "webkitBackdropFilter", original: inlineStyle["webkitBackdropFilter"] ?? "" });
      inlineStyle["backdropFilter"] = "none";
      inlineStyle["webkitBackdropFilter"] = "none";
    }
  }

  // Substitui <input type="text"> por <div> temporário antes da captura.
  // O html2canvas-pro renderiza o texto de <input> sempre na baseline (parte inferior)
  // do campo, ignorando line-height — comportamento interno do motor SÓ para inputs.
  // (O texto de elementos normais — títulos, labels, spans — ele já posiciona certo.)
  // Um <div> com line-height = height centraliza o texto, e o motor respeita isso.
  // O input original é restaurado no finally, invisível para o usuário.
  type InputRestore = { div: HTMLDivElement; input: HTMLInputElement; parent: Node };
  const inputRestores: InputRestore[] = [];

  for (const el of todosEls) {
    if (el.tagName !== "INPUT") continue;
    const input = el as HTMLInputElement;
    if (input.type === "checkbox" || input.type === "radio") continue;

    const div = document.createElement("div");
    div.className = input.className;
    // Herda todos os estilos inline que já aplicamos acima (height, minHeight, etc.)
    div.style.cssText = input.style.cssText;
    // O UA stylesheet do browser adiciona paddingTop/Bottom a inputs. Esse padding
    // foi copiado no cssText acima e interfere no cálculo de line-height:
    // com padding interno, line-height = height empurra o texto para fora da área útil.
    // Zeramos o padding vertical e usamos só o line-height para centrar o texto.
    div.style.paddingTop = "0";
    div.style.paddingBottom = "0";
    const h = div.style.height;
    if (h && h !== "0px") div.style.lineHeight = h;
    div.textContent = input.value;

    const parent = input.parentNode!;
    parent.replaceChild(div, input);
    inputRestores.push({ div, input, parent });
  }

  try {
    // Garante que as fontes (DM Sans, IBM Plex Mono, Source Sans 3) estão no cache
    // do browser antes de renderizar. Sem isso, o html2canvas-pro pode iniciar a
    // renderização antes de as fontes terminarem de carregar.
    await document.fonts.ready;

    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: false,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      foreignObjectRendering: false,
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const largura = elemento.offsetWidth;
    const altura = elemento.offsetHeight;

    return { dataUrl, largura, altura };
  } finally {
    // Restaura inputs (remove divs temporários e recoloca os campos originais)
    inputRestores.forEach(({ div, input, parent }) => { parent.replaceChild(input, div); });
    // Restaura estilos inline dos elementos originais
    bgRestores.forEach(({ el, prop, original }) => { (el.style as unknown as Record<string, string>)[prop] = original; });
  }
}

/**
 * Agrupa seções consecutivas segundo o atributo data-pdf-join="prev".
 */
function agruparSecoes(secoes: HTMLElement[]): HTMLElement[][] {
  const grupos: HTMLElement[][] = [];
  for (const secao of secoes) {
    if (secao.dataset.pdfJoin === "prev" && grupos.length > 0) {
      grupos[grupos.length - 1].push(secao);
    } else {
      grupos.push([secao]);
    }
  }
  return grupos;
}

/**
 * Posiciona todas as seções de um grupo na página atual, empilhando verticalmente.
 */
async function colocarGrupoNaPagina(
  pdf: jsPDF,
  grupo: HTMLElement[],
  larguraDisponivel: number,
  GAP_MM: number,
  yInicio: number,
): Promise<void> {
  let y = yInicio;
  for (const secao of grupo) {
    const captura = await capturarElemento(secao);
    const altMM = (captura.altura / captura.largura) * larguraDisponivel;

    if (y + altMM > A4_ALTURA_MM - MARGEM_MM && y > yInicio) {
      pdf.addPage();
      y = MARGEM_MM;
    }

    const altMaxLocal = A4_ALTURA_MM - MARGEM_MM - y;
    const altFinal = Math.min(altMM, altMaxLocal);
    pdf.addImage(captura.dataUrl, "JPEG", MARGEM_MM, y, larguraDisponivel, altFinal);

    y += altFinal + GAP_MM;
  }
}

/**
 * Dispara o download do blob pelo navegador.
 */
function baixarBlob(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Export ─────────────────────────────────────────────────────
export async function exportarPDF(
  formData: FormData,
  nomeAluno: string,
): Promise<void> {
  const hero = document.querySelector<HTMLElement>(".pdf-hero");
  const secoes = Array.from(document.querySelectorAll<HTMLElement>(".section-card"));

  if (secoes.length === 0) {
    throw new Error("Nenhuma seção encontrada para exportar. Verifique se a ficha está renderizada.");
  }

  const ocultos = Array.from(document.querySelectorAll<HTMLElement>(".pdf-hide"));
  ocultos.forEach((el) => { el.style.display = "none"; });

  const grupos = agruparSecoes(secoes);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const larguraDisponivel = A4_LARGURA_MM - MARGEM_MM * 2;
  const GAP_MM = 3;

  let yAtual = MARGEM_MM;
  if (hero) {
    // overflow:hidden cliparia o conteúdo dos cards. paddingBottom garante que o
    // offsetHeight do hero cresça fisicamente (minHeight é no-op se o conteúdo já cabe).
    const heroSavedOverflow = hero.style.overflow;
    const heroSavedPaddingBottom = hero.style.paddingBottom;
    hero.style.overflow = "visible";
    hero.style.paddingBottom = "40px";

    try {
      const heroCaptura = await capturarElemento(hero);
      const heroAltMM = (heroCaptura.altura / heroCaptura.largura) * larguraDisponivel;
      const heroAltFinal = Math.min(heroAltMM, A4_ALTURA_MM - MARGEM_MM * 2);
      pdf.addImage(heroCaptura.dataUrl, "JPEG", MARGEM_MM, yAtual, larguraDisponivel, heroAltFinal);
      yAtual += heroAltFinal + GAP_MM;
    } catch {
      // Fallback: se a captura do hero falhar (ex: cor CSS não suportada),
      // desenha um retângulo sólido na cor teal (#0A6B7C) no lugar da imagem.
      const heroAltFallbackMM = 40;
      pdf.setFillColor(10, 107, 124); // teal #0A6B7C
      pdf.rect(MARGEM_MM, yAtual, larguraDisponivel, heroAltFallbackMM, "F");
      yAtual += heroAltFallbackMM + GAP_MM;
    } finally {
      hero.style.overflow = heroSavedOverflow;
      hero.style.paddingBottom = heroSavedPaddingBottom;
    }
  }
  if (grupos.length > 0) {
    await colocarGrupoNaPagina(pdf, grupos[0], larguraDisponivel, GAP_MM, yAtual);
  }

  for (let g = 1; g < grupos.length; g++) {
    pdf.addPage();
    await colocarGrupoNaPagina(pdf, grupos[g], larguraDisponivel, GAP_MM, MARGEM_MM);
  }

  ocultos.forEach((el) => { el.style.display = ""; });

  const pdfBytes = pdf.output("arraybuffer");
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const jsonBytes = new TextEncoder().encode(JSON.stringify(formData));
  await pdfDoc.attach(jsonBytes, NOME_ANEXO, {
    mimeType: "application/json",
    description: "Dados estruturados da ficha para reimportação",
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Source,
  });

  const pdfFinal = await pdfDoc.save();
  baixarBlob(new Blob([pdfFinal], { type: "application/pdf" }), nomeArquivo(nomeAluno));
}

// ── Import ─────────────────────────────────────────────────────
export async function importarPDF(arquivo: File): Promise<FormData> {
  const bytes = await arquivo.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes);

  const catalogo = pdfDoc.catalog;
  const namesDict = catalogo.lookup(toName(pdfDoc, "Names"));
  if (!namesDict || !("lookup" in namesDict)) {
    throw new Error("PDF sem anexos — não foi gerado por esse app.");
  }
  const embeddedDict = (namesDict as any).lookup(toName(pdfDoc, "EmbeddedFiles"));
  if (!embeddedDict) {
    throw new Error("PDF sem arquivos embutidos.");
  }
  const namesArray = (embeddedDict as any).lookup(toName(pdfDoc, "Names"));
  if (!namesArray) {
    throw new Error("PDF tem estrutura de anexos inválida.");
  }

  const itens = (namesArray as any).asArray() as any[];
  for (let i = 0; i < itens.length; i += 2) {
    const nome = itens[i].decodeText?.() ?? String(itens[i]);
    if (nome !== NOME_ANEXO) continue;

    const fileSpec = pdfDoc.context.lookup(itens[i + 1]);
    const ef = (fileSpec as any).get(toName(pdfDoc, "EF"));
    const fileStream = (ef as any).get(toName(pdfDoc, "F"));
    const streamObj = pdfDoc.context.lookup(fileStream);
    const conteudoBruto = (streamObj as any).getContents() as Uint8Array;

    const dict = (streamObj as any).dict;
    const filtro = dict?.get?.(toName(pdfDoc, "Filter"));
    const nomeFiltro = filtro?.encodedName ?? filtro?.toString?.() ?? "";

    const conteudoFinal = nomeFiltro.includes("FlateDecode")
      ? await descomprimirDeflate(conteudoBruto)
      : conteudoBruto;

    const textoJson = new TextDecoder().decode(conteudoFinal);
    return JSON.parse(textoJson) as FormData;
  }

  throw new Error(`Anexo "${NOME_ANEXO}" não encontrado no PDF.`);
}

async function descomprimirDeflate(comprimido: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([comprimido]).stream().pipeThrough(new DecompressionStream("deflate"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function toName(pdfDoc: PDFDocument, nome: string) {
  return pdfDoc.context.obj(nome);
}
