import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  label: string;
  icon?: React.ReactNode;
  initialUrl?: string;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
  color?: "teal" | "orange" | "green";
}

// Limite defensivo após o redimensionamento. Como reduzimos a 2000px com
// JPEG 0.85, na prática raramente passa de 1-2 MB.
const TAMANHO_MAX_MB = 5;
const TAMANHO_MAX_BYTES = TAMANHO_MAX_MB * 1024 * 1024;

// Resolução final dos uploads: max 2000px no lado maior. Suficiente para
// fichas de avaliação postural; reduz tempo de processamento e tamanho final
// drasticamente (foto de iPhone 36 MP → ~1500×2000, ~500-1500 KB).
const MAX_LADO_PX = 2000;
const QUALITY_JPEG = 0.85;

function ehHeic(file: File): boolean {
  // Alguns browsers não preenchem file.type para HEIC (Safari macOS notório),
  // então confirmamos pela extensão também.
  const nome = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    nome.endsWith(".heic") ||
    nome.endsWith(".heif")
  );
}

async function carregarComoImagem(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("formato não suportado nativamente")); };
    img.src = url;
  });
}

async function redimensionarParaJpeg(img: HTMLImageElement): Promise<File> {
  // Math.min(1, ...) garante que só REDUZIMOS — nunca aumentamos uma foto pequena.
  const escala = Math.min(1, MAX_LADO_PX / Math.max(img.width, img.height));
  const w = Math.round(img.width * escala);
  const h = Math.round(img.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d não disponível");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY_JPEG),
  );
  if (!blob) throw new Error("canvas.toBlob retornou null");
  return new File([blob], "foto.jpg", { type: "image/jpeg" });
}

// Pipeline em camadas:
// 1. Tenta abrir via <img> nativo. Safari decoda HEIC; Chrome/Firefox não.
// 2. Se falhar e for HEIC, usa heic2any como fallback (lazy import).
// 3. Redimensiona o resultado via Canvas para max 2000px e exporta JPEG.
async function processarImagem(file: File): Promise<File> {
  let img: HTMLImageElement;
  try {
    img = await carregarComoImagem(file);
  } catch {
    if (!ehHeic(file)) throw new Error("não foi possível abrir a imagem");
    // Fallback HEIC. Quality 1.0 aqui porque o Canvas reencoda em 0.85 logo
    // depois — não vale perder qualidade duas vezes.
    const { default: heic2any } = await import("heic2any");
    const jpegBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 1.0 });
    img = await carregarComoImagem(Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob);
  }
  return redimensionarParaJpeg(img);
}

// Converte o File final em string `data:image/jpeg;base64,...`.
// É a forma de embarcar a imagem dentro do formData (e por consequência
// dentro do PDF exportado), sem depender de servidor de arquivos.
async function fileParaDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader falhou ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

const colorMap = {
  teal: {
    border: "border-teal/25 hover:border-teal/50",
    borderDrag: "border-teal bg-teal/10",
    bg: "bg-teal/5 hover:bg-teal/10",
    text: "text-teal/50",
    icon: "text-teal/40",
    button: "text-teal/70 hover:text-red-500 border-teal/20",
  },
  orange: {
    border: "border-orange/25 hover:border-orange/50",
    borderDrag: "border-orange bg-orange/10",
    bg: "bg-orange/5 hover:bg-orange/10",
    text: "text-orange/50",
    icon: "text-orange/40",
    button: "text-orange/70 hover:text-red-500 border-orange/20",
  },
  green: {
    border: "border-green/25 hover:border-green/50",
    borderDrag: "border-green bg-green/10",
    bg: "bg-green/5 hover:bg-green/10",
    text: "text-green/50",
    icon: "text-green/40",
    button: "text-green/70 hover:text-red-500 border-green/20",
  },
};

export function ImageUpload({
  label,
  icon,
  initialUrl,
  onUpload,
  onRemove,
  color = "teal",
}: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [processando, setProcessando] = useState(false);
  const c = colorMap[color];

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/") && !ehHeic(file)) {
      toast.error("Apenas imagens são permitidas.");
      return;
    }

    setProcessando(true);
    try {
      let arquivo: File;
      try {
        arquivo = await processarImagem(file);
      } catch (err) {
        console.error("[ImageUpload] processamento de imagem falhou", err);
        toast.error("Não foi possível processar essa foto. Tente outra.");
        return;
      }

      if (arquivo.size > TAMANHO_MAX_BYTES) {
        const tamanhoMb = (arquivo.size / 1024 / 1024).toFixed(1);
        toast.error(`Imagem muito grande (${tamanhoMb} MB). Limite: ${TAMANHO_MAX_MB} MB.`);
        return;
      }

      const dataUrl = await fileParaDataUrl(arquivo);
      onUpload(dataUrl);
      toast.success("Imagem adicionada.");
    } catch (err) {
      console.error("[ImageUpload] erro ao processar imagem", err);
      toast.error("Erro ao adicionar a imagem. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  if (initialUrl) {
    return (
      <div className="relative w-full h-full min-h-[160px]">
        <img
          src={initialUrl}
          alt={label}
          className="w-full h-full object-contain rounded-lg"
        />
        <button
          onClick={onRemove}
          className={`pdf-hide print:hidden absolute top-2 right-2 bg-white/90 hover:bg-white border ${c.button} rounded-full p-1 transition-colors shadow`}
          title="Remover imagem"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <label
      className={`print:hidden flex flex-col items-center justify-center gap-2 w-full min-h-[160px] rounded-lg border-2 border-dashed cursor-pointer transition-colors ${dragging ? c.borderDrag : `${c.border} ${c.bg}`}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
      />
      {processando ? (
        <Loader2 size={22} className={`${c.icon} animate-spin`} />
      ) : (
        icon ?? <Upload size={22} className={c.icon} />
      )}
      <span className={`text-xs font-mono ${c.text} text-center leading-relaxed px-2`}>
        {label}<br />
        <span className="opacity-70">máx. {TAMANHO_MAX_MB} MB</span>
      </span>
    </label>
  );
}
