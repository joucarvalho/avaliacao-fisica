/*
 * Relatório de Progresso — Documento para o aluno
 * Design: Clinical Sport Journal — profissional e de fácil entendimento.
 * Dados lidos do rascunho local (mesmo formData que o Home edita).
 */

import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Printer, TrendingUp, TrendingDown, Minus,
  Ruler, Scale, Dumbbell, Activity, User, Calendar,
  Heart, FileText, Camera, Move, ClipboardList,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { getPesoAtual } from "@shared/const";
import { carregarRascunho } from "@/lib/storage";

const HERO_BANNER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663189802522/jR49oumLd7zjbJQV8Hob98/hero-banner-PrMVEyJGXJ9hx569zktZtv.webp";

// ─── Types ────────────────────────────────────────────────────
interface FormData {
  [key: string]: string | number | boolean | string[];
}

// ─── Data helpers ────────────────────────────────────────────
function getValues(fd: FormData, table: string, row: number, cols: number): (number | null)[] {
  return Array.from({ length: cols }, (_, j) => {
    const n = parseFloat(fd[`${table}_${row}_${j}`] as string);
    return isNaN(n) ? null : n;
  });
}

function lastValid(arr: (number | null)[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] !== null) return arr[i];
  return null;
}

function firstValid(arr: (number | null)[]): number | null {
  for (let i = 0; i < arr.length; i++) if (arr[i] !== null) return arr[i];
  return null;
}

function evalLabels(cols: number) {
  return Array.from({ length: cols }, (_, i) => `Aval. ${i + 1}`);
}

function buildChart(fd: FormData, table: string, rows: string[], cols: number) {
  return evalLabels(cols).map((label, col) => {
    const entry: Record<string, string | number | null> = { name: label };
    rows.forEach((r, row) => {
      const n = parseFloat(fd[`${table}_${row}_${col}`] as string);
      entry[r] = isNaN(n) ? null : n;
    });
    return entry;
  });
}

// ─── Trend helpers ───────────────────────────────────────────
function calcTrend(arr: (number | null)[]): { diff: number; pct: number; dir: "up" | "down" | "neutral" } | null {
  const f = firstValid(arr);
  const l = lastValid(arr);
  if (f === null || l === null || f === l) {
    if (f !== null && l !== null && f === l) return { diff: 0, pct: 0, dir: "neutral" };
    return null;
  }
  const diff = l - f;
  return { diff, pct: (diff / Math.abs(f)) * 100, dir: diff > 0 ? "up" : "down" };
}

function TrendBadge({ values, invert = false }: { values: (number | null)[]; invert?: boolean }) {
  const t = calcTrend(values);
  if (!t) return <span className="text-[10px] font-mono text-foreground/25">sem dados</span>;

  let cls = "text-foreground/40 bg-foreground/5";
  if (t.dir === "up") cls = invert ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50";
  if (t.dir === "down") cls = invert ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50";

  const Icon = t.dir === "neutral" ? Minus : t.dir === "up" ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${cls}`}>
      <Icon size={11} />
      {t.dir === "neutral" ? "0%" : `${t.diff > 0 ? "+" : ""}${t.pct.toFixed(1)}%`}
    </span>
  );
}

// ─── Tooltip style ───────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    fontFamily: "'Source Sans 3', sans-serif",
    fontSize: 13,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
};

const COLORS = {
  teal: "#0A6B7C",
  orange: "#D4622B",
  green: "#5A8C6A",
  purple: "#7C5AB8",
  gold: "#C4A35A",
  blue: "#3B82F6",
  red: "#EF4444",
  cyan: "#06B6D4",
};

const PALETTE = [COLORS.teal, COLORS.orange, COLORS.green, COLORS.purple, COLORS.gold, COLORS.blue, COLORS.red, COLORS.cyan];

// ─── Section component ───────────────────────────────────────
function ReportSection({ title, icon, accent = "teal", children, className = "" }: {
  title: string; icon: React.ReactNode; accent?: "teal" | "orange" | "green" | "neutral"; children: React.ReactNode; className?: string;
}) {
  const bar: Record<string, string> = { teal: "bg-teal", orange: "bg-orange", green: "bg-green", neutral: "bg-foreground/40" };
  const badge: Record<string, string> = { teal: "text-teal", orange: "text-orange", green: "text-green", neutral: "text-foreground/60" };

  return (
    <div className={`bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden print:shadow-none print:break-inside-avoid ${className}`}>
      <div className="flex">
        <div className={`w-1 ${bar[accent]} shrink-0 print:w-0.5`} />
        <div className="flex-1">
          <div className="px-6 py-4 border-b border-border/40 flex items-center gap-2.5">
            <span className={badge[accent]}>{icon}</span>
            <h2 className="font-display font-bold text-[15px] tracking-tight text-foreground">{title}</h2>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────
function MetricCard({ label, value, unit, values, invert, accent = "teal" }: {
  label: string; value: string; unit: string; values?: (number | null)[]; invert?: boolean; accent?: string;
}) {
  const border: Record<string, string> = { teal: "border-teal/15", orange: "border-orange/15", green: "border-green/15" };
  const bg: Record<string, string> = { teal: "bg-teal/5", orange: "bg-orange/5", green: "bg-green/5" };
  const showTrend = values && values.some((v) => v !== null) && calcTrend(values) !== null;

  return (
    <div className={`rounded-xl p-4 border overflow-hidden ${border[accent] || border.teal} ${bg[accent] || bg.teal}`}>
      <p className="text-[10px] font-mono uppercase tracking-wider text-foreground/40 mb-1.5">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-bold text-foreground/85 leading-none">{value || "—"}</span>
        {value && <span className="text-[11px] font-mono text-foreground/35">{unit}</span>}
      </div>
      {showTrend && (
        <div className="mt-2">
          <TrendBadge values={values!} invert={invert} />
        </div>
      )}
    </div>
  );
}

// ─── Comparison table row ────────────────────────────────────
function CompareRow({ label, values, unit, invert }: {
  label: string; values: (number | null)[]; unit?: string; invert?: boolean;
}) {
  const f = firstValid(values);
  const l = lastValid(values);
  const t = calcTrend(values);
  const diff = t ? t.diff : null;

  return (
    <tr className="border-b border-border/30 last:border-b-0">
      <td className="py-2.5 pr-3 font-body text-sm text-foreground/70 font-medium">{label}</td>
      <td className="py-2.5 px-3 text-center font-mono text-sm text-foreground/50">{f !== null ? f.toFixed(1) : "—"}{unit && f !== null ? ` ${unit}` : ""}</td>
      <td className="py-2.5 px-3 text-center font-mono text-sm font-semibold text-foreground/80">{l !== null ? l.toFixed(1) : "—"}{unit && l !== null ? ` ${unit}` : ""}</td>
      <td className="py-2.5 pl-3 text-center">
        {diff !== null ? (
          <span className={`font-mono text-sm font-semibold ${
            diff === 0 ? "text-foreground/40"
              : (diff > 0 ? (invert ? "text-red-500" : "text-emerald-600") : (invert ? "text-emerald-600" : "text-red-500"))
          }`}>
            {diff === 0 ? "0" : `${diff > 0 ? "+" : ""}${diff.toFixed(1)}`}
          </span>
        ) : <span className="text-foreground/25 text-sm">—</span>}
      </td>
    </tr>
  );
}

// ─── Main Report ─────────────────────────────────────────────
export default function Relatorio() {
  // Lê o rascunho local na inicialização. Como o Home salva a cada mudança,
  // o Relatório sempre tem a versão mais recente que o usuário editou.
  const [formData, setFormData] = useState<FormData>(
    () => (carregarRascunho() ?? {}) as FormData,
  );

  // Atualiza se o usuário voltar para essa aba após ter editado em outra aba.
  // O evento `storage` dispara quando outra aba/janela modifica o localStorage.
  useEffect(() => {
    const onStorage = () => {
      setFormData((carregarRascunho() ?? {}) as FormData);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Student info ─────────────────────────────────
  const nome = (formData.header_nome as string) || (formData.nome as string) || "Aluno";
  const idade = formData.idade as string || "";
  const sexo = formData.genero as string || "";
  const treinador = formData.header_treinador as string || "";
  const dataAval = formData.header_data as string || formData.data_avaliacao as string || "";
  const dataReaval = formData.data_reavaliacao as string || "";

  // ── Antropometria ────────────────────────────────
  const peso = getPesoAtual(formData as Record<string, unknown>);
  const altura = formData.altura as string || "";
  const imc = formData.imc as string || "";
  const rcq = formData.rcq as string || "";

  // ── Bioimpedância ────────────────────────────────
  const bioRows = ["Peso Total (kg)", "Água Corporal (kg)", "Massa Proteica (kg)", "Minerais (kg)", "Massa M. Esquelética (kg)", "Massa Gorda (kg)", "Gordura Visceral (nível)", "Percentual de Gordura (%)", "%GC Sub-cutânea (%)", "Taxa Metabólica Basal (kcal)", "Idade Metabólica"];
  const bioChartData = useMemo(() => buildChart(formData, "bioimpedancia", bioRows, 6), [formData]);

  const pesoVals = getValues(formData, "bioimpedancia", 0, 6);
  const musculoVals = getValues(formData, "bioimpedancia", 4, 6);
  const massaGordaVals = getValues(formData, "bioimpedancia", 5, 6);
  const visceralVals = getValues(formData, "bioimpedancia", 6, 6);
  const gorduraVals = getValues(formData, "bioimpedancia", 7, 6);
  const tmbVals = getValues(formData, "bioimpedancia", 9, 6);

  // ── Dobras Cutâneas ──────────────────────────────
  const protocoloDC = formData.dc_protocolo as string || "";
  const formulaDC = formData.dc_formula as string || "";
  const dcGorduraVals = getValues(formData, "dobras", 11, 6);
  const dcDensidadeVals = getValues(formData, "dobras", 10, 6);
  const dcSomatorioVals = getValues(formData, "dobras", 9, 6);

  // ── Perímetros ───────────────────────────────────
  const perimRows = ["Braço D", "Braço E", "Antebraço D", "Antebraço E", "Tórax", "Abdômen", "Cintura", "Quadril", "Coxa D", "Coxa E", "Panturrilha D", "Panturrilha E"];
  const perimChartData = useMemo(() => buildChart(formData, "perimetros", perimRows, 6), [formData]);

  // ── Força ────────────────────────────────────────
  const forcaRows = ["Levantamento Terra", "Leg Press 45˚", "Cadeira Extensora", "Rosca Scott", "Elevação Lateral"];
  const forcaChartData = useMemo(() => buildChart(formData, "forca", forcaRows, 6), [formData]);

  // ── Cardio ───────────────────────────────────────
  const vo2Resultado = formData.vo2_resultado as string || "";
  const vo2Formula = formData.vo2_formula as string || "";
  const fcRepouso = formData.fc_repouso as string || "";
  const fcMaxEst = formData.fc_max_estimada as string || "";
  const fcReserva = formData.fc_reserva as string || "";
  const cardioVO2Vals = getValues(formData, "cardio", 0, 6);
  const cardioFCRepVals = getValues(formData, "cardio", 1, 6);

  // ── Mobilidade FMS ──────────────────────────────
  const mobilidadeRows = ["Deep Squat", "Hurdle Step", "Inline Lunge", "Shoulder Mobility", "Active Straight Leg Raise", "Trunk Stability Push-Up", "Rotary Stability"];
  const FMS_COLS = 6;
  const mobilidadeChartData = useMemo(() =>
    evalLabels(FMS_COLS).map((label, col) => {
      let total = 0;
      let hasAny = false;
      mobilidadeRows.forEach((_, row) => {
        const n = parseFloat(formData[`mobilidade_${row}_${col}`] as string);
        if (!isNaN(n)) { total += n; hasAny = true; }
      });
      return { name: label, "Pontuação FMS": hasAny ? total : null };
    }),
  [formData]);
  const hasMobilidadeData = mobilidadeRows.some((_, i) =>
    getValues(formData, "mobilidade", i, FMS_COLS).some((v) => v !== null)
  );
  const fmsLastTotal = (() => {
    for (let j = FMS_COLS - 1; j >= 0; j--) {
      let total = 0; let hasAny = false;
      for (let i = 0; i < mobilidadeRows.length; i++) {
        const n = parseFloat(formData[`mobilidade_${i}_${j}`] as string);
        if (!isNaN(n)) { total += n; hasAny = true; }
      }
      if (hasAny) return total;
    }
    return null;
  })();

  // ── Fotos posturais ──────────────────────────────
  const fotos = [
    { key: "foto_anterior", label: "Anterior" },
    { key: "foto_posterior", label: "Posterior" },
    { key: "foto_lateral_dir", label: "Lateral Direita" },
    { key: "foto_lateral_esq", label: "Lateral Esquerda" },
  ].filter((f) => !!formData[f.key]);

  const hasObs = !!(formData.observacoes || formData.recomendacoes || formData.plano_acao);
  const bioimpedanciaImagem = formData.bioimpedancia_imagem as string || "";

  // ── Has any data at all? ─────────────────────────
  const hasData = Object.keys(formData).length > 0;

  // ── Helpers for conditional sections ─────────────
  const hasBioData = pesoVals.some((v) => v !== null);
  const hasDCData = dcGorduraVals.some((v) => v !== null);
  const hasPerimData = perimRows.some((_, i) => getValues(formData, "perimetros", i, 6).some((v) => v !== null));
  const hasForcaData = forcaRows.some((_, i) => getValues(formData, "forca", i, 6).some((v) => v !== null));
  const hasCardioData = !!(vo2Resultado || cardioVO2Vals.some((v) => v !== null));
  const hasFotos = fotos.length > 0;

  // ── IMC classification ───────────────────────────
  const imcNum = parseFloat(imc);
  const imcClass = !imcNum ? "" : imcNum < 18.5 ? "Abaixo do peso" : imcNum < 25 ? "Peso normal" : imcNum < 30 ? "Sobrepeso" : "Obesidade";
  const imcColor = !imcNum ? "" : imcNum < 18.5 ? "text-blue-500" : imcNum < 25 ? "text-emerald-600" : imcNum < 30 ? "text-amber-500" : "text-red-500";

  // Protocol display names
  const protocolNames: Record<string, string> = { JP7: "Jackson & Pollock 7 dobras", Guedes: "Guedes (1985)", Petroski: "Petroski (1995)" };
  const formulaNames: Record<string, string> = { Siri: "Siri (1961)", Brozek: "Brozek" };


  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_BANNER})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A3D47]/93 via-[#0A6B7C]/82 to-[#D4622B]/30" />
        <div className="relative container py-10 md:py-14">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-white/50 uppercase tracking-[0.3em] mb-2">Prontuário Esportivo</p>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                Relatório de<br /><span className="text-orange-light">Progresso</span>
              </h1>
              <p className="mt-3 font-body text-sm text-white/60 max-w-md">

              </p>
            </div>
          </div>

          {/* Student profile bar */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <User size={14} />, label: "Aluno", value: nome },
              { icon: <Calendar size={14} />, label: "Idade / Sexo", value: [idade && `${idade} anos`, sexo].filter(Boolean).join(" · ") || "—" },
              { icon: <Activity size={14} />, label: "Treinador", value: treinador || "—" },
              { icon: <Calendar size={14} />, label: "Data", value: dataAval || "—" },
            ].map((item) => (
              <div key={item.label} className="bg-white/8 backdrop-blur-sm rounded-lg px-3.5 py-3 border border-white/10">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-white/35">{item.icon}</span>
                  <span className="text-[9px] font-mono text-white/35 uppercase tracking-wider">{item.label}</span>
                </div>
                <p className="font-display font-semibold text-white text-sm truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Toolbar ─── */}
      <div className="no-print sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-foreground/40">
            <div className="w-2 h-2 rounded-full bg-teal" />
            <span>Relatório de progresso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs font-display font-semibold text-orange hover:text-orange/80 px-3 py-1.5 rounded-md hover:bg-orange/5 transition-colors">
              <Printer size={13} /> Imprimir
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-xs font-display font-semibold text-teal hover:text-teal/80 px-3 py-1.5 rounded-md hover:bg-teal/5 transition-colors">
              <ClipboardList size={13} /> Ficha
            </button>
          </div>
        </div>
      </div>

      <main className="container py-8 space-y-6">

        {!hasData && (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <Activity size={48} className="mx-auto text-foreground/15 mb-4" />
            <h2 className="font-display font-bold text-xl text-foreground/50 mb-2">Nenhum dado encontrado</h2>
            <p className="font-body text-sm text-foreground/40 mb-6">Preencha a ficha de avaliação primeiro.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-display font-semibold text-sm hover:opacity-90 transition-opacity">
              <ArrowLeft size={16} /> Ir para a Ficha
            </Link>
          </div>
        )}

        {hasData && (
          <>
            {/* ══════════════════════════════════════════════
                1. RESUMO RÁPIDO — Cards de métricas-chave
               ══════════════════════════════════════════════ */}
            <div>
              <h2 className="font-display font-bold text-xs text-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity size={13} /> Resumo da Avaliação
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 print:grid-cols-6 gap-3 print:gap-2">
                <MetricCard label="Peso Total" value={lastValid(pesoVals)?.toFixed(1) || peso} unit="kg" values={pesoVals} accent="teal" />
                <MetricCard label="Massa Muscular" value={lastValid(musculoVals)?.toFixed(1) || ""} unit="kg" values={musculoVals} accent="green" />
                <MetricCard label="Massa Gorda" value={lastValid(massaGordaVals)?.toFixed(1) || ""} unit="kg" values={massaGordaVals} invert accent="orange" />
                <MetricCard label="% Gordura Corporal" value={lastValid(gorduraVals)?.toFixed(1) || lastValid(dcGorduraVals)?.toFixed(1) || ""} unit="%" values={gorduraVals.some((v) => v !== null) ? gorduraVals : dcGorduraVals} invert accent="orange" />
                <MetricCard label="VO₂ Máx" value={vo2Resultado || lastValid(cardioVO2Vals)?.toFixed(1) || ""} unit="ml/kg/min" values={cardioVO2Vals} accent="orange" />
                <MetricCard label="Taxa Metabólica Basal" value={lastValid(tmbVals)?.toFixed(0) || ""} unit="kcal" values={tmbVals} accent="teal" />
              </div>
            </div>

            {/* ══════════════════════════════════════════════
                2. ANTROPOMETRIA — Dados físicos básicos
               ══════════════════════════════════════════════ */}
            {(peso || altura || imc || rcq) && (
              <ReportSection title="Dados Antropométricos" icon={<Ruler size={17} />} accent="teal">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Altura", value: altura, unit: "cm" },
                    { label: "Peso", value: peso, unit: "kg" },
                    { label: "IMC", value: imc, unit: imcClass, extra: imcColor },
                    { label: "Relação Cintura/Quadril", value: rcq, unit: "" },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-foreground/40 mb-1">{item.label}</p>
                      <p className={`font-mono text-xl font-bold ${item.extra || "text-foreground/80"}`}>{item.value || "—"}</p>
                      {item.value && item.unit && <p className="text-[10px] font-mono text-foreground/35 mt-0.5">{item.unit}</p>}
                    </div>
                  ))}
                </div>
              </ReportSection>
            )}

            <div className="print-break" />

            {/* ══════════════════════════════════════════════
                3. COMPOSIÇÃO CORPORAL — Bioimpedância + Gráfico
               ══════════════════════════════════════════════ */}
            {hasBioData && (
              <ReportSection title="Composição Corporal" icon={<Scale size={17} />} accent="teal">
                <div className="space-y-4 print:space-y-3">
                  {/* Chart: Peso × Massa Muscular × Massa Gorda */}
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bioChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                        <YAxis tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} unit=" kg" />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }} />
                        <Area type="monotone" dataKey="Peso Total (kg)" stroke={COLORS.teal} fill={COLORS.teal} fillOpacity={0.08} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                        <Area type="monotone" dataKey="Massa Muscular Esquelética (kg)" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.08} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                        <Area type="monotone" dataKey="Massa Gorda (kg)" stroke={COLORS.orange} fill={COLORS.orange} fillOpacity={0.08} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Comparison table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-border/50">
                          <th className="text-left py-2 pr-3 font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Indicador</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">1ª Aval.</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Última</th>
                          <th className="py-2 pl-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        <CompareRow label="Peso Total" values={pesoVals} unit="kg" />
                        <CompareRow label="Massa Muscular" values={musculoVals} unit="kg" />
                        <CompareRow label="Massa Gorda" values={massaGordaVals} unit="kg" invert />
                        <CompareRow label="% Gordura" values={gorduraVals} unit="%" invert />
                        <CompareRow label="Taxa Metabólica Basal" values={tmbVals} unit="kcal" />
                        <CompareRow label="Gordura Visceral" values={visceralVals} invert />
                      </tbody>
                    </table>
                  </div>

                </div>
              </ReportSection>
            )}

            <div className="print-break" />

            {/* Laudo de Bioimpedância — página isolada */}
            {bioimpedanciaImagem && (
              <ReportSection title="Laudo de Bioimpedância" icon={<Scale size={17} />} accent="teal">
                <img
                  src={bioimpedanciaImagem}
                  alt="Laudo de bioimpedância"
                  className="w-full rounded-lg border border-border/30 object-contain"
                />
              </ReportSection>
            )}

            {bioimpedanciaImagem && <div className="print-break" />}

            {/* ══════════════════════════════════════════════
                4. DOBRAS CUTÂNEAS — % Gordura por protocolo
               ══════════════════════════════════════════════ */}
            {hasDCData && (
              <ReportSection title="Dobras Cutâneas — Percentual de Gordura" icon={<Scale size={17} />} accent="teal">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-xs font-mono">
                    {protocoloDC && (
                      <span className="bg-teal/8 text-teal px-3 py-1.5 rounded-lg border border-teal/15">
                        Protocolo: <strong>{protocolNames[protocoloDC] || protocoloDC}</strong>
                      </span>
                    )}
                    {formulaDC && (
                      <span className="bg-teal/8 text-teal px-3 py-1.5 rounded-lg border border-teal/15">
                        Fórmula: <strong>{formulaNames[formulaDC] || formulaDC}</strong>
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-border/50">
                          <th className="text-left py-2 pr-3 font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Indicador</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">1ª Aval.</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Última</th>
                          <th className="py-2 pl-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        <CompareRow label="Somatório das Dobras" values={dcSomatorioVals} unit="mm" invert />
                        <CompareRow label="Densidade Corporal" values={dcDensidadeVals} />
                        <CompareRow label="% Gordura Estimado" values={dcGorduraVals} unit="%" invert />
                      </tbody>
                    </table>
                  </div>
                </div>
              </ReportSection>
            )}

            {hasDCData && <div className="print-break" />}

            {/* ══════════════════════════════════════════════
                5. PERÍMETROS CORPORAIS — Evolução
               ══════════════════════════════════════════════ */}
            {hasPerimData && (
              <ReportSection title="Perímetros Corporais" icon={<Ruler size={17} />} accent="teal">
                <div className="space-y-4 print:space-y-3">
                  <div className="h-[300px] print:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={perimChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                        <YAxis tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} unit=" cm" />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11 }} />
                        {perimRows.map((label, idx) => {
                          const color = PALETTE[idx % PALETTE.length];
                          return (
                            <Area key={label} type="monotone" dataKey={label} stroke={color} fill={color} fillOpacity={0.08} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                          );
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-border/50">
                          <th className="text-left py-2 pr-3 font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Local</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">1ª Aval.</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Última</th>
                          <th className="py-2 pl-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perimRows.map((label, i) => {
                          const vals = getValues(formData, "perimetros", i, 6);
                          if (!vals.some((v) => v !== null)) return null;
                          return <CompareRow key={label} label={label} values={vals} unit="cm" />;
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ReportSection>
            )}

            <div className="print-break" />

            {/* ══════════════════════════════════════════════
                6. FORÇA — Testes de 1RM
               ══════════════════════════════════════════════ */}
            {hasForcaData && (
              <ReportSection title="Testes de Força (1RM)" icon={<Dumbbell size={17} />} accent="orange">
                <div className="space-y-4 print:space-y-3">
                  <div className="h-[280px] print:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forcaChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                        <YAxis tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} unit=" kg" />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11 }} />
                        {forcaRows.map((label, idx) => {
                          const color = PALETTE[idx % PALETTE.length];
                          return (
                            <Area key={label} type="monotone" dataKey={label} stroke={color} fill={color} fillOpacity={0.08} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                          );
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-border/50">
                          <th className="text-left py-2 pr-3 font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Exercício</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">1ª Aval.</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Última</th>
                          <th className="py-2 pl-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forcaRows.map((label, i) => {
                          const vals = getValues(formData, "forca", i, 6);
                          if (!vals.some((v) => v !== null)) return null;
                          return <CompareRow key={label} label={label} values={vals} unit="kg" />;
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ReportSection>
            )}

            {/* ══════════════════════════════════════════════
                7. CONDICIONAMENTO CARDIORRESPIRATÓRIO
               ══════════════════════════════════════════════ */}
            {hasCardioData && (
              <ReportSection title="Condicionamento Cardiorrespiratório" icon={<Heart size={17} />} accent="orange">
                <div className="space-y-3 print:space-y-2">
                  {/* VO₂ + FC metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2">
                    <div className="bg-orange/5 rounded-lg p-3.5 print:p-2 border border-orange/12 text-center">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-orange/50 mb-1">VO₂ Máx</p>
                      <p className="font-mono text-xl print:text-base font-bold text-orange">{vo2Resultado || lastValid(cardioVO2Vals)?.toFixed(1) || "—"}</p>
                      <p className="text-[10px] font-mono text-orange/40 mt-0.5">ml/kg/min</p>
                    </div>
                    <div className="bg-orange/5 rounded-lg p-3.5 print:p-2 border border-orange/12 text-center">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-orange/50 mb-1">FC Repouso</p>
                      <p className="font-mono text-xl print:text-base font-bold text-foreground/75">{fcRepouso || "—"}</p>
                      <p className="text-[10px] font-mono text-foreground/35 mt-0.5">bpm</p>
                    </div>
                    <div className="bg-orange/5 rounded-lg p-3.5 print:p-2 border border-orange/12 text-center">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-orange/50 mb-1">FC Máx Estimada</p>
                      <p className="font-mono text-xl print:text-base font-bold text-foreground/75">{fcMaxEst || "—"}</p>
                      <p className="text-[10px] font-mono text-foreground/35 mt-0.5">bpm (Tanaka)</p>
                    </div>
                    <div className="bg-orange/5 rounded-lg p-3.5 print:p-2 border border-orange/12 text-center">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-orange/50 mb-1">FC de Reserva</p>
                      <p className="font-mono text-xl print:text-base font-bold text-foreground/75">{fcReserva || "—"}</p>
                      <p className="text-[10px] font-mono text-foreground/35 mt-0.5">bpm (Karvonen)</p>
                    </div>
                  </div>

                  {/* Test used */}
                  {vo2Formula && (
                    <div className="flex items-center gap-2 text-xs font-mono text-foreground/40">
                      <Activity size={12} />
                      Teste utilizado: <strong className="text-foreground/60">{vo2Formula === "cooper" ? "Cooper (corrida 12 min)" : "Rockport (caminhada 1 milha)"}</strong>
                    </div>
                  )}

                  {/* Historical VO₂ comparison */}
                  {cardioVO2Vals.some((v) => v !== null) && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-border/50">
                            <th className="text-left py-2 pr-3 font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Indicador</th>
                            <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">1ª Aval.</th>
                            <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Última</th>
                            <th className="py-2 pl-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Variação</th>
                          </tr>
                        </thead>
                        <tbody>
                          <CompareRow label="VO₂ Máx" values={cardioVO2Vals} unit="ml/kg/min" />
                          <CompareRow label="FC de Repouso" values={cardioFCRepVals} unit="bpm" invert />
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </ReportSection>
            )}

            <div className="print-break" />

            {/* ══════════════════════════════════════════════
                8. AVALIAÇÃO POSTURAL — Fotos
               ══════════════════════════════════════════════ */}
            {hasFotos && (
              <ReportSection title="Avaliação Postural" icon={<Camera size={17} />} accent="green">
                <div className={`grid gap-4 ${fotos.length <= 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4 print:grid-cols-4"}`}>
                  {fotos.map((f) => (
                    <div key={f.key} className="relative rounded-lg overflow-hidden border border-green/15 aspect-[3/4] bg-green/5">
                      <img src={formData[f.key] as string} alt={f.label} className="w-full h-full object-contain" />
                      <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[10px] font-mono px-2 py-0.5 rounded">{f.label}</span>
                    </div>
                  ))}
                </div>
                {(formData.desvios || formData.encurtamentos) && (
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {formData.desvios && (
                      <div>
                        <h4 className="font-display font-bold text-xs text-green/70 uppercase tracking-wider mb-2">Desvios e Assimetrias</h4>
                        <p className="font-body text-sm text-foreground/60 whitespace-pre-wrap">{formData.desvios as string}</p>
                      </div>
                    )}
                    {formData.encurtamentos && (
                      <div>
                        <h4 className="font-display font-bold text-xs text-green/70 uppercase tracking-wider mb-2">Encurtamentos Musculares</h4>
                        <p className="font-body text-sm text-foreground/60 whitespace-pre-wrap">{formData.encurtamentos as string}</p>
                      </div>
                    )}
                  </div>
                )}
              </ReportSection>
            )}

            {hasFotos && <div className="print-break" />}

            {/* ══════════════════════════════════════════════
                9. MOBILIDADE — Testes FMS
               ══════════════════════════════════════════════ */}
            {hasMobilidadeData && (
              <ReportSection title="Avaliação de Movimento e Mobilidade (FMS)" icon={<Move size={17} />} accent="green">
                <div className="space-y-4 print:space-y-3">

                  {/* Badge de pontuação atual */}
                  {fmsLastTotal !== null && (
                    <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30 border-border">
                      <div className={`text-4xl font-display font-bold tabular-nums ${fmsLastTotal >= 15 ? "text-green-600" : "text-red-500"}`}>
                        {fmsLastTotal}
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-foreground/40">Pontuação FMS atual</p>
                        <p className={`text-sm font-semibold font-display mt-0.5 ${fmsLastTotal >= 15 ? "text-green-600" : "text-red-500"}`}>
                          {fmsLastTotal >= 15 ? "Dentro da normalidade" : "Abaixo do corte"} — corte ≥ 15 / 21
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Gráfico de evolução da pontuação total */}
                  <div className="h-[260px] print:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mobilidadeChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                        <YAxis domain={[0, 21]} tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }} />
                        <ReferenceLine y={15} stroke={COLORS.green} strokeDasharray="5 3" strokeOpacity={0.5} label={{ value: "corte 15", position: "insideTopRight", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fill: COLORS.green }} />
                        <Area type="monotone" dataKey="Pontuação FMS" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.1} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabela comparativa por exercício */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-border/50">
                          <th className="text-left py-2 pr-3 font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Exercício</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">1ª Aval.</th>
                          <th className="py-2 px-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Última</th>
                          <th className="py-2 pl-3 text-center font-display font-semibold text-foreground/50 text-xs uppercase tracking-wider">Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mobilidadeRows.map((label, i) => {
                          const vals = getValues(formData, "mobilidade", i, FMS_COLS);
                          if (!vals.some((v) => v !== null)) return null;
                          return <CompareRow key={label} label={label} values={vals} />;
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ReportSection>
            )}

            {/* ══════════════════════════════════════════════
                10. OBSERVAÇÕES DO TREINADOR
               ══════════════════════════════════════════════ */}
            {hasObs && (
              <ReportSection title="Observações e Recomendações" icon={<FileText size={17} />} accent="neutral">
                <div className="space-y-5">
                  {formData.observacoes && (
                    <div>
                      <h4 className="font-display font-bold text-xs text-foreground/50 uppercase tracking-wider mb-2">Observações Gerais</h4>
                      <p className="font-body text-sm text-foreground/65 whitespace-pre-wrap leading-relaxed">{formData.observacoes as string}</p>
                    </div>
                  )}
                  {formData.recomendacoes && (
                    <div>
                      <h4 className="font-display font-bold text-xs text-foreground/50 uppercase tracking-wider mb-2">Recomendações</h4>
                      <p className="font-body text-sm text-foreground/65 whitespace-pre-wrap leading-relaxed">{formData.recomendacoes as string}</p>
                    </div>
                  )}
                  {formData.plano_acao && (
                    <div>
                      <h4 className="font-display font-bold text-xs text-foreground/50 uppercase tracking-wider mb-2">Plano de Ação</h4>
                      <p className="font-body text-sm text-foreground/65 whitespace-pre-wrap leading-relaxed">{formData.plano_acao as string}</p>
                    </div>
                  )}
                </div>
              </ReportSection>
            )}

            {/* ── Próxima reavaliação ── */}
            {dataReaval && (
              <div className="text-center py-4">
                <p className="text-xs font-mono text-foreground/35 uppercase tracking-wider">
                  Próxima reavaliação: <span className="font-semibold text-foreground/50">{dataReaval}</span>
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-foreground/3 border-t border-border/50 py-6 mt-8">
        <div className="container text-center space-y-1">
          <p className="text-xs font-mono text-foreground/25 uppercase tracking-wider">
            Relatório de Progresso &mdash; {nome}
          </p>
          <p className="text-[10px] font-mono text-foreground/15 uppercase tracking-wider">
            Documento Confidencial &mdash; Uso exclusivo do aluno e treinador
          </p>
        </div>
      </footer>
    </div>
  );
}
