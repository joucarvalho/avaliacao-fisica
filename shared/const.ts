// Retorna o peso mais recente preenchido na tabela de bioimpedância (linha "Peso Total")
export function getPesoAtual(formData: Record<string, unknown>): string {
  let ultimo = "";
  for (let col = 0; col <= 5; col++) {
    const val = formData[`bioimpedancia_0_${col}`];
    if (typeof val === "string" && val.trim() !== "") ultimo = val.trim();
    else if (typeof val === "number") ultimo = String(val);
  }
  return ultimo;
}
