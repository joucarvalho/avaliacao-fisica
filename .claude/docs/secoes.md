# Seções do Formulário — avaliacao_fisica

## 11 seções de `Home.tsx` (recolhíveis)

| Nº | Título | Cor |
|---|---|---|
| I | Dados Pessoais | `neutral` |
| II | Anamnese de Saúde | `neutral` |
| III | Anamnese Comportamental e Estilo de Vida | `neutral` |
| IV | Composição Corporal (Bioimpedância) | `teal` |
| V | Medidas Antropométricas | `teal` |
| VI | Dobras Cutâneas | `teal` |
| VII | Avaliação Postural | `green` |
| VIII | Avaliação de Movimento e Mobilidade | `green` |
| IX | Avaliação de Força | `orange` |
| X | Condicionamento Cardiorrespiratório | `orange` |
| XI | Observações e Plano de Ação | `neutral` |

**Cores CSS:** `teal` (#0A6B7C), `orange` (#D4622B), `green` (#5A8C6A), `neutral` = sem cor temática.

## Padrão de chaves para tabelas editáveis

```
${tableKey}_${linhaIndex}_${colunaIndex}
```

Exemplo: `bioimpedancia_0_0` = peso total na avaliação 1.  
O Relatório (`Relatorio.tsx`) lê essas mesmas chaves para montar os gráficos.

## Cálculos automáticos (inline em `Home.tsx` via `useCallback`)

| Cálculo | Fórmula |
|---|---|
| IMC | `peso / (altura / 100)²` |
| RCQ | `cintura / quadril` |
| % Gordura | Jackson & Pollock 3, Pollock 7, ou Guedes 3 (dropdown) |
| VO₂ Máximo | Cooper (atlético), Rockport (sedentário), Karvonen (estimativa) |

Sexo e idade sincronizam automaticamente da Seção I para as demais seções.
