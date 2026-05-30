# Persistência — avaliacao_fisica

Não há banco de dados. Os dados de uma ficha vivem em três lugares:

| Onde | O que guarda | Quando é usado |
|---|---|---|
| `useState` em `Home.tsx` | `formData` completo em memória | Sessão atual de edição |
| `localStorage` (chave `avaliacao_fisica_rascunho`) | Mesmo `formData` serializado | Rede de segurança — recupera ao reabrir a aba |
| PDF exportado (`.pdf` com `ficha.json` anexo) | Snapshot final do `formData` | Arquivo morto + meio de reimportar no futuro |

## localStorage

- Chave: `avaliacao_fisica_rascunho`
- Helpers em `client/src/lib/storage.ts`: `salvarRascunho`, `carregarRascunho`, `limparRascunho`
- Pode falhar silenciosamente se o limite de ~5-10 MB for atingido (imagens base64 são pesadas). O app continua funcionando; só perde a rede de segurança.

## formData

Tipo: `Record<string, string | number | boolean | string[]>`  
Vive no `useState` de `Home.tsx` e é passado para baixo via props.  
Imagens (fotos posturais + bioimpedância) são armazenadas como strings base64 dentro do mesmo `formData`.
