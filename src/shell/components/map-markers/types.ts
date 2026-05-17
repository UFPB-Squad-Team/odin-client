/** Tipos de entidade que podem ser renderizados como markers no mapa. */
export type MarkerEntityType = "escola" | "hospital" | "empresa" | "governo";

/** Configuração visual de um tipo de marker. */
export type MarkerConfig = {
  type: MarkerEntityType;
  color: string;
  label: string;
  iconPath: string; // SVG path data
};
