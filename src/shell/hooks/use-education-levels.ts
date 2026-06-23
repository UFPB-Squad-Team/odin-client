import { useMemo } from "react";
import type { Bairro, Municipio } from "@/core/types/territory";
import type { EducationLevel } from "@/core/types/education";

/**
 * Extrai os níveis de ensino disponíveis a partir dos geoProps de uma entidade.
 * Analisa a estrutura real de dados para determinar quais níveis estão presentes.
 */
function extractAvailableLevels(entity: Municipio | Bairro): EducationLevel[] {
  const geoProps = entity.geoProps || {};
  const educacao = (geoProps.educacao ?? {}) as Record<string, unknown>;

  // 1. Se existir niveisAtendidos explícito, usa ele
  const niveisAtendidos = educacao.niveisAtendidos as string[] | undefined;
  if (niveisAtendidos && niveisAtendidos.length > 0) {
    const validos = niveisAtendidos.filter((n): n is EducationLevel =>
      ["infantil", "fundamental", "medio", "superior"].includes(n)
    );
    if (validos.length > 0) return validos;
  }

  // 2. Se existir dados por nível (educacao.niveis), infere a partir das chaves com dados
  const niveis = (educacao.niveis ?? {}) as Record<string, unknown>;
  const chavesComDados = Object.keys(niveis).filter((key) => {
    const data = niveis[key] as Record<string, unknown>;
    if (!data || typeof data !== "object") return false;
    // Verifica se há pelo menos um campo numérico > 0
    return Object.values(data).some(
      (v) => typeof v === "number" && v > 0
    );
  });

  if (chavesComDados.length > 0) {
    return chavesComDados.filter((n): n is EducationLevel =>
      ["infantil", "fundamental", "medio", "superior"].includes(n)
    );
  }

  // 3. Fallback: verifica campos agregados (totalEscolas, totalMatriculas) como sinal de que existe educação
  const totalEscolas =
    (educacao.totalEscolas as number) ??
    (geoProps.total_escolas as number) ??
    0;
  const totalMatriculas =
    (educacao.totalMatriculas as number) ??
    (geoProps.total_alunos as number) ??
    0;

  if (totalEscolas > 0 || totalMatriculas > 0) {
    // Se tem escolas mas sem segmentação, assume "todas" como fallback
    return ["todas"];
  }

  // 4. Sem nenhum dado de educação
  return [];
}

export function useEducationLevels(
  entity: Municipio | Bairro | null,
): {
  availableLevels: EducationLevel[];
  hasMultipleLevels: boolean;
  primaryLevel: EducationLevel;
} {
  return useMemo(() => {
    if (!entity) {
      return {
        availableLevels: [],
        hasMultipleLevels: false,
        primaryLevel: "todas"
      };
    }

    const availableLevels = extractAvailableLevels(entity);

    // Se não encontrou nada, retorna vazio e deixa o caller decidir o fallback
    if (availableLevels.length === 0) {
      return {
        availableLevels: [],
        hasMultipleLevels: false,
        primaryLevel: "todas"
      };
    }

    const hasMultipleLevels = availableLevels.length > 1;
    const primaryLevel = availableLevels[0];

    return {
      availableLevels,
      hasMultipleLevels,
      primaryLevel
    };
  }, [entity]);
}