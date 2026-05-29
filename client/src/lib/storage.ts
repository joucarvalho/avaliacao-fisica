/**
 * Rascunho local da ficha em `localStorage`.
 *
 * Por que existe: sem servidor, se o usuário fecha a aba sem exportar PDF,
 * perde tudo. O rascunho é uma rede de segurança — não substitui o export,
 * só evita perda acidental entre sessões no mesmo browser.
 */

const CHAVE_RASCUNHO = "avaliacao_fisica_rascunho";

export type FormDataValue = string | number | boolean | string[];
export type FormData = Record<string, FormDataValue>;

/**
 * Grava o formData atual no localStorage. Sobrescreve o rascunho anterior.
 *
 * Pode falhar silenciosamente se o localStorage estiver cheio (limite
 * típico: 5-10 MB por origem). Como as fotos viram base64 no formData,
 * isso pode acontecer com fichas muito pesadas — nesse caso o app
 * continua funcionando, só perde a rede de segurança.
 */
export function salvarRascunho(formData: FormData): void {
  try {
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(formData));
  } catch {
    // Quota excedida ou modo privado bloqueando storage.
    // Falha silenciosa proposital — o app não deve quebrar por causa do rascunho.
  }
}

/**
 * Lê o rascunho. Retorna `null` se não houver nada salvo ou se o conteúdo
 * estiver corrompido.
 */
export function carregarRascunho(): FormData | null {
  try {
    const cru = localStorage.getItem(CHAVE_RASCUNHO);
    if (!cru) return null;
    return JSON.parse(cru) as FormData;
  } catch {
    return null;
  }
}

/**
 * Apaga o rascunho. Usar ao clicar em "Nova Ficha" ou depois de exportar
 * com sucesso (se o usuário quiser começar do zero).
 */
export function limparRascunho(): void {
  try {
    localStorage.removeItem(CHAVE_RASCUNHO);
  } catch {
    // mesmo motivo do salvarRascunho
  }
}
