import type { MarkerConfig, MarkerEntityType } from "./types";

/**
 * Configurações de ícones para cada tipo de entidade.
 */
export const MARKER_CONFIGS: Record<MarkerEntityType, MarkerConfig> = {
  escola: {
    type: "escola",
    color: "#06b6d4",
    label: "Escola",
    iconPath: "M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z",
  },
  hospital: {
    type: "hospital",
    color: "#10b981",
    label: "Saúde",
    iconPath: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z",
  },
  empresa: {
    type: "empresa",
    color: "#f59e0b",
    label: "Empresa",
    iconPath: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
  },
  governo: {
    type: "governo",
    color: "#8b5cf6",
    label: "Governo",
    iconPath: "M12 2L2 7v1h20V7L12 2zm0 2.5L17.5 7h-11L12 4.5zM2 22h20v-2H2v2zm2-3h2v-7H4v7zm4 0h2v-7H8v7zm4 0h2v-7h-2v7zm4 0h2v-7h-2v7zm4 0h2v-7h-2v7z",
  },
};

const MARKER_SIZE = 36;

/**
 * Gera uma imagem de marker como ImageData para MapLibre addImage.
 * Pin com ícone SVG branco dentro de um círculo colorido + sombra.
 */
function renderMarkerToCanvas(config: MarkerConfig): HTMLCanvasElement {
  const size = MARKER_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size + 6;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 3;

  // Sombra
  ctx.beginPath();
  ctx.ellipse(cx, size + 2, radius * 0.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fill();

  // Círculo principal
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = config.color;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Ícone SVG branco
  const iconScale = (radius * 1.1) / 24;
  const iconOffset = cx - (24 * iconScale) / 2;
  const iconOffsetY = cy - (24 * iconScale) / 2;

  ctx.save();
  ctx.translate(iconOffset, iconOffsetY);
  ctx.scale(iconScale, iconScale);
  ctx.fillStyle = "#ffffff";
  const path = new Path2D(config.iconPath);
  ctx.fill(path);
  ctx.restore();

  return canvas;
}

/**
 * Registra todas as imagens de marker num mapa MapLibre.
 * Seguro para chamar múltiplas vezes (idempotente).
 */
export function registerMarkerImages(map: { hasImage: (id: string) => boolean; addImage: (id: string, image: { data: Uint8Array; width: number; height: number }) => void }): void {
  for (const [type, config] of Object.entries(MARKER_CONFIGS)) {
    const imageId = `marker-${type}`;
    if (map.hasImage(imageId)) continue;

    const canvas = renderMarkerToCanvas(config);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    map.addImage(imageId, {
      data: new Uint8Array(imageData.data.buffer),
      width: canvas.width,
      height: canvas.height,
    });
  }
}

/**
 * Resolve o tipo de marker a partir das properties de uma feature.
 */
export function resolveMarkerType(props: Record<string, unknown>): MarkerEntityType {
  const nivel = String(props.nivel ?? "");
  if (nivel === "escola") return "escola";
  return "escola";
}
