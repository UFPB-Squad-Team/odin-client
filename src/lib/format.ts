/**
 * Formatadores centralizados do ODIN.
 * Use sempre estas funções — nunca formate inline.
 */

export function formatPct(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `${num.toFixed(1)}%`;
}

export function formatNum(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num.toLocaleString("pt-BR");
}

export function formatDecimal(value: unknown, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num.toFixed(decimals);
}

export function interpolateHex(
  colorA: string,
  colorB: string,
  t: number,
): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const parseHex = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const a = parseHex(colorA);
  const b = parseHex(colorB);
  const clamped = Math.max(0, Math.min(1, t));
  return `#${toHex(clamp(a.r + (b.r - a.r) * clamped))}${toHex(clamp(a.g + (b.g - a.g) * clamped))}${toHex(clamp(a.b + (b.b - a.b) * clamped))}`;
}
