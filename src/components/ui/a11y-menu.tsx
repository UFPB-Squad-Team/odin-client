"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useA11y } from "@/components/providers/a11y-provider";
import {
  COLOR_VISION_OPTIONS,
  getColorVisionOption,
} from "@/core/a11y/palettes";
import { rampGradientCss } from "@/core/a11y/oklab";

/**
 * Menu de acessibilidade de leitura de cores (daltonismo / alto contraste).
 *
 * Implementado como radiogroup com foco controlado (setas, Home e End) e prévia
 * da rampa em cada opção: a cor deixa de ser a única forma de escolher o modo e
 * de entender o efeito da preferência no mapa e na legenda.
 */
export function A11yMenu() {
  const {
    colorVisionMode,
    setColorVisionMode,
    outlineEmphasis,
    setOutlineEmphasis,
  } = useA11y();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeOption = getColorVisionOption(colorVisionMode);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    const checkedIndex = COLOR_VISION_OPTIONS.findIndex(
      (option) => option.id === colorVisionMode,
    );
    optionRefs.current[checkedIndex]?.focus();

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, colorVisionMode]);

  const focusOption = useCallback((index: number) => {
    const total = COLOR_VISION_OPTIONS.length;
    optionRefs.current[((index % total) + total) % total]?.focus();
  }, []);

  const handleOptionsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = optionRefs.current.findIndex(
      (node) => node === document.activeElement,
    );

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(currentIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(currentIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(COLOR_VISION_OPTIONS.length - 1);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        title="Acessibilidade: modo de visão de cores"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 transition hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="hidden sm:inline">Acessibilidade</span>
        <span className="rounded-full border border-zinc-300 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
          {activeOption.label}
        </span>
      </button>

      <span className="sr-only" aria-live="polite">
        {`Visão de cores: ${activeOption.label}`}
      </span>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[19rem] rounded-xl border border-zinc-300 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Visão de cores
          </p>

          <div
            role="radiogroup"
            aria-label="Modo de visão de cores"
            onKeyDown={handleOptionsKeyDown}
            className="space-y-1"
          >
            {COLOR_VISION_OPTIONS.map((option, index) => {
              const checked = option.id === colorVisionMode;
              return (
                <button
                  key={option.id}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked ? 0 : -1}
                  title={option.reference}
                  onClick={() => setColorVisionMode(option.id)}
                  className={`flex w-full flex-col gap-1 rounded-lg border px-2 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 ${checked
                    ? "border-cyan-500/70 bg-cyan-500/10"
                    : "border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {option.label}
                    </span>
                    {checked ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                        ativo
                      </span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className="block h-2 w-full rounded-full border border-zinc-200/80 dark:border-zinc-700"
                    style={{ background: rampGradientCss(option.preview) }}
                  />
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
            <button
              type="button"
              role="switch"
              aria-checked={outlineEmphasis}
              onClick={() => setOutlineEmphasis(!outlineEmphasis)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 px-2 py-1.5 text-left transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-100">
                Contornos reforçados nos polígonos
              </span>
              <span
                aria-hidden="true"
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${outlineEmphasis
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
              >
                {outlineEmphasis ? "Sim" : "Não"}
              </span>
            </button>
            <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              A preferência fica salva neste navegador. As rampas são validadas por
              simulação de daltonismo.

              <span className=" mt-1 block font-medium text-zinc-700 dark:text-zinc-300">
                APENAS VÁLIDO NA ÁREA DE MAPA E DETALHES DO OBSERVATÓRIO.
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
