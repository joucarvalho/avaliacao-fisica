# Design System — avaliacao_fisica

## Nome: "Clinical Sport Journal"

Estilo editorial suíço. Limpo, tipográfico, orientado a dados.

## Variáveis de cor CSS

| Variável | Hex | Uso |
|---|---|---|
| `teal` | `#0A6B7C` | Composição corporal (seções IV–VI) |
| `orange` | `#D4622A` | Desempenho (seções IX–X) |
| `green` | `#5A8C6A` | Mobilidade e postura (seções VII–VIII) |

## Tipografia

| Fonte | Uso |
|---|---|
| DM Sans | Títulos |
| IBM Plex Mono | Dados numéricos |
| Source Sans 3 | Corpo de texto |

## Impressão

Variantes `print:` do Tailwind — seções ficam expandidas ao imprimir (independente do estado recolhido na tela).

## Imagens de fundo por grupo

Seções com `bgImage` recebem uma imagem sutil de fundo via prop:
- `BODY_BG` — seções de composição corporal (IV, V)
- `MOBILITY_BG` — seções de mobilidade e postura (VII, VIII)
- `PERFORMANCE_BG` — seções de desempenho (IX)
