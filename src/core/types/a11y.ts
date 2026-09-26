/**
 * Tipos de acessibilidade do ODIN.
 *
 * O foco inicial é a percepção de cores: como boa parte da leitura analítica do
 * observatório acontece no mapa (choropleth), a paleta é informação, não decoração.
 * Pessoas com deficiência de visão de cores (CVD) precisam de rampas com
 * luminosidade monotônica para não perderem a leitura dos dados.
 */

/**
 * Modos de visão de cores suportados.
 *
 * - `default`: cores originais dos indicadores (comportamento histórico).
 * - `protanopia`: deficiência do cone vermelho (L) — eixo azul/amarelo.
 * - `deuteranopia`: deficiência do cone verde (M) — eixo azul/amarelo.
 * - `tritanopia`: deficiência do cone azul (S) — eixo rosa/magenta.
 * - `achromatopsia`: ausência total de visão de cores — luminância pura.
 */
export type ColorVisionMode =
  | "default"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "achromatopsia";

/** Modos que substituem a paleta do indicador por uma rampa acessível. */
export type AccessibleColorVisionMode = Exclude<ColorVisionMode, "default">;

/**
 * Superfície em que uma cor de acento é aplicada.
 *
 * O acento dos painéis (chips de dimensão, cartões de métrica, cabeçalho) precisa
 * de contraste com o fundo: em superfície escura a cor vem da metade superior da
 * rampa; em superfície clara, da metade inferior.
 */
export type AccentSurface = "light" | "dark";
