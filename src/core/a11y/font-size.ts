export const FONT_SIZE_OPTIONS = [
    { id: "small", label: "Pequeno", value: 0.8 },
    { id: "default", label: "Padrão", value: 1 },
    { id: "large", label: "Grande", value: 1.2 },
    { id: "extra-large", label: "Extra grande", value: 1.4 },
] as const;

export type FontSizeScale = (typeof FONT_SIZE_OPTIONS)[number]["id"];

export const DEFAULT_FONT_SIZE_SCALE: FontSizeScale = "default";

export function isFontSizeScale(
    value: string | null | undefined,
): value is FontSizeScale {
    return FONT_SIZE_OPTIONS.some((option) => option.id === value);
}
