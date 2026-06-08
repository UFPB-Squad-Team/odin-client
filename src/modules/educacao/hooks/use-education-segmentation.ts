"use client";

import { useMemo } from "react";
import type { Escola } from "@/core/types/territory";
import type {
  EnsinoLevel,
  DependenciaAdministrativa,
} from "@/core/types/comparision";

/**
 * Resultado da segmentação de escolas por nível de ensino e esfera administrativa.
 */
export interface SegmentacaoEscolas {
  /** Escolas agrupadas por nível de ensino. */
  porNivel: Map<EnsinoLevel, Escola[]>;
  /** Escolas agrupadas por dependência administrativa. */
  porDependencia: Map<DependenciaAdministrativa, Escola[]>;
  /** Todas as escolas sem segmentação. */
  todas: Escola[];
  /** Níveis de ensino disponíveis no conjunto. */
  niveisDisponiveis: EnsinoLevel[];
  /** Dependências administrativas disponíveis no conjunto. */
  dependenciasDisponiveis: DependenciaAdministrativa[];
}

/**
 * Infere os níveis de ensino oferecidos por uma escola com base em seus indicadores.
 * Analisa os campos de matrícula e indicadores para determinar quais níveis estão presentes.
 */
function inferirNiveis(escola: Escola): EnsinoLevel[] {
  const niveis: EnsinoLevel[] = [];
  const indicadores = escola.indicadores;
  const matriculas = escola.matriculas;

  // Verifica educação infantil
  if (
    (matriculas?.educacaoInfantil && matriculas.educacaoInfantil > 0) ||
    (matriculas?.educacaoInfantilCreche && matriculas.educacaoInfantilCreche > 0) ||
    (matriculas?.educacaoInfantilPreEscola && matriculas.educacaoInfantilPreEscola > 0) ||
    (indicadores?.educacaoInfantil && (
      indicadores.educacaoInfantil.alunosPorTurma != null ||
      indicadores.educacaoInfantil.taxaAprovacao != null
    ))
  ) {
    niveis.push("infantil");
  }

  // Verifica ensino fundamental (anos iniciais e/ou finais)
  if (
    (matriculas?.fundamentalTotal && matriculas.fundamentalTotal > 0) ||
    (matriculas?.fundamentalAnosIniciais && matriculas.fundamentalAnosIniciais > 0) ||
    (matriculas?.fundamentalAnosFinais && matriculas.fundamentalAnosFinais > 0) ||
    (indicadores?.fundamentalAnosIniciais || indicadores?.fundamentalAnosFinais)
  ) {
    niveis.push("fundamental");
  }

  // Verifica ensino médio
  if (
    (matriculas?.ensinoMedio && matriculas.ensinoMedio > 0) ||
    (indicadores?.ensinoMedio && (
      indicadores.ensinoMedio.alunosPorTurma != null ||
      indicadores.ensinoMedio.taxaAprovacao != null
    ))
  ) {
    niveis.push("medio");
  }

  return niveis;
}

/**
 * Hook que segmenta uma lista de escolas por nível de ensino e dependência administrativa.
 * Usado para filtros de comparação e análise contextual.
 */
export function useEducationSegmentation(
  escolas: Escola[],
): SegmentacaoEscolas {
  return useMemo(() => {
    const porNivel = new Map<EnsinoLevel, Escola[]>();
    const porDependencia = new Map<DependenciaAdministrativa, Escola[]>();
    const niveisDisponiveis = new Set<EnsinoLevel>();
    const dependenciasDisponiveis = new Set<DependenciaAdministrativa>();

    // Inicializa mapas
    for (const nivel of ["infantil", "fundamental", "medio"] as EnsinoLevel[]) {
      porNivel.set(nivel, []);
    }
    for (const dep of ["municipal", "estadual", "federal", "privada"] as DependenciaAdministrativa[]) {
      porDependencia.set(dep, []);
    }

    for (const escola of escolas) {
      // Segmentação por nível
      const niveis = inferirNiveis(escola);
      for (const nivel of niveis) {
        porNivel.get(nivel)?.push(escola);
        niveisDisponiveis.add(nivel);
      }

      // Segmentação por dependência administrativa
      const dep = (escola.dependenciaAdministrativa?.toLowerCase() ||
        escola.dependencia_adm?.toLowerCase() ||
        "") as string;

      let depKey: DependenciaAdministrativa | null = null;

      if (dep.includes("municipal")) depKey = "municipal";
      else if (dep.includes("estadual")) depKey = "estadual";
      else if (dep.includes("federal")) depKey = "federal";
      else if (dep.includes("privada") || dep.includes("particular")) depKey = "privada";

      if (depKey) {
        porDependencia.get(depKey)?.push(escola);
        dependenciasDisponiveis.add(depKey);
      }
    }

    return {
      porNivel,
      porDependencia,
      todas: escolas,
      niveisDisponiveis: Array.from(niveisDisponiveis),
      dependenciasDisponiveis: Array.from(dependenciasDisponiveis),
    };
  }, [escolas]);
}
