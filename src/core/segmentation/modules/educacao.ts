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
  return ["infantil", "fundamental", "medio", "todas"];
}

/**
 * Módulo de segmentação de Educação.
 */
export const EDUCACAO_SEGMENTATION: SegmentationModule = {
  id: "educacao",
  label: "Educação",
  description: "Segmentação por nível de ensino",
  defaultSegment: "todas",
  segments: {
    infantil: {
      id: "infantil",
      label: "Educação Infantil",
      description: "Creches e pré-escolas",
      availableMetrics: [
        "totalEscolas", "totalAlunos", "pctComInternet",
        "pctComBiblioteca", "pctComLabInformatica", "pctSemAcessibilidade"
      ],
    },
    fundamental: {
      id: "fundamental",
      label: "Ensino Fundamental",
      description: "Anos iniciais e finais",
      availableMetrics: [
        "totalEscolas", "totalAlunos", "pctComInternet",
        "pctComBiblioteca", "pctComLabInformatica", "pctSemAcessibilidade"
      ],
    },
    medio: {
      id: "medio",
      label: "Ensino Médio",
      description: "Ensino médio regular e técnico",
      availableMetrics: [
        "totalEscolas", "totalAlunos", "pctComInternet",
        "pctComBiblioteca", "pctComLabInformatica", "pctSemAcessibilidade"
      ],
    },
    todas: {
      id: "todas",
      label: "Todas as etapas",
      description: "Visão geral de todos os níveis",
      availableMetrics: [
        "totalEscolas", "totalAlunos", "pctComInternet",
        "pctComBiblioteca", "pctComLabInformatica", "pctSemAcessibilidade"
      ],
    },
  },
  extractAvailableSegments,
};

// Auto-registro
registerSegmentationModule(EDUCACAO_SEGMENTATION);