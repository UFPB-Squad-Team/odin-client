/**
 * Módulo de segmentação para Educação.
 * Registra níveis de ensino como segmentos.
 */

import type { SegmentationModule } from "../types";
import { registerSegmentationModule } from "../registry";

/**
 * Extrai segmentos (níveis de ensino) disponíveis a partir dos geoProps.
 */
function extractAvailableSegments(geoProps: Record<string, unknown>): string[] {
  const educacao = (geoProps.educacao ?? {}) as Record<string, unknown>;

  // 1. Se existir niveisAtendidos explícito, usa ele
  const niveisAtendidos = educacao.niveisAtendidos as string[] | undefined;
  if (niveisAtendidos && niveisAtendidos.length > 0) {
    const validos = niveisAtendidos.filter((n) =>
      ["infantil", "fundamental", "medio", "superior"].includes(n)
    );
    if (validos.length > 0) return validos;
  }

  // 2. Infere de educacao.niveis (dados por nível)
  const niveis = (educacao.niveis ?? {}) as Record<string, unknown>;
  const chavesComDados = Object.keys(niveis).filter((key) => {
    const data = niveis[key] as Record<string, unknown>;
    if (!data || typeof data !== "object") return false;
    return Object.values(data).some((v) => typeof v === "number" && v > 0);
  });

  if (chavesComDados.length > 0) {
    return chavesComDados.filter((n) =>
      ["infantil", "fundamental", "medio", "superior"].includes(n)
    );
  }

  // 3. Fallback: se não detectou dados específicos, oferece TODOS os segmentos
  // Isso garante que o seletor de nível de ensino sempre apareça na comparação
  return ["infantil", "fundamental", "medio", "superior", "todas"];
}

/**
 * Módulo de segmentação de Educação.
 */
export const EDUCACAO_SEGMENTATION: SegmentationModule = {
  id: "educacao",
  label: "Educação",
  description: "Segmentação por nível de ensino",
  icon: "📚",
  defaultSegment: "fundamental",
  segments: {
    infantil: {
      id: "infantil",
      label: "Educação Infantil",
      description: "Creches e pré-escolas",
      icon: "🧒",
      availableMetrics: [
        "totalEscolas", "totalAlunos", "pctComInternet",
        "pctComBiblioteca", "pctComLabInformatica", "pctSemAcessibilidade"
      ],
      weightAdjustments: {
        pctComInternet: 0.6,
        pctComBiblioteca: 0.8,
        pctComLabInformatica: 0.3,
        totalEscolas: 1.2,
        totalAlunos: 1.2,
      },
    },
    fundamental: {
      id: "fundamental",
      label: "Ensino Fundamental",
      description: "Anos iniciais e finais",
      icon: "📖",
      availableMetrics: [
        "totalEscolas", "totalAlunos", "pctComInternet",
        "pctComBiblioteca", "pctComLabInformatica", "pctSemAcessibilidade"
      ],
      weightAdjustments: {
        pctComInternet: 1.0,
        pctComBiblioteca: 1.2,
        pctComLabInformatica: 1.0,
        totalEscolas: 1.0,
        totalAlunos: 1.0,
      },
    },
    medio: {
      id: "medio",
      label: "Ensino Médio",
      description: "Ensino médio regular e técnico",
      icon: "🎓",
      availableMetrics: [
        "totalEscolas", "totalAlunos", "pctComInternet",
        "pctComBiblioteca", "pctComLabInformatica", "pctSemAcessibilidade"
      ],
      weightAdjustments: {
        pctComInternet: 1.5,
        pctComBiblioteca: 1.3,
        pctComLabInformatica: 1.5,
        totalEscolas: 0.8,
        totalAlunos: 0.8,
      },
    },
    superior: {
      id: "superior",
      label: "Ensino Superior",
      description: "Universidades e faculdades",
      icon: "🏛️",
      availableMetrics: [
        "totalEscolas", "totalAlunos", "pctComInternet",
        "pctComBiblioteca", "pctComLabInformatica"
      ],
      weightAdjustments: {
        pctComInternet: 2.0,
        pctComBiblioteca: 1.5,
        pctComLabInformatica: 2.0,
        totalEscolas: 0.5,
        totalAlunos: 0.5,
      },
    },
    todas: {
      id: "todas",
      label: "Todas as etapas",
      description: "Visão geral de todos os níveis",
      icon: "📚",
      availableMetrics: [
        "totalEscolas", "totalAlunos", "pctComInternet",
        "pctComBiblioteca", "pctComLabInformatica", "pctSemAcessibilidade"
      ],
      weightAdjustments: {},
    },
  },
  extractAvailableSegments,
};

// Auto-registro
registerSegmentationModule(EDUCACAO_SEGMENTATION);