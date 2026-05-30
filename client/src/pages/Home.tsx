/*
 * Design: "Clinical Sport Journal" — Swiss Design + Editorial Científico
 * Cores: Teal (#0A6B7C) = Composição | Orange (#D4622B) = Performance | Green (#5A8C6A) = Mobilidade
 * Tipografia: DM Sans (títulos) + IBM Plex Mono (dados) + Source Sans 3 (corpo)
 * EDITÁVEL: Todos os campos são interativos para preenchimento digital
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import {
  User, Heart, Ruler, Activity, Move, Dumbbell, FileText,
  ChevronDown, ChevronUp, ClipboardList, Scale, Droplets,
  Camera, BarChart3, FileDown, FileInput, FilePlus,
} from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { getPesoAtual } from "@shared/const";
import { salvarRascunho, carregarRascunho, limparRascunho } from "@/lib/storage";
import { preloadRelatorio } from "@/lib/lazy-relatorio";

const HERO_BANNER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663189802522/jR49oumLd7zjbJQV8Hob98/hero-banner-PrMVEyJGXJ9hx569zktZtv.webp";
const BODY_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663189802522/jR49oumLd7zjbJQV8Hob98/body-composition-bg-RC8TzfA8Dk7pAjBJJNjB2a.webp";
const PERFORMANCE_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663189802522/jR49oumLd7zjbJQV8Hob98/performance-bg-FYPkA93jpAaN2Vu5ELuVWW.webp";
const MOBILITY_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663189802522/jR49oumLd7zjbJQV8Hob98/mobility-bg-mgLt2ux9h3LZePU8SWSXZh.webp";



// ─── Types ────────────────────────────────────────────────────
interface FormData {
  [key: string]: string | number | boolean | string[];
}


// ─── Section Wrapper ──────────────────────────────────────────
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  color: "teal" | "orange" | "green" | "neutral";
  children: React.ReactNode;
  sectionNumber: string;
  defaultOpen?: boolean;
  bgImage?: string;
  pdfJoinPrev?: boolean;
}

function Section({ title, icon, color, children, sectionNumber, defaultOpen = true, bgImage, pdfJoinPrev }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const colorMap = {
    teal: { bar: "bg-teal", badge: "bg-teal/10 text-teal", headerBg: "bg-teal/5", border: "border-teal/20" },
    orange: { bar: "bg-orange", badge: "bg-orange/10 text-orange", headerBg: "bg-orange/5", border: "border-orange/20" },
    green: { bar: "bg-green", badge: "bg-green/10 text-green", headerBg: "bg-green/5", border: "border-green/20" },
    neutral: { bar: "bg-foreground/70", badge: "bg-foreground/10 text-foreground/70", headerBg: "bg-foreground/5", border: "border-foreground/15" },
  };
  const c = colorMap[color];

  return (
    <div className={`section-card bg-card rounded-lg border ${c.border} shadow-sm overflow-hidden transition-all duration-300`} {...(pdfJoinPrev ? { "data-pdf-join": "prev" } : {})}>
      <div className="flex">
        <div className={`w-1.5 ${c.bar} shrink-0 print:w-1`} />
        <div className="flex-1">
          <button
            onClick={() => setOpen(!open)}
            className={`w-full flex items-center gap-3 px-5 py-4 ${c.headerBg} hover:opacity-90 transition-opacity no-print:cursor-pointer relative overflow-hidden`}
          >
            {bgImage && (
              <div className="absolute inset-0 opacity-[0.06] bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
            )}
            <span className={`relative flex items-center justify-center w-8 h-8 rounded-md ${c.badge} text-sm font-mono font-semibold`}>{sectionNumber}</span>
            <span className="relative flex items-center gap-2 text-foreground/80">{icon}</span>
            <h2 className="relative font-display font-bold text-lg tracking-tight text-foreground flex-1 text-left">{title}</h2>
            <span className="relative no-print text-foreground/40">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
          </button>
          <div className={`transition-all duration-300 ${open ? "max-h-[8000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden print:max-h-none print:opacity-100"}`}>
            <div className="px-5 py-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Objetivos pré-definidos ──────────────────────────────────
const OBJECTIVES = ["Hipertrofia", "Recomposição Corporal", "Emagrecimento", "Manutenção/Saúde"];
const ACTIVITY_LEVELS = ["Sedentário", "Levemente Ativo", "Moderadamente Ativo", "Muito Ativo"];

// ─── Tag Input (campo com autocomplete e seleção por tags) ────
function TagInput({ label, wide = false, values, onChange, options = OBJECTIVES }: {
  label: string; wide?: boolean; values: string[]; onChange: (v: string[]) => void; options?: string[];
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) => !values.includes(o) && o.toLowerCase().includes(input.toLowerCase()),
  );

  const calcRect = () => {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setDropRect({ top: r.bottom, left: r.left, width: r.width });
    }
  };

  const add = (tag: string) => {
    if (!values.includes(tag)) onChange([...values, tag]);
    setInput("");
    setOpen(false);
  };

  const remove = (tag: string) => onChange(values.filter((v) => v !== tag));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) { e.preventDefault(); add(filtered[0]); }
    if (e.key === "Backspace" && input === "" && values.length > 0) remove(values[values.length - 1]);
    if (e.key === "Escape") setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Portal para o dropdown — escapa do overflow:hidden da Section
  const dropdown = open && filtered.length > 0 && dropRect
    ? createPortal(
        <div
          style={{ position: "fixed", top: dropRect.top + 4, left: dropRect.left, width: dropRect.width, zIndex: 9999 }}
          className="bg-card border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); add(opt); }}
              className="w-full text-left px-4 py-2.5 font-body text-sm text-foreground/70 hover:bg-teal/5 hover:text-teal transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={wide ? "col-span-2" : ""} ref={containerRef}>
      <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="min-h-9 w-full border-b-2 border-dashed border-foreground/15 focus-within:border-primary/50 transition-colors pb-1">
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {values.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-display font-semibold bg-teal/10 text-teal border border-teal/20">
                {tag}
                <button type="button" onClick={() => remove(tag)} className="hover:text-teal/60 transition-colors leading-none ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); calcRect(); setOpen(true); }}
          onFocus={() => { calcRect(); setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? "Selecione ou digite..." : ""}
          className="bg-transparent outline-none font-body text-sm text-foreground/80 placeholder:text-foreground/20 w-full h-7"
        />
      </div>
      {dropdown}
    </div>
  );
}

// ─── Editable Input Field ─────────────────────────────────────
function Field({ label, wide = false, mono = false, value, onChange, placeholder }: {
  label: string; wide?: boolean; mono?: boolean; value?: string; onChange?: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder || ""}
        className={`w-full h-9 bg-transparent border-b-2 border-dashed border-foreground/15 focus:border-primary/50 outline-none transition-colors ${mono ? "font-mono" : "font-body"} text-sm text-foreground/80 placeholder:text-foreground/20`}
      />
    </div>
  );
}

// ─── Editable Textarea ────────────────────────────────────────
function LinesField({ label, lines = 3, value, onChange, placeholder }: {
  label: string; lines?: number; value?: string; onChange?: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-2">{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder || ""}
        rows={lines}
        className="w-full bg-transparent border-b-2 border-dashed border-foreground/15 focus:border-primary/50 outline-none transition-colors font-body text-sm text-foreground/80 placeholder:text-foreground/20 resize-none leading-8"
      />
    </div>
  );
}

// ─── Date Input (DD / MM / AAAA) with auto-advance ───────────
function DateInputField({ label, value, onChange }: {
  label: string; value?: string; onChange?: (v: string) => void;
}) {
  // Parse initial value (stored as YYYY-MM-DD)
  const parse = (v?: string) => {
    if (!v) return { d: "", m: "", y: "" };
    const parts = v.split("-");
    return { d: parts[2] || "", m: parts[1] || "", y: parts[0] || "" };
  };

  const [local, setLocal] = useState(() => parse(value));
  const refMes = useRef<HTMLInputElement>(null);
  const refAno = useRef<HTMLInputElement>(null);

  // Sincroniza com `value` quando ele muda fora do componente — ex: o usuário
  // clica em "Nova Ficha" ou "Importar PDF" e o formData inteiro é substituído.
  // Sem isso, o estado interno `local` segura o valor antigo na tela.
  useEffect(() => {
    setLocal(parse(value));
  }, [value]);

  const commit = (d: string, m: string, y: string) => {
    if (d && m && y && y.length === 4) {
      onChange?.(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else if (!d && !m && !y) {
      onChange?.("");
    }
  };

  const handleDay = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 2);
    setLocal((prev) => { commit(clean, prev.m, prev.y); return { ...prev, d: clean }; });
    if (clean.length === 2) refMes.current?.focus();
  };

  const handleMonth = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 2);
    setLocal((prev) => { commit(prev.d, clean, prev.y); return { ...prev, m: clean }; });
    if (clean.length === 2) refAno.current?.focus();
  };

  const handleYear = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4);
    setLocal((prev) => { commit(prev.d, prev.m, clean); return { ...prev, y: clean }; });
  };

  const inputCls = "w-full h-9 bg-transparent border-b-2 border-dashed border-foreground/15 focus:border-primary/50 outline-none transition-colors font-mono text-sm text-foreground/80 text-center placeholder:text-foreground/20";

  return (
    <div>
      <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-end gap-1">
        <div className="flex-1">
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={local.d}
            onChange={(e) => handleDay(e.target.value)}
            placeholder="DD"
            className={inputCls}
          />
        </div>
        <span className="pb-1.5 text-foreground/30 font-mono text-sm">/</span>
        <div className="flex-1">
          <input
            ref={refMes}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={local.m}
            onChange={(e) => handleMonth(e.target.value)}
            placeholder="MM"
            className={inputCls}
          />
        </div>
        <span className="pb-1.5 text-foreground/30 font-mono text-sm">/</span>
        <div className="flex-[2]">
          <input
            ref={refAno}
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={local.y}
            onChange={(e) => handleYear(e.target.value)}
            placeholder="AAAA"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Clickable Scale ──────────────────────────────────────────
function ScaleField({ label, value, onChange }: { label: string; value?: number; onChange?: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 10 }).map((_, i) => {
          const num = i + 1;
          const isSelected = value === num;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(num)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-200
                ${isSelected
                  ? "bg-primary text-primary-foreground border-2 border-primary/80"
                  : "border-2 border-foreground/20 text-foreground/40 hover:border-primary/40 hover:text-primary/60"
                }`}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Radio Check ──────────────────────────────────────────────
function RadioCheck({ label, checked, onChange }: { label: string; checked?: boolean; onChange?: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-2 group"
    >
      <div className={`w-4.5 h-4.5 border-2 rounded-sm shrink-0 flex items-center justify-center transition-all duration-200
        ${checked ? "bg-primary border-primary" : "border-foreground/25 group-hover:border-primary/40"}`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm font-body text-foreground/70">{label}</span>
    </button>
  );
}

// ─── Editable Data Table ──────────────────────────────────────
function EditableTable({ headers, rows, tableKey, formData, updateField }: {
  headers: string[]; rows: string[]; tableKey: string; formData: FormData; updateField: (key: string, val: string) => void;
}) {
  const colCount = headers.length - 1;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`py-2.5 px-3 text-left font-display font-semibold text-foreground/70 text-xs uppercase tracking-wider ${i === 0 ? "bg-muted/60 w-[180px]" : "bg-muted/40 text-center"} border-b border-border`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
              <td className="py-2 px-3 font-body font-medium text-foreground/80 border-b border-border/50">{row}</td>
              {Array.from({ length: colCount }).map((_, j) => {
                const cellKey = `${tableKey}_${i}_${j}`;
                return (
                  <td key={j} className="py-1 px-1.5 text-center border-b border-border/50">
                    <input
                      type="text"
                      value={(formData[cellKey] as string) || ""}
                      onChange={(e) => updateField(cellKey, e.target.value)}
                      className="w-full h-7 bg-transparent text-center font-mono text-sm text-foreground/70 border-b border-dashed border-foreground/10 focus:border-primary/50 outline-none transition-colors"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Cálculo de IMC ──────────────────────────────────────────
function calculateIMC(peso: string, altura: string): string {
  const p = parseFloat(peso);
  const a = parseFloat(altura);
  if (!p || !a || p <= 0 || a <= 0) return "";
  const imc = p / ((a / 100) ** 2);
  return imc.toFixed(1);
}

// ─── Cálculo de Idade a partir da Data de Nascimento ─────────
function calculateAge(birthDate: string): string {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? String(age) : "";
}

// ─── Cálculo de Relação Cintura/Quadril ──────────────────────
function calculateRCQ(cintura: string, quadril: string): string {
  const c = parseFloat(cintura);
  const q = parseFloat(quadril);
  if (!c || !q || c <= 0 || q <= 0) return "";
  return (c / q).toFixed(2);
}

// ─── Configuração de protocolos de dobras cutâneas ───────────
// Índices das dobras: 0=Peitoral, 1=Biciptal, 2=Triciptal, 3=Axilar Média,
// 4=Subescapular, 5=Supra-ilíaca, 6=Abdominal, 7=Coxa Média, 8=Panturrilha
const DOBRAS_PROTOCOL_CONFIG: Record<string, { male: number[]; female: number[] }> = {
  "JP7":      { male: [0, 2, 3, 4, 5, 6, 7], female: [0, 2, 3, 4, 5, 6, 7] },
  "Guedes":   { male: [2, 5, 6],              female: [4, 5, 7] },
  "Petroski": { male: [2, 4, 5, 8],           female: [3, 5, 7, 8] },
};

// ─── Cálculo de Densidade Corporal ──────────────────────────
function calculateDensity(protocol: string, sexo: string, idade: string, dobrasValues: number[]): number | null {
  const age = parseFloat(idade);
  const isMale = sexo === "Masculino";
  const v = (i: number) => dobrasValues[i] || 0;

  if (protocol === "JP7") {
    const sum = v(0) + v(2) + v(3) + v(4) + v(5) + v(6) + v(7);
    if (sum <= 0 || !age) return null;
    return isMale
      ? 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age
      : 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age;
  }

  if (protocol === "Guedes") {
    if (isMale) {
      const sum = v(2) + v(5) + v(6);
      if (sum <= 0) return null;
      return 1.17136 - 0.06706 * Math.log10(sum);
    } else {
      const sum = v(4) + v(5) + v(7);
      if (sum <= 0) return null;
      return 1.16650 - 0.07063 * Math.log10(sum);
    }
  }

  if (protocol === "Petroski") {
    if (isMale) {
      const sum = v(2) + v(4) + v(5) + v(8);
      if (sum <= 0 || !age) return null;
      return 1.10726863 - 0.00081201 * sum + 0.00000212 * sum * sum - 0.00041761 * age;
    } else {
      const sum = v(3) + v(5) + v(7) + v(8);
      if (sum <= 0 || !age) return null;
      return 1.19547130 - 0.07513507 * Math.log10(sum) - 0.00041072 * age;
    }
  }

  return null;
}

// ─── Conversão Densidade → % Gordura ────────────────────────
function bodyFatFromDensity(density: number, formula: string): number {
  if (formula === "Brozek") return (457 / density) - 414.2;
  return (495 / density) - 450; // Siri (1961)
}

// ─── Classificação VO₂ Max (ACSM Guidelines, 11ª ed.) ────────
// Limites por sexo e faixa etária (ml/kg/min)
// Retorna: { label, color, percent } onde percent = posição 0–100 na escala global
const VO2_NORMS: Record<string, Record<string, [number, number]>> = {
  Masculino: {
    "20-29": [36, 46], "30-39": [34, 44], "40-49": [31, 41],
    "50-59": [28, 37], "60-69": [24, 33], "70+":   [20, 29],
  },
  Feminino: {
    "20-29": [29, 38], "30-39": [27, 36], "40-49": [24, 33],
    "50-59": [21, 29], "60-69": [18, 25], "70+":   [15, 22],
  },
};

function getVO2AgeGroup(idade: number): string {
  if (idade < 30) return "20-29";
  if (idade < 40) return "30-39";
  if (idade < 50) return "40-49";
  if (idade < 60) return "50-59";
  if (idade < 70) return "60-69";
  return "70+";
}

function getVO2Classification(vo2: number, sexo: string, idadeStr: string): {
  label: string; sublabel: string; color: string; percent: number; limLow: number; limHigh: number;
} {
  const idade = parseFloat(idadeStr);
  const sexoKey = sexo === "Masculino" ? "Masculino" : "Feminino";
  const ageGroup = getVO2AgeGroup(isNaN(idade) ? 25 : idade);
  const [low, high] = VO2_NORMS[sexoKey]?.[ageGroup] ?? [30, 42];

  // Escala visual: o mínimo absoluto é 10, o máximo é high + 20
  const scaleMin = 10;
  const scaleMax = high + 20;
  const percent = Math.min(100, Math.max(0, ((vo2 - scaleMin) / (scaleMax - scaleMin)) * 100));

  if (vo2 < low)        return { label: "Fraco",     sublabel: "Abaixo da média para sua faixa etária", color: "#DC2626", percent, limLow: low, limHigh: high };
  if (vo2 < high)       return { label: "Regular",   sublabel: "Dentro da média para sua faixa etária", color: "#D97706", percent, limLow: low, limHigh: high };
  return               { label: "Bom / Excelente", sublabel: "Acima da média para sua faixa etária",  color: "#16A34A", percent, limLow: low, limHigh: high };
}

// ─── Cálculo de VO₂ Max — Teste de Cooper (1968) ────────────
// VO₂max (ml/kg/min) = (Distância em metros − 504.9) / 44.73
function calculateVO2MaxCooper(distancia: string): string {
  const dist = parseFloat(distancia);
  if (!dist || dist <= 0) return "";
  return Math.max(0, (dist - 504.9) / 44.73).toFixed(1);
}

// Converte "MM:SS" → minutos decimais (ex: "14:30" → 14.5). Aceita decimal puro como fallback.
function mmssParaMinutos(valor: string): number {
  if (!valor) return 0;
  if (valor.includes(":")) {
    const [mm, ss] = valor.split(":");
    return parseInt(mm, 10) + parseInt(ss || "0", 10) / 60;
  }
  return parseFloat(valor);
}

// ─── Cálculo de VO₂ Max — Teste de Rockport / 1-Mile Walk (Kline et al., 1987)
// VO₂max = 132.853 − 0.0769×Peso(lbs) − 0.3877×Idade + 6.315×Sexo(1=M,0=F) − 3.2649×Tempo(min) − 0.1565×FC
// ATENÇÃO: peso deve ser convertido de kg para libras (× 2.20462)
function calculateVO2MaxRockport(pesoKg: string, sexo: string, idade: string, tempo: string, fcFinal: string): string {
  const kg = parseFloat(pesoKg);
  const age = parseFloat(idade);
  const t = mmssParaMinutos(tempo);
  const fc = parseFloat(fcFinal);
  const isMale = sexo === "Masculino";

  if (!kg || !age || !t || !fc || kg <= 0 || age <= 0 || t <= 0 || fc <= 0) return "";

  const lbs = kg * 2.20462;
  const sexoVal = isMale ? 1 : 0;
  const vo2 = 132.853 - (0.0769 * lbs) - (0.3877 * age) + (6.315 * sexoVal) - (3.2649 * t) - (0.1565 * fc);
  return Math.max(0, vo2).toFixed(1);
}

// ─── FC Máxima Estimada — Tanaka, Monahan & Seals (2001) ────
// FCmax = 208 − 0.7 × idade  (mais precisa que 220 − idade)
function calculateFCMax(idade: string): string {
  const age = parseFloat(idade);
  if (!age || age <= 0) return "";
  return Math.round(208 - 0.7 * age).toString();
}

// ─── FC de Reserva — Método de Karvonen ─────────────────────
// FCreserva = FCmax − FCrepouso
function calculateFCReserva(fcMax: string, fcRepouso: string): string {
  const max = parseFloat(fcMax);
  const rep = parseFloat(fcRepouso);
  if (!max || !rep || max <= 0 || rep <= 0) return "";
  return Math.round(max - rep).toString();
}

// ─── Header Date Input (DD/MM/AAAA com auto-avanço) ──────────
function HeaderDateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parseHeader = (v: string) => {
    const parts = v.split("/");
    return { d: parts[0] || "", m: parts[1] || "", y: parts[2] || "" };
  };
  const [local, setLocal] = useState(() => parseHeader(value));
  const refM = useRef<HTMLInputElement>(null);
  const refY = useRef<HTMLInputElement>(null);

  // Mesmo motivo do DateInputField: ressincroniza quando o `value` externo
  // muda (ex: Nova Ficha, Importar PDF).
  useEffect(() => {
    setLocal(parseHeader(value));
  }, [value]);

  const commit = (d: string, m: string, y: string) => onChange([d, m, y].join("/"));

  const inputCls = "bg-transparent text-white font-mono text-sm border-b border-dashed border-white/25 focus:border-white/60 outline-none transition-colors text-center placeholder:text-white/30 h-6";

  return (
    <div className="flex items-center gap-0.5">
      <input type="text" inputMode="numeric" maxLength={2} value={local.d} placeholder="DD"
        className={`${inputCls} w-7`}
        onChange={(e) => {
          const clean = e.target.value.replace(/\D/g, "").slice(0, 2);
          setLocal((p) => { commit(clean, p.m, p.y); return { ...p, d: clean }; });
          if (e.target.value.replace(/\D/g, "").length === 2) refM.current?.focus();
        }}
      />
      <span className="text-white/30 font-mono text-sm">/</span>
      <input ref={refM} type="text" inputMode="numeric" maxLength={2} value={local.m} placeholder="MM"
        className={`${inputCls} w-7`}
        onChange={(e) => {
          const clean = e.target.value.replace(/\D/g, "").slice(0, 2);
          setLocal((p) => { commit(p.d, clean, p.y); return { ...p, m: clean }; });
          if (e.target.value.replace(/\D/g, "").length === 2) refY.current?.focus();
        }}
      />
      <span className="text-white/30 font-mono text-sm">/</span>
      <input ref={refY} type="text" inputMode="numeric" maxLength={4} value={local.y} placeholder="AAAA"
        className={`${inputCls} w-12`}
        onChange={(e) => {
          const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
          setLocal((p) => { commit(p.d, p.m, clean); return { ...p, y: clean }; });
        }}
      />
    </div>
  );
}

export default function Home() {
  // Carrega o rascunho salvo no localStorage na inicialização. Se não houver,
  // começa vazio mas já com o treinador padrão.
  const [formData, setFormData] = useState<FormData>(() => {
    const rascunho = carregarRascunho();
    if (rascunho) {
      // Retrocompatibilidade: objetivo era string em fichas antigas → normaliza para array
      if (typeof rascunho.objetivo === "string") {
        rascunho.objetivo = rascunho.objetivo ? [rascunho.objetivo as string] : [];
      }
      // Retrocompatibilidade: atividade era string em fichas antigas → normaliza para array
      if (typeof rascunho.atividade === "string") {
        rascunho.atividade = rascunho.atividade ? [rascunho.atividade as string] : [];
      }
      return rascunho as FormData;
    }
    return { header_treinador: "Julio Carvalho" };
  });
  const inputImportRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  // Salva o rascunho a cada mudança do formData. Throttle leve via setTimeout
  // para não escrever no localStorage a cada caractere digitado.
  useEffect(() => {
    const timer = setTimeout(() => {
      salvarRascunho(formData as Record<string, string | number | boolean | string[]>);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData]);

  // Pré-carrega o Relatório quando o navegador fica ocioso, pra transição pra
  // /relatorio já achar o chunk pronto. É a rede de segurança do mobile, que
  // não dispara o preload do hover/foco do botão.
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => preloadRelatorio(), { timeout: 200 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => preloadRelatorio(), 200);
    return () => clearTimeout(timer);
  }, []);

  // Recalcula idade sempre que nascimento mudar (inclusive no carregamento inicial)
  useEffect(() => {
    const nasc = formData.nascimento as string;
    if (!nasc) return;
    const age = calculateAge(nasc);
    if (age && age !== String(formData.idade)) {
      setFormData((prev) => ({ ...prev, idade: age, dc_idade: age }));
    }
  }, [formData.nascimento]);

  const updateField = useCallback((key: string, value: string | number | boolean) => {
    // Normaliza vírgula → ponto em valores numéricos (ex: "70,5" → "70.5")
    if (typeof value === "string" && value.includes(",") && /^\d+,\d*$/.test(value.trim())) {
      value = value.replace(",", ".");
    }
    setFormData((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "header_data") next.data_avaliacao = value as string;

      // Cálculo automático de Idade a partir da Data de Nascimento
      if (key === "nascimento") {
        const age = calculateAge(next.nascimento as string);
        if (age) {
          next.idade = age;
          next.dc_idade = age;
        }
      }

      // Cálculo automático de IMC (dispara por Peso ou campo altura)
      if (/^bioimpedancia_0_\d$/.test(key) || key === "altura") {
        const imc = calculateIMC(getPesoAtual(next), next.altura as string);
        if (imc) next.imc = imc;
      }
      
      // Cálculo automático de RCQ
      if (key === "cintura" || key === "quadril" || key.startsWith("perimetros_")) {
        const cintura = next.perimetros_6_0 as string; // Cintura na tabela
        const quadril = next.perimetros_7_0 as string; // Quadril na tabela
        const rcq = calculateRCQ(cintura, quadril);
        if (rcq) next.rcq = rcq;
      }
      
      // Cálculo automático de Dobras Cutâneas (Somatório, Densidade, % Gordura)
      if (key.startsWith("dobras_") || key === "dc_protocolo" || key === "dc_sexo" || key === "dc_idade" || key === "dc_formula") {
        const protocol = next.dc_protocolo as string;
        const sexo = next.dc_sexo as string;
        const idade = next.dc_idade as string;
        const formula = (next.dc_formula as string) || "Siri";

        if (protocol && sexo) {
          // Determina quais colunas recalcular
          const colMatch = key.match(/^dobras_\d+_(\d+)$/);
          const cols = colMatch ? [parseInt(colMatch[1])] : [0, 1, 2, 3, 4, 5];

          const config = DOBRAS_PROTOCOL_CONFIG[protocol];
          const activeIndices = config
            ? (sexo === "Masculino" ? config.male : config.female)
            : [0, 1, 2, 3, 4, 5, 6, 7, 8];

          for (const col of cols) {
            const dobrasValues = Array.from({ length: 9 }, (_, i) =>
              parseFloat(next[`dobras_${i}_${col}`] as string) || 0
            );

            const sum = activeIndices.reduce((acc, idx) => acc + dobrasValues[idx], 0);

            if (sum > 0) {
              next[`dobras_9_${col}`] = sum.toFixed(1);

              const density = calculateDensity(protocol, sexo, idade, dobrasValues);
              if (density !== null) {
                next[`dobras_10_${col}`] = density.toFixed(7);
                next[`dobras_11_${col}`] = Math.max(0, bodyFatFromDensity(density, formula)).toFixed(1);
              }
            } else {
              next[`dobras_9_${col}`] = "";
              next[`dobras_10_${col}`] = "";
              next[`dobras_11_${col}`] = "";
            }
          }
        }
      }
      
      // Cálculo automático de FC Máxima Estimada e FC de Reserva
      if (key === "nascimento" || key === "idade" || key === "fc_repouso") {
        const idade = next.idade as string;
        const fcMax = calculateFCMax(idade);
        if (fcMax) {
          next.fc_max_estimada = fcMax;
          const fcRes = calculateFCReserva(fcMax, next.fc_repouso as string);
          if (fcRes) next.fc_reserva = fcRes;
          else next.fc_reserva = "";
        }
      }

      // Cálculo automático de VO₂ Max (Cooper ou Rockport)
      if (key === "vo2_formula" || key === "cooper_distancia" || key === "rockport_tempo" || key === "rockport_fc_final" || /^bioimpedancia_0_\d$/.test(key) || key === "nascimento") {
        const testType = next.vo2_formula as string;

        if (testType === "cooper") {
          const vo2 = calculateVO2MaxCooper(next.cooper_distancia as string);
          if (vo2) next.vo2_resultado = vo2;
        } else if (testType === "rockport") {
          const vo2 = calculateVO2MaxRockport(
            getPesoAtual(next),
            (next.genero as string) || "",
            next.idade as string,
            next.rockport_tempo as string,
            next.rockport_fc_final as string,
          );
          if (vo2) next.vo2_resultado = vo2;
        }
      }
      
      return next;
    });
  }, []);

  const commitCardioToTable = useCallback(() => {
    setFormData((prev) => {
      if (!prev.vo2_resultado || parseFloat(prev.vo2_resultado as string) <= 0) return prev;
      const firstEmptyCol = [0, 1, 2, 3, 4, 5].find(
        (j) => !(prev[`cardio_0_${j}`] as string)?.trim()
      );
      if (firstEmptyCol === undefined) return prev;
      const next = { ...prev };
      next[`cardio_0_${firstEmptyCol}`] = prev.vo2_resultado as string;
      if (prev.fc_repouso) next[`cardio_1_${firstEmptyCol}`] = prev.fc_repouso as string;
      const fcMax = prev.vo2_formula === "cooper" ? prev.cooper_fc_max : prev.rockport_fc_final;
      if (fcMax) next[`cardio_2_${firstEmptyCol}`] = fcMax as string;
      if (prev.pa_repouso) next[`cardio_3_${firstEmptyCol}`] = prev.pa_repouso as string;
      return next;
    });
  }, []);

  // Abre o Relatório só depois de garantir que o pacote de gráficos já carregou,
  // pra animação de transição rodar sobre o conteúdo real (e não sobre o
  // "Carregando..."). O teto de 400ms evita travar o clique em conexão lenta.
  const abrirRelatorio = async (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // deixa abrir em nova aba
    e.preventDefault();
    try {
      await Promise.race([
        preloadRelatorio(),
        new Promise<void>((resolve) => setTimeout(resolve, 400)),
      ]);
    } catch {
      /* se o download falhar, navega mesmo assim — o ErrorBoundary cobre */
    }
    navigate("/relatorio");
  };

  // Handlers do fluxo Export / Import / Nova Ficha
  const handleNovaFicha = () => {
    setFormData({ header_treinador: "Julio Carvalho" });
    limparRascunho();
    toast.success("Ficha em branco aberta. O rascunho anterior foi apagado.");
  };

  // Dynamic import: as libs de PDF (pdf-lib + jspdf + html2canvas-pro) só carregam
  // quando o usuário clica em Exportar/Importar. Reduz o bundle inicial em ~200KB.
  const handleExportarPDF = async () => {
    try {
      toast.info("Gerando PDF... isso pode levar alguns segundos.");
      const { exportarPDF } = await import("@/lib/pdf");
      const nomeAluno = (formData.header_nome as string) || (formData.nome as string) || "ficha";
      await exportarPDF(
        formData as Record<string, string | number | boolean | string[]>,
        nomeAluno,
      );
      toast.success("PDF exportado com sucesso.");
    } catch (err) {
      console.error("[Home] erro ao exportar PDF", err);
      toast.error("Não foi possível exportar o PDF. Tente novamente.");
    }
  };

  const handleImportarClick = () => {
    inputImportRef.current?.click();
  };

  const handleImportarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reseta o input para permitir reimportar o mesmo arquivo
    try {
      const { importarPDF } = await import("@/lib/pdf");
      const dados = await importarPDF(file);
      setFormData(dados as FormData);
      toast.success("Ficha importada com sucesso.");
    } catch (err) {
      console.error("[Home] erro ao importar PDF", err);
      const msg = err instanceof Error ? err.message : "PDF inválido";
      toast.error(`Não foi possível importar: ${msg}`);
    }
  };

  const dateHeaders = ["Medida", "Aval. 1", "Aval. 2", "Aval. 3", "Aval. 4", "Aval. 5", "Aval. 6"];

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero Header ─── */}
      <header className="pdf-hero relative overflow-hidden" style={{ backgroundColor: '#0A3D47' }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_BANNER})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A3D47]/90 via-[#0A6B7C]/75 to-[#0A6B7C]/50" />
        <div className="relative container py-10 md:py-14">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-white/50 uppercase tracking-[0.3em] mb-2">Prontuário Esportivo</p>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                Ficha de<br /><span className="text-orange-light">Avaliação Física</span>
              </h1>
              <p className="mt-3 font-body text-sm text-white/60 max-w-md">
                
              </p>
            </div>
          </div>

          {/* Quick info bar */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Nome do Aluno", icon: <User size={14} />, key: "header_nome" },
              { label: "Data da Avaliação", icon: <FileText size={14} />, key: "header_data" },
              { label: "Nº da Ficha", icon: <ClipboardList size={14} />, key: "header_ficha" },
              { label: "Treinador", icon: <Activity size={14} />, key: "header_treinador" },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10">
                <div className="flex items-center gap-1.5 text-white/40 mb-1">
                  {item.icon}
                  <span className="text-[10px] font-mono uppercase tracking-wider">{item.label}</span>
                </div>
                {item.key === "header_data"
                  ? <HeaderDateInput value={(formData.header_data as string) || ""} onChange={(v) => updateField("header_data", v)} />
                  : <input
                      type="text"
                      value={(formData[item.key] as string) || ""}
                      onChange={(e) => updateField(item.key, e.target.value)}
                      className="w-full h-6 bg-transparent text-white font-mono text-sm border-b border-dashed border-white/25 focus:border-white/60 outline-none transition-colors placeholder:text-white/20"
                      placeholder="Preencher..."
                    />
                }
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Toolbar ─── */}
      <div className="no-print sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-foreground/40">
            <div className="w-2 h-2 rounded-full bg-orange animate-pulse" />
            <span>Rascunho local · <span className="text-orange/80">Não esqueça de exportar o PDF</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleNovaFicha} className="flex items-center gap-1.5 text-xs font-display font-semibold text-foreground/60 hover:text-primary px-3 py-1.5 rounded-md hover:bg-primary/5 transition-colors">
              <FilePlus size={13} /> Nova Ficha
            </button>
            <button onClick={handleImportarClick} className="flex items-center gap-1.5 text-xs font-display font-semibold text-teal hover:text-teal/80 px-3 py-1.5 rounded-md hover:bg-teal/5 transition-colors">
              <FileInput size={13} /> Importar PDF
            </button>
            <button onClick={handleExportarPDF} className="flex items-center gap-1.5 text-xs font-display font-semibold text-orange hover:text-orange/80 px-3 py-1.5 rounded-md hover:bg-orange/5 transition-colors">
              <FileDown size={13} /> Exportar PDF
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <a href="/relatorio" onClick={abrirRelatorio} onMouseEnter={() => preloadRelatorio()} onFocus={() => preloadRelatorio()} className="flex items-center gap-1.5 text-xs font-display font-semibold text-green hover:text-green/80 px-3 py-1.5 rounded-md hover:bg-green/5 transition-colors">
              <BarChart3 size={13} /> Relatório
            </a>
          </div>
        </div>
        <input
          ref={inputImportRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleImportarArquivo}
        />
      </div>

      {/* ─── Content ─── */}
      <main className="container py-8 space-y-6">

        {/* ─── I. Dados Pessoais ─── */}
        <Section title="Dados Pessoais" icon={<User size={18} />} color="neutral" sectionNumber="I">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
            <Field label="Nome Completo" value={formData.nome as string} onChange={(v) => updateField("nome", v)} placeholder="Nome completo do aluno" />
            <div>
              <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-1.5">CPF</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={14}
                value={(formData.cpf as string) || ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  let formatted = digits;
                  if (digits.length > 9) formatted = digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6, 9) + "-" + digits.slice(9);
                  else if (digits.length > 6) formatted = digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6);
                  else if (digits.length > 3) formatted = digits.slice(0, 3) + "." + digits.slice(3);
                  updateField("cpf", formatted);
                }}
                className="w-full h-9 bg-transparent border-b-2 border-dashed border-border/60 focus:border-foreground/40 outline-none font-mono text-sm text-foreground/80 transition-colors"
                placeholder="000.000.000-00"
              />
            </div>
            <DateInputField
              label="Data de Nascimento"
              value={(formData.nascimento as string) || ""}
              onChange={(v) => updateField("nascimento", v)}
            />
            <div>
              <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-1.5">Idade</label>
              <input
                type="text"
                value={(formData.idade as string) || ""}
                readOnly
                className="w-full h-9 bg-transparent border-b-2 border-dashed border-green/40 outline-none font-mono text-sm text-green/70 cursor-not-allowed"
                placeholder="Calculado automaticamente"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-1.5">Nº de Telefone</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={15}
                value={(formData.telefone as string) || ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  let formatted = digits;
                  if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                  if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                  updateField("telefone", formatted);
                }}
                placeholder="(00) 00000-0000"
                className="w-full h-9 bg-transparent border-b-2 border-dashed border-foreground/15 focus:border-primary/50 outline-none transition-colors font-mono text-sm text-foreground/80 placeholder:text-foreground/20"
              />
            </div>
            <Field label="Email" value={formData.email as string} onChange={(v) => updateField("email", v)} placeholder="email@exemplo.com" />
            <Field label="Profissão" value={formData.profissao as string} onChange={(v) => updateField("profissao", v)} placeholder="Autônomo(a)" />
            <div>
              <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-2">Sexo</label>
              <div className="flex gap-5">
                {["Masculino", "Feminino"].map((g) => (
                  <RadioCheck key={g} label={g} checked={formData.genero === g} onChange={() => {
                    updateField("genero", g);
                    updateField("dc_sexo", g);
                  }} />
                ))}
              </div>
            </div>
            <TagInput
              label="Objetivo Principal"
              values={(Array.isArray(formData.objetivo) ? formData.objetivo : []) as string[]}
              onChange={(v) => setFormData((prev) => ({ ...prev, objetivo: v }))}
            />
          </div>
        </Section>

        {/* ─── II. Anamnese de Saúde ─── */}
        <Section title="Anamnese de Saúde" icon={<Heart size={18} />} color="neutral" sectionNumber="II" pdfJoinPrev>
          <div className="space-y-6">
            <h3 className="font-display font-bold text-sm text-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Heart size={14} className="text-destructive/60" /> Histórico de Saúde
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <LinesField label="Doenças Pré-existentes" lines={2} value={formData.doencas as string} onChange={(v) => updateField("doencas", v)} placeholder="Listar doenças pré-existentes..." />
              <LinesField label="Medicações Atuais" lines={2} value={formData.medicacoes as string} onChange={(v) => updateField("medicacoes", v)} placeholder="Listar medicações em uso..." />
              <LinesField label="Lesões Anteriores / Atuais (Tipo, local e data)" lines={2} value={formData.lesoes as string} onChange={(v) => updateField("lesoes", v)} placeholder="Descrever lesões..." />
              <LinesField label="Cirurgias (Tipo, data e recuperação)" lines={2} value={formData.cirurgias as string} onChange={(v) => updateField("cirurgias", v)} placeholder="Descrever cirurgias..." />
              <Field label="Alergias" value={formData.alergias as string} onChange={(v) => updateField("alergias", v)} placeholder="Listar alergias..." />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-2">Fumante</label>
                  <div className="flex gap-4">
                    {["Sim", "Não"].map((opt) => (
                      <RadioCheck key={opt} label={opt} checked={formData.fumante === opt} onChange={() => updateField("fumante", opt)} />
                    ))}
                  </div>
                </div>
                <Field label="Consumo de Álcool" value={formData.alcool as string} onChange={(v) => updateField("alcool", v)} placeholder="Frequência..." />
              </div>
              <LinesField label="Histórico Familiar (Doenças relevantes)" lines={2} value={formData.historico_familiar as string} onChange={(v) => updateField("historico_familiar", v)} placeholder="Doenças na família..." />
              <LinesField label="Restrições Médicas" lines={2} value={formData.restricoes as string} onChange={(v) => updateField("restricoes", v)} placeholder="Atividades não permitidas pelo médico..." />
            </div>
          </div>
        </Section>

        {/* ─── III. Anamnese Comportamental ─── */}
        <Section title="Anamnese Comportamental e Estilo de Vida" icon={<Droplets size={18} />} color="neutral" sectionNumber="III">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ScaleField label="Nível de Estresse (1-10)" value={formData.estresse as number} onChange={(v) => updateField("estresse", v)} />
            <ScaleField label="Qualidade do Sono (1-10)" value={formData.sono_qualidade as number} onChange={(v) => updateField("sono_qualidade", v)} />
            <Field label="Horas de Sono por Noite" mono value={formData.sono_horas as string} onChange={(v) => updateField("sono_horas", v)} placeholder="Ex: 7h" />
            <Field label="Rotina de Trabalho (Sedentário / Ativo / Horas sentado)" value={formData.rotina as string} onChange={(v) => updateField("rotina", v)} />
            <TagInput
              label="Nível de Atividade Física Atual"
              options={ACTIVITY_LEVELS}
              values={(Array.isArray(formData.atividade) ? formData.atividade : []) as string[]}
              onChange={(v) => setFormData((prev) => ({ ...prev, atividade: v }))}
            />
            <Field label="Hidratação (Litros de água/dia)" mono value={formData.hidratacao as string} onChange={(v) => updateField("hidratacao", v)} placeholder="Ex: 2L" />
            <LinesField label="Experiência Prévia com Exercícios (Modalidades, tempo, preferências)" lines={2} value={formData.experiencia as string} onChange={(v) => updateField("experiencia", v)} />
            <LinesField label="Barreiras para o Exercício (Tempo, motivação, dor)" lines={2} value={formData.barreiras as string} onChange={(v) => updateField("barreiras", v)} />
            <LinesField label="Hábitos Alimentares (Descrição breve, restrições)" lines={3} value={formData.alimentacao as string} onChange={(v) => updateField("alimentacao", v)} />
          </div>
        </Section>

        {/* ─── IV. Composição Corporal ─── */}
        <div className="print-break" />
        <Section title="Composição Corporal (Bioimpedância)" icon={<Scale size={18} />} color="teal" sectionNumber="IV" bgImage={BODY_BG}>
          {/* Cartões de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
            {[
              { label: "Altura (cm)", key: "altura" },
              { label: "IMC", key: "imc" },
              { label: "Relação Cintura/Quadril", key: "rcq" },
            ].map((item) => (
              <div key={item.key} className="bg-teal/5 rounded-lg p-3 border border-teal/10">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-teal/60 mb-1">{item.label}</label>
                <input
                  type="text"
                  value={(formData[item.key] as string) || ""}
                  onChange={(e) => updateField(item.key, e.target.value)}
                  className="w-full h-7 bg-transparent border-b-2 border-dashed border-teal/20 focus:border-teal/50 outline-none font-mono text-lg text-foreground/80 transition-colors"
                  placeholder="—"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-4 items-stretch print:gap-3">
            {/* Tabela à esquerda */}
            <div className="flex-1 min-w-0">
              <EditableTable
                headers={dateHeaders}
                rows={["Peso Total (kg)", "Água Corporal (kg)", "Massa Proteica (kg)", "Minerais (kg)", "Massa M. Esquelética (kg)", "Massa Gorda (kg)", "Gordura Visceral (nível)", "Percentual de Gordura (%)", "%GC Sub-cutânea (%)", "Taxa Metabólica Basal (kcal)", "Idade Metabólica"]}
                tableKey="bioimpedancia"
                formData={formData}
                updateField={updateField}
              />
            </div>

            {/* Imagem da balança à direita */}
            <div className="w-96 shrink-0 print:w-72 flex flex-col">
              <div className="relative flex-1">
                <ImageUpload
                  label={"Relatório da\nbioimpedância"}
                  icon={<Scale size={22} className="text-teal/40" />}
                  initialUrl={formData.bioimpedancia_imagem as string}
                  onUpload={(dataUrl) => updateField("bioimpedancia_imagem", dataUrl)}
                  onRemove={() => updateField("bioimpedancia_imagem", "")}
                  color="teal"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ─── V. Antropometria ─── */}
        <Section title="Medidas Antropométricas" icon={<Ruler size={18} />} color="teal" sectionNumber="V" bgImage={BODY_BG} pdfJoinPrev>
          <div className="space-y-6">
            <div>
              <h3 className="font-display font-bold text-sm text-teal/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Ruler size={14} /> Perímetros Corporais (cm)
              </h3>
              <EditableTable
                headers={dateHeaders}
                rows={["Ombro", "Braço D", "Braço E", "Braço C", "Tórax", "Cintura", "Abdômen", "Quadril", "Coxa D", "Coxa E", "Panturrilha D", "Panturrilha E"]}
                tableKey="perimetros"
                formData={formData}
                updateField={updateField}
              />
            </div>
          </div>
        </Section>

        {/* ─── VI. Dobras Cutâneas ─── */}
        <Section title="Dobras Cutâneas" icon={<ClipboardList size={18} />} color="teal" sectionNumber="VI">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-teal/60 mb-1">Protocolo</label>
                <select
                  value={(formData.dc_protocolo as string) || ""}
                  onChange={(e) => updateField("dc_protocolo", e.target.value)}
                  className="w-full h-7 bg-transparent border-b-2 border-dashed border-teal/20 focus:border-teal/50 outline-none font-mono text-sm text-foreground/80 transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="JP7">Jackson &amp; Pollock 7 (1978/1980)</option>
                  <option value="Guedes">Guedes (1985)</option>
                  <option value="Petroski">Petroski (1995)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-teal/60 mb-1">Fórmula</label>
                <select
                  value={(formData.dc_formula as string) || ""}
                  onChange={(e) => updateField("dc_formula", e.target.value)}
                  className="w-full h-7 bg-transparent border-b-2 border-dashed border-teal/20 focus:border-teal/50 outline-none font-mono text-sm text-foreground/80 transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="Siri">Siri (1961)</option>
                  <option value="Brozek">Brozek</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-teal/60 mb-1">Adipômetro</label>
                <input
                  type="text"
                  value={(formData.dc_adipometro as string) || ""}
                  onChange={(e) => updateField("dc_adipometro", e.target.value)}
                  className="w-full h-7 bg-transparent border-b-2 border-dashed border-teal/20 focus:border-teal/50 outline-none font-mono text-sm text-foreground/80 transition-colors"
                  placeholder="Preencher..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-teal/60 mb-1">Sexo</label>
                <input
                  type="text"
                  value={(formData.genero as string) || ""}
                  disabled
                  className="w-full h-7 bg-transparent border-b-2 border-dashed border-green/40 text-green/70 cursor-not-allowed outline-none font-mono text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-teal/60 mb-1">Idade</label>
                <input
                  type="text"
                  value={(formData.idade as string) || ""}
                  disabled
                  className="w-full h-7 bg-transparent border-b-2 border-dashed border-green/40 text-green/70 cursor-not-allowed outline-none font-mono text-sm transition-colors"
                />
              </div>
            </div>

            {/* Tabela de Dobras Cutâneas */}
            {(() => {
              const protocol = (formData.dc_protocolo as string) || "";
              const sexo = (formData.dc_sexo as string) || (formData.genero as string) || "";

              const skinfoldRows = [
                { label: "Peitoral (mm)", index: 0 },
                { label: "Biciptal (mm)", index: 1 },
                { label: "Triciptal (mm)", index: 2 },
                { label: "Axilar Média (mm)", index: 3 },
                { label: "Subescapular (mm)", index: 4 },
                { label: "Supra-ilíaca (mm)", index: 5 },
                { label: "Abdominal (mm)", index: 6 },
                { label: "Coxa Média (mm)", index: 7 },
                { label: "Panturrilha (mm)", index: 8 },
              ];

              const config = protocol ? DOBRAS_PROTOCOL_CONFIG[protocol] : null;
              const activeIndices = config && sexo
                ? (sexo === "Masculino" ? config.male : config.female)
                : skinfoldRows.map((r) => r.index);

              const colHeaders = ["Medida", "Aval. 1", "Aval. 2", "Aval. 3", "Aval. 4", "Aval. 5", "Aval. 6"];
              const colCount = colHeaders.length - 1;

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        {colHeaders.map((h, i) => (
                          <th key={i} className={`py-2.5 px-3 text-left font-display font-semibold text-foreground/70 text-xs uppercase tracking-wider ${i === 0 ? "bg-muted/60 w-[180px]" : "bg-muted/40 text-center"} border-b border-border`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {skinfoldRows.map((row) => {
                        const isActive = activeIndices.includes(row.index);
                        return (
                          <tr key={row.index} className={`${row.index % 2 === 0 ? "bg-card" : "bg-muted/20"} transition-opacity duration-200 ${!isActive ? "opacity-25" : ""}`}>
                            <td className="py-2 px-3 font-body font-medium text-foreground/80 border-b border-border/50">{row.label}</td>
                            {Array.from({ length: colCount }).map((_, j) => {
                              const cellKey = `dobras_${row.index}_${j}`;
                              return (
                                <td key={j} className="py-1 px-1.5 text-center border-b border-border/50">
                                  <input
                                    type="text"
                                    value={(formData[cellKey] as string) || ""}
                                    onChange={(e) => updateField(cellKey, e.target.value)}
                                    disabled={!isActive}
                                    className={`w-full h-7 bg-transparent text-center font-mono text-sm border-b border-dashed outline-none transition-colors ${
                                      isActive
                                        ? "text-foreground/70 border-foreground/10 focus:border-primary/50"
                                        : "text-foreground/20 border-foreground/5 cursor-not-allowed"
                                    }`}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {/* Somatório */}
                      <tr className="bg-teal/5">
                        <td className="py-2 px-3 font-body font-semibold text-teal/80 border-b border-border/50">Somatório (mm)</td>
                        {Array.from({ length: colCount }).map((_, j) => (
                          <td key={j} className="py-1 px-1.5 text-center border-b border-border/50">
                            <input type="text" value={(formData[`dobras_9_${j}`] as string) || ""} readOnly className="w-full h-7 bg-transparent text-center font-mono text-sm text-teal/70 border-b border-dashed border-teal/20 outline-none cursor-not-allowed" />
                          </td>
                        ))}
                      </tr>
                      {/* Densidade Corporal */}
                      <tr className="bg-teal/5">
                        <td className="py-2 px-3 font-body font-semibold text-teal/80 border-b border-border/50">Densidade Corporal</td>
                        {Array.from({ length: colCount }).map((_, j) => (
                          <td key={j} className="py-1 px-1.5 text-center border-b border-border/50">
                            <input type="text" value={(formData[`dobras_10_${j}`] as string) || ""} readOnly className="w-full h-7 bg-transparent text-center font-mono text-sm text-teal/70 border-b border-dashed border-teal/20 outline-none cursor-not-allowed" />
                          </td>
                        ))}
                      </tr>
                      {/* % Gordura Estimado */}
                      <tr className="bg-teal/10">
                        <td className="py-2 px-3 font-body font-bold text-teal border-b border-border/50">% Gordura Estimado</td>
                        {Array.from({ length: colCount }).map((_, j) => (
                          <td key={j} className="py-1 px-1.5 text-center border-b border-border/50">
                            <input type="text" value={(formData[`dobras_11_${j}`] as string) || ""} readOnly className="w-full h-7 bg-transparent text-center font-mono text-sm font-bold text-teal border-b border-dashed border-teal/30 outline-none cursor-not-allowed" />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </Section>

        {/* ─── VII. Avaliação Postural ─── */}
        <div className="print-break" />
        <Section title="Avaliação Postural" icon={<Camera size={18} />} color="green" sectionNumber="VII" bgImage={MOBILITY_BG}>
          <div className="space-y-6">
            <p className="text-sm font-body text-foreground/50 italic">
              Clique em cada quadro para adicionar a foto postural do aluno. Clique no &times; para remover.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2">
              {[
                { label: "Anterior", key: "foto_anterior" },
                { label: "Posterior", key: "foto_posterior" },
                { label: "Lateral Direita", key: "foto_lateral_dir" },
                { label: "Lateral Esquerda", key: "foto_lateral_esq" },
              ].map((view) => (
                <div key={view.key} className="aspect-[3/4] print:aspect-[2/3]">
                  <ImageUpload
                    label={view.label}
                    icon={<Camera size={22} className="text-green/40" />}
                    initialUrl={formData[view.key] as string}
                    onUpload={(dataUrl) => updateField(view.key, dataUrl)}
                    onRemove={() => updateField(view.key, "")}
                    color="green"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LinesField label="Desvios e Assimetrias Observadas" lines={4} value={formData.desvios as string} onChange={(v) => updateField("desvios", v)} placeholder="Descrever desvios posturais observados..." />
              <LinesField label="Encurtamentos Musculares Visíveis" lines={4} value={formData.encurtamentos as string} onChange={(v) => updateField("encurtamentos", v)} placeholder="Descrever encurtamentos..." />
            </div>
          </div>
        </Section>

        {/* ─── VIII. Testes de Mobilidade ─── */}
        <Section title="Avaliação de Movimento e Mobilidade" icon={<Move size={18} />} color="green" sectionNumber="VIII" bgImage={MOBILITY_BG} pdfJoinPrev>
          <div className="space-y-4">
            <p className="text-sm font-body text-foreground/50 italic">
              Cada exercício é pontuado de{" "}
              <span className="font-semibold not-italic text-red-500">0</span>
              {" "}a{" "}
              <span className="font-semibold not-italic text-green-600">3</span>
              {" "}— onde{" "}
              <span className="text-red-500 not-italic">0 = dor</span>
              {" "}e{" "}
              <span className="text-green-600 not-italic">3 = movimento perfeito</span>.
            </p>
            <EditableTable
              headers={["Teste", ...dateHeaders.slice(1)]}
              rows={["Deep Squat", "Hurdle Step", "Inline Lunge", "Shoulder Mobility", "Active Straight Leg Raise", "Trunk Stability Push-Up", "Rotary Stability"]}
              tableKey="mobilidade"
              formData={formData}
              updateField={updateField}
            />
            {(() => {
              const FMS_ROWS = 7;
              const FMS_COLS = 6;
              // Encontra a coluna mais recente com ao menos um valor preenchido
              let activeCol = -1;
              for (let j = FMS_COLS - 1; j >= 0; j--) {
                for (let i = 0; i < FMS_ROWS; i++) {
                  const v = parseFloat((formData[`mobilidade_${i}_${j}`] as string) || "");
                  if (!isNaN(v)) { activeCol = j; break; }
                }
                if (activeCol !== -1) break;
              }
              if (activeCol === -1) return null;

              let total = 0;
              for (let i = 0; i < FMS_ROWS; i++) {
                const v = parseFloat((formData[`mobilidade_${i}_${activeCol}`] as string) || "");
                if (!isNaN(v)) total += v;
              }

              const MAX = 21;
              const CUTOFF = 15;
              const passed = total >= CUTOFF;
              const pct = Math.min((total / MAX) * 100, 100);
              const barColor = passed ? "bg-green-500" : "bg-red-500";
              const textColor = passed ? "text-green-600" : "text-red-500";
              const label = passed ? "Dentro da normalidade" : "Abaixo do corte";
              const evalLabel = dateHeaders.slice(1)[activeCol];

              return (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                      Pontuação FMS — {evalLabel}
                    </span>
                    <span className={`text-xs font-semibold font-mono uppercase tracking-wider ${textColor}`}>
                      {label}
                    </span>
                  </div>
                  <div className="flex items-end gap-3">
                    <span className={`text-3xl font-display font-bold tabular-nums ${textColor}`}>{total}</span>
                    <span className="text-sm font-mono text-foreground/40 mb-1">/ {MAX}</span>
                    <span className="text-xs font-body text-foreground/35 mb-1 ml-auto">corte ≥ {CUTOFF}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-foreground/30">
                    <span>0</span>
                    <span className="relative">
                      <span className="absolute -translate-x-1/2" style={{ left: `${(CUTOFF / MAX) * 100}%` }}>
                        {CUTOFF}
                      </span>
                    </span>
                    <span>{MAX}</span>
                  </div>
                </div>
              );
            })()}
            <LinesField
              label="Observações de Mobilidade"
              lines={3}
              value={formData.obs_mobilidade as string}
              onChange={(v) => updateField("obs_mobilidade", v)}
              placeholder="Ex: mobilidade reduzida no ombro direito, sentiu dores ao executar Shoulder Mobility..."
            />
          </div>
        </Section>

        {/* ─── IX. Performance e Força ─── */}
        <div className="print-break" />
        <Section title="Avaliação de Força" icon={<Dumbbell size={18} />} color="orange" sectionNumber="IX" bgImage={PERFORMANCE_BG}>
          <div className="space-y-6">
            <EditableTable
              headers={["Medida (Kg)", "Aval. 1", "Aval. 2", "Aval. 3", "Aval. 4", "Aval. 5", "Aval. 6"]}
              rows={["Levantamento Terra", "Leg Press 45˚", "Cadeira Extensora", "Rosca Scott", "Elevação Lateral"]}
              tableKey="forca"
              formData={formData}
              updateField={updateField}
            />
            <LinesField label="Observações sobre a Avaliação de Força" lines={3} value={formData.obs_forca as string} onChange={(v) => updateField("obs_forca", v)} placeholder="Anotar observações sobre a avaliação de força..." />
          </div>
        </Section>

        {/* ─── X. Condicionamento Cardiorrespiratório ─── */}
        <Section title="Condicionamento Cardiorrespiratório" icon={<Activity size={18} />} color="orange" sectionNumber="X" pdfJoinPrev>
          <div className="space-y-6">

              {/* Dados do Aluno (auto-preenchidos) + FC Repouso */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                {[
                  { label: "Peso (kg)", value: getPesoAtual(formData), auto: true },
                  { label: "Idade", value: formData.idade as string, auto: true },
                  { label: "Sexo", value: formData.genero as string, auto: true },
                  { label: "FC Máx Estimada", value: formData.fc_max_estimada as string, auto: true, hint: "Tanaka (2001)" },
                  { label: "FC de Reserva", value: formData.fc_reserva as string, auto: true, hint: "Karvonen" },
                ].map((item) => (
                  <div key={item.label} className="bg-orange/5 rounded-lg p-2.5 border border-orange/10 overflow-hidden">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-orange/50 mb-0.5 leading-tight">
                      {item.label}
                    </label>
                    <input
                      type="text"
                      value={item.value || ""}
                      readOnly
                      className="w-full h-6 bg-transparent border-none outline-none font-mono text-sm text-orange/60 cursor-not-allowed"
                      placeholder="—"
                    />
                    {item.hint && <span className="block text-[9px] font-mono text-orange/30 mt-0.5 leading-tight">({item.hint})</span>}
                  </div>
                ))}
              </div>

              {/* FC de Repouso e PA — Entradas manuais com cinta */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                <div className="bg-orange/5 rounded-lg p-2.5 border border-orange/15">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-orange/60 mb-0.5">FC de Repouso (bpm) <span className="text-orange/30">— Cinta Cardíaca</span></label>
                  <input
                    type="number"
                    value={(formData.fc_repouso as string) || ""}
                    onChange={(e) => updateField("fc_repouso", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitCardioToTable(); }}
                    placeholder="Ex: 68"
                    className="w-full h-6 bg-transparent border-b border-dashed border-orange/20 focus:border-orange/50 outline-none font-mono text-sm text-foreground/80 transition-colors"
                  />
                </div>
                <div className="bg-orange/5 rounded-lg p-2.5 border border-orange/15">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-orange/60 mb-0.5">PA em Repouso (mmHg)</label>
                  <input
                    type="text"
                    value={(formData.pa_repouso as string) || ""}
                    onChange={(e) => updateField("pa_repouso", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitCardioToTable(); }}
                    placeholder="Ex: 120/80"
                    className="w-full h-6 bg-transparent border-b border-dashed border-orange/20 focus:border-orange/50 outline-none font-mono text-sm text-foreground/80 transition-colors"
                  />
                </div>
              </div>

              {/* Seletor de Teste */}
              <div className="mb-5 p-4 bg-orange/5 rounded-lg border border-orange/10">
                <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-3">Selecione o Teste de VO₂ Max</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateField("vo2_formula", "cooper")}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-mono text-sm font-semibold transition-all ${
                      formData.vo2_formula === "cooper"
                        ? "bg-orange text-white border border-orange shadow-md"
                        : "bg-white/50 border border-orange/20 text-foreground/70 hover:border-orange/50"
                    }`}
                  >
                    <div>Teste de Cooper</div>
                    <div className={`text-[10px] font-body font-normal mt-0.5 ${formData.vo2_formula === "cooper" ? "text-white/70" : "text-foreground/40"}`}>Corrida 12 min — Atlético / Ativo</div>
                  </button>
                  <button
                    onClick={() => updateField("vo2_formula", "rockport")}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-mono text-sm font-semibold transition-all ${
                      formData.vo2_formula === "rockport"
                        ? "bg-orange text-white border border-orange shadow-md"
                        : "bg-white/50 border border-orange/20 text-foreground/70 hover:border-orange/50"
                    }`}
                  >
                    <div>Teste de Rockport</div>
                    <div className={`text-[10px] font-body font-normal mt-0.5 ${formData.vo2_formula === "rockport" ? "text-white/70" : "text-foreground/40"}`}>Caminhada 1 milha — Sedentário / Moderado</div>
                  </button>
                </div>
              </div>

              {/* Campos do Teste de Cooper */}
              {formData.vo2_formula === "cooper" && (
                <div className="mb-5 p-4 bg-orange/5 rounded-lg border border-orange/15 space-y-4">
                  <h4 className="text-xs font-display font-bold text-orange/70 uppercase tracking-wider">Teste de Cooper (1968) — Corrida de 12 minutos</h4>
                  <p className="text-xs font-body text-foreground/40">O aluno corre/caminha o máximo possível em 12 minutos. Registre a distância total e a FC máxima atingida com a cinta cardíaca.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-2">Distância Percorrida (metros)</label>
                      <input
                        type="number"
                        value={(formData.cooper_distancia as string) || ""}
                        onChange={(e) => updateField("cooper_distancia", e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitCardioToTable(); }}
                        placeholder="Ex: 2400"
                        className="w-full px-3 py-2 bg-white/50 border border-orange/20 rounded text-sm font-mono focus:outline-none focus:border-orange/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-2">FC Máxima Atingida (bpm) <span className="text-foreground/30">— Cinta</span></label>
                      <input
                        type="number"
                        value={(formData.cooper_fc_max as string) || ""}
                        onChange={(e) => updateField("cooper_fc_max", e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitCardioToTable(); }}
                        placeholder="Ex: 185"
                        className="w-full px-3 py-2 bg-white/50 border border-orange/20 rounded text-sm font-mono focus:outline-none focus:border-orange/50"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-foreground/30 pt-1">
                    Fórmula: VO₂max = (Distância − 504.9) / 44.73
                  </div>
                </div>
              )}

              {/* Campos do Teste de Rockport */}
              {formData.vo2_formula === "rockport" && (
                <div className="mb-5 p-4 bg-orange/5 rounded-lg border border-orange/15 space-y-4">
                  <h4 className="text-xs font-display font-bold text-orange/70 uppercase tracking-wider">Teste de Rockport / 1-Mile Walk (Kline et al., 1987)</h4>
                  <p className="text-xs font-body text-foreground/40">O aluno caminha 1 milha (1.609 km) no menor tempo possível. Registre o tempo e a FC imediatamente ao final com a cinta cardíaca.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-2">Tempo para 1 Milha (MM:SS)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={(formData.rockport_tempo as string) || ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (digits.length === 0) { updateField("rockport_tempo", ""); return; }
                          if (digits.length <= 2) { updateField("rockport_tempo", digits); return; }
                          let mm = Math.min(parseInt(digits.slice(0, 2), 10), 59);
                          const ssPart = digits.slice(2);
                          const ss = ssPart.length === 2 ? String(Math.min(parseInt(ssPart, 10), 59)).padStart(2, "0") : ssPart;
                          updateField("rockport_tempo", `${String(mm).padStart(2, "0")}:${ss}`);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") commitCardioToTable(); }}
                        placeholder="Ex: 14:30"
                        className="w-full px-3 py-2 bg-white/50 border border-orange/20 rounded text-sm font-mono focus:outline-none focus:border-orange/50"
                      />
                      <span className="text-[10px] font-mono text-foreground/30 mt-1 block">1 milha = 1.609 km</span>
                    </div>
                    <div>
                      <label className="block text-xs font-display font-semibold text-foreground/50 uppercase tracking-wider mb-2">FC ao Final do Teste (bpm) <span className="text-foreground/30">— Cinta</span></label>
                      <input
                        type="number"
                        value={(formData.rockport_fc_final as string) || ""}
                        onChange={(e) => updateField("rockport_fc_final", e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitCardioToTable(); }}
                        placeholder="Ex: 140"
                        className="w-full px-3 py-2 bg-white/50 border border-orange/20 rounded text-sm font-mono focus:outline-none focus:border-orange/50"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-foreground/30 pt-1">
                    Fórmula: VO₂max = 132.853 − 0.0769×Peso(lbs) − 0.3877×Idade + 6.315×Sexo − 3.2649×Tempo − 0.1565×FC
                  </div>
                </div>
              )}

              {/* Resultado do VO₂max */}
              {formData.vo2_resultado && (() => {
                const vo2Val = parseFloat(formData.vo2_resultado as string);
                const cls = getVO2Classification(
                  vo2Val,
                  (formData.genero as string) || "Masculino",
                  (formData.idade as string) || "25",
                );
                // posições percentuais dos limites na escala visual
                const sexoKey = (formData.genero as string) === "Masculino" ? "Masculino" : "Feminino";
                const ageGroup = getVO2AgeGroup(parseFloat((formData.idade as string) || "25"));
                const [low, high] = VO2_NORMS[sexoKey]?.[ageGroup] ?? [30, 42];
                const scaleMin = 10;
                const scaleMax = high + 20;
                const toPercent = (v: number) =>
                  Math.min(100, Math.max(0, ((v - scaleMin) / (scaleMax - scaleMin)) * 100));
                const lowPct  = toPercent(low);
                const highPct = toPercent(high);

                return (
                  <>
                    <div className="mb-3 p-4 bg-orange/10 rounded-lg border border-orange/20 flex items-center gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-orange/60 mb-0.5">VO₂ Max Estimado</label>
                        <span className="font-mono text-2xl font-bold text-orange">{formData.vo2_resultado as string}</span>
                        <span className="ml-1.5 text-xs font-mono text-orange/50">ml/kg/min</span>
                      </div>
                      {formData.vo2_formula === "cooper" && formData.cooper_fc_max && formData.fc_max_estimada && (
                        <div className="border-l border-orange/20 pl-4">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-orange/60 mb-0.5">% FC Máx Atingida</label>
                          <span className="font-mono text-lg font-semibold text-orange/80">
                            {Math.round((parseFloat(formData.cooper_fc_max as string) / parseFloat(formData.fc_max_estimada as string)) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Barra de classificação VO₂max */}
                    <div className="mb-5 px-1">
                      {/* trilho da barra */}
                      <div className="relative h-4 rounded-full overflow-hidden flex">
                        {/* faixa vermelha */}
                        <div style={{ width: `${lowPct}%`, background: "#DC2626" }} />
                        {/* faixa amarela */}
                        <div style={{ width: `${highPct - lowPct}%`, background: "#D97706" }} />
                        {/* faixa verde */}
                        <div style={{ flex: 1, background: "#16A34A" }} />
                      </div>

                      {/* marcador (triângulo + linha) */}
                      <div className="relative h-4 mt-0.5" style={{ pointerEvents: "none" }}>
                        <div
                          className="absolute -translate-x-1/2 flex flex-col items-center"
                          style={{ left: `${cls.percent}%` }}
                        >
                          {/* triângulo apontando para cima */}
                          <div
                            style={{
                              width: 0, height: 0,
                              borderLeft: "6px solid transparent",
                              borderRight: "6px solid transparent",
                              borderBottom: `8px solid ${cls.color}`,
                            }}
                          />
                        </div>
                      </div>

                      {/* rótulos dos limites + classificação */}
                      <div className="flex items-center justify-between mt-1.5 px-0.5">
                        <span className="text-[9px] font-mono text-foreground/30">{scaleMin} ml/kg/min</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[11px] font-display font-bold uppercase tracking-wide"
                            style={{ color: cls.color }}
                          >
                            {cls.label}
                          </span>
                          <span className="text-[9px] font-body text-foreground/40">— {cls.sublabel}</span>
                        </div>
                        <span className="text-[9px] font-mono text-foreground/30">{scaleMax} ml/kg/min</span>
                      </div>

                      {/* legenda das faixas */}
                      <div className="flex gap-3 mt-2 justify-center">
                        {[
                          { cor: "#DC2626", texto: `Fraco (< ${low})` },
                          { cor: "#D97706", texto: `Regular (${low}–${high})` },
                          { cor: "#16A34A", texto: `Bom / Excelente (≥ ${high})` },
                        ].map((item) => (
                          <div key={item.texto} className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: item.cor }} />
                            <span className="text-[9px] font-mono text-foreground/40">{item.texto}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Tabela Histórica */}
              <EditableTable
                headers={dateHeaders}
                rows={["VO₂ máx (ml/kg/min)", "FC de Repouso (bpm)", "FC Máx Atingida (bpm)", "PA em Repouso (mmHg)"]}
                tableKey="cardio"
                formData={formData}
                updateField={updateField}
              />
          </div>
        </Section>

        {/* ─── XI. Observações e Assinaturas ─── */}
        <Section title="Observações e Plano de Ação" icon={<FileText size={18} />} color="neutral" sectionNumber="XI">
          <div className="space-y-6">
            <LinesField label="Observações Gerais do Treinador" lines={4} value={formData.observacoes as string} onChange={(v) => updateField("observacoes", v)} placeholder="Anotar observações relevantes..." />
            <LinesField label="Recomendações (Nutricional, Fisioterapia, Descanso, Outros)" lines={3} value={formData.recomendacoes as string} onChange={(v) => updateField("recomendacoes", v)} placeholder="Recomendações para o aluno..." />
            <LinesField label="Plano de Ação Inicial" lines={3} value={formData.plano_acao as string} onChange={(v) => updateField("plano_acao", v)} placeholder="Descrever o plano de ação..." />

            <div className="text-center pt-4">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-foreground/30">Data da Avaliação:</span>
                  <input type="text" value={(formData.data_avaliacao as string) || ""} onChange={(e) => updateField("data_avaliacao", e.target.value)} className="w-32 h-6 bg-transparent text-center font-mono text-xs text-foreground/50 border-b border-dashed border-foreground/20 focus:border-primary/50 outline-none" placeholder="__/__/____" />
                </div>
                <span className="text-foreground/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-foreground/30">Próxima Reavaliação:</span>
                  <input type="text" value={(formData.data_reavaliacao as string) || ""} onChange={(e) => updateField("data_reavaliacao", e.target.value)} className="w-32 h-6 bg-transparent text-center font-mono text-xs text-foreground/50 border-b border-dashed border-foreground/20 focus:border-primary/50 outline-none" placeholder="__/__/____" />
                </div>
              </div>
            </div>
          </div>
        </Section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="no-print bg-foreground/5 border-t border-border py-6 mt-8">
        <div className="container text-center">
          <p className="text-xs font-mono text-foreground/30 uppercase tracking-wider">
            Ficha de Avaliação Física &mdash; Documento Confidencial
          </p>
        </div>
      </footer>
    </div>
  );
}
