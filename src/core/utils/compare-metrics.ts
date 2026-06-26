// src/core/utils/compare-metrics.ts
import type { EnsinoLevel } from "@/core/types/comparision";

// Tipos exportados para uso externo
export type CompareEntityKind = "municipio" | "bairro";

export type CompareEntity = {
  id: string;
  nome: string;
  estadoId?: string;
  municipioId?: string;
  geoProps?: Record<string, unknown>;
};

export interface MetricItem {
  key: string;
  label: string;
  a: number;
  b: number;
  format: "int" | "pct" | "decimal";
  higherIsBetter: boolean;
  competitive?: boolean;
}

export interface MetricGroup {
  label: string;
  metrics: MetricItem[];
}

function parseNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Extrai métricas específicas de um nível de ensino a partir dos geoProps.
 * Busca primeiro em educacao.niveis[level] (dados reais por nível quando disponíveis),
 * depois usa os dados agregados totais (educacao.* ou geoProps.*).
 * 
 * NOTA: Quando não há dados específicos por nível nos geoProps, usamos os dados
 * totais do município/bairro. A filtragem real por nível de ensino só seria possível
 * carregando as escolas individuais e aplicando a segmentação por matrícula/indicador.
 */
function extractLevelMetrics(
  geoProps: Record<string, unknown>,
  level: EnsinoLevel
): Record<string, number> {
  const educacao = (geoProps.educacao ?? {}) as Record<string, unknown>;

  // Valores agregados totais (fallback principal)
  const totalEscolas = parseNum(educacao.totalEscolas ?? geoProps.total_escolas);
  const totalAlunos = parseNum(educacao.totalMatriculas ?? geoProps.total_alunos);
  const pctComInternet = parseNum(educacao.pctComInternet ?? geoProps.pct_com_internet);
  const pctComBiblioteca = parseNum(educacao.pctComBiblioteca ?? geoProps.pct_com_biblioteca);
  const pctComLabInformatica = parseNum(educacao.pctComLabInformatica ?? geoProps.pct_com_lab_informatica);
  const pctSemAcessibilidade = parseNum(educacao.pctSemAcessibilidade ?? geoProps.pct_sem_acessibilidade);

  // Tenta buscar dados específicos do nível em educacao.niveis[level]
  if (level !== "todas") {
    const nivelData = (educacao.niveis ?? {}) as Record<string, unknown>;
    const nivelMetrics = (nivelData[level] ?? {}) as Record<string, unknown>;

    const hasLevelData = nivelMetrics && Object.keys(nivelMetrics).some(k => {
      const v = nivelMetrics[k];
      return typeof v === "number" && v > 0;
    });

    if (hasLevelData) {
      return {
        totalEscolas: parseNum(nivelMetrics.totalEscolas ?? totalEscolas),
        totalAlunos: parseNum(nivelMetrics.totalMatriculas ?? totalAlunos),
        pctComInternet: parseNum(nivelMetrics.pctComInternet ?? pctComInternet),
        pctComBiblioteca: parseNum(nivelMetrics.pctComBiblioteca ?? pctComBiblioteca),
        pctComLabInformatica: parseNum(nivelMetrics.pctComLabInformatica ?? pctComLabInformatica),
        pctSemAcessibilidade: parseNum(nivelMetrics.pctSemAcessibilidade ?? pctSemAcessibilidade),
      };
    }
  }

  // Sem dados específicos do nível, retorna os dados agregados totais
  return {
    totalEscolas,
    totalAlunos,
    pctComInternet,
    pctComBiblioteca,
    pctComLabInformatica,
    pctSemAcessibilidade,
  };
}

export function extractComparableMetrics(
  a: CompareEntity | null,
  b: CompareEntity | null,
  kind: CompareEntityKind,
  segmentA: string = "fundamental",
  segmentB: string = "fundamental"
): MetricGroup[] {
  const levelA = segmentA as EnsinoLevel;
  const levelB = segmentB as EnsinoLevel;
  if (!a || !b) return [];

  const pa = (a?.geoProps ?? {}) as Record<string, unknown>;
  const pb = (b?.geoProps ?? {}) as Record<string, unknown>;
  const sa = (pa.socioeconomico ?? {}) as Record<string, unknown>;
  const sb = (pb.socioeconomico ?? {}) as Record<string, unknown>;

  const saSaneamento = (sa.saneamento ?? {}) as Record<string, unknown>;
  const sbSaneamento = (sb.saneamento ?? {}) as Record<string, unknown>;
  const saPopulacao = (sa.populacao ?? {}) as Record<string, unknown>;
  const sbPopulacao = (sb.populacao ?? {}) as Record<string, unknown>;
  const saEducacaoPop = (sa.educacaoPopulacao ?? {}) as Record<string, unknown>;
  const sbEducacaoPop = (sb.educacaoPopulacao ?? {}) as Record<string, unknown>;
  const saEstruturaEtaria = (sa.estruturaEtaria ?? {}) as Record<string, unknown>;
  const sbEstruturaEtaria = (sb.estruturaEtaria ?? {}) as Record<string, unknown>;
  const saHabitacao = (sa.habitacao ?? {}) as Record<string, unknown>;
  const sbHabitacao = (sb.habitacao ?? {}) as Record<string, unknown>;
  const saGenero = (sa.genero ?? {}) as Record<string, unknown>;
  const sbGenero = (sb.genero ?? {}) as Record<string, unknown>;
  const saRaca = (sa.raca ?? {}) as Record<string, unknown>;
  const sbRaca = (sb.raca ?? {}) as Record<string, unknown>;

  // Extrai métricas específicas do nível de ensino
  const metricsA = extractLevelMetrics(pa, levelA);
  const metricsB = extractLevelMetrics(pb, levelB);

  const groups: MetricGroup[] = [
    {
      label: "Rede escolar",
      metrics: [
        {
          key: "totalEscolas",
          label: "Total de escolas",
          a: metricsA.totalEscolas,
          b: metricsB.totalEscolas,
          format: "int",
          higherIsBetter: true,
        },
        {
          key: "totalAlunos",
          label: "Total de alunos",
          a: metricsA.totalAlunos,
          b: metricsB.totalAlunos,
          format: "int",
          higherIsBetter: true,
        }
      ]
    },
    {
      label: "Infraestrutura escolar",
      metrics: [
        {
          key: "internet",
          label: "Com internet p/ alunos",
          a: metricsA.pctComInternet,
          b: metricsB.pctComInternet,
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "biblioteca",
          label: "Com biblioteca",
          a: metricsA.pctComBiblioteca,
          b: metricsB.pctComBiblioteca,
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "lab",
          label: "Com lab. informática",
          a: metricsA.pctComLabInformatica,
          b: metricsB.pctComLabInformatica,
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "comAcessibilidade",
          label: "Com acessibilidade PCD",
          a: Math.max(0, 100 - metricsA.pctSemAcessibilidade),
          b: Math.max(0, 100 - metricsB.pctSemAcessibilidade),
          format: "pct",
          higherIsBetter: true,
        }
      ]
    },
    {
      label: "Demografia",
      metrics: [
        {
          key: "populacaoTotal",
          label: "População total",
          a: parseNum(saPopulacao.total),
          b: parseNum(sbPopulacao.total),
          format: "int",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctCriancas0a9",
          label: "Crianças (0-9)",
          a: parseNum(saEstruturaEtaria.pctCriancas0a9),
          b: parseNum(sbEstruturaEtaria.pctCriancas0a9),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctJovens15a29",
          label: "Jovens (15-29)",
          a: parseNum(saEstruturaEtaria.pctJovens15a29),
          b: parseNum(sbEstruturaEtaria.pctJovens15a29),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctAdultos30a59",
          label: "Adultos (30-59)",
          a: parseNum(saEstruturaEtaria.pctAdultos30a59),
          b: parseNum(sbEstruturaEtaria.pctAdultos30a59),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctIdosos60Mais",
          label: "Idosos (60+)",
          a: parseNum(saEstruturaEtaria.pctIdosos60Mais),
          b: parseNum(sbEstruturaEtaria.pctIdosos60Mais),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctPopMasculina",
          label: "Pop. masculina",
          a: parseNum(saGenero.pctPopMasculina),
          b: parseNum(sbGenero.pctPopMasculina),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctPopFeminina",
          label: "Pop. feminina",
          a: parseNum(saGenero.pctPopFeminina),
          b: parseNum(sbGenero.pctPopFeminina),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctPretaParda",
          label: "Pop. preta/parda",
          a: parseNum(saRaca.pctPretaParda),
          b: parseNum(sbRaca.pctPretaParda),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctBranca",
          label: "Pop. branca",
          a: parseNum(saRaca.pctBranca),
          b: parseNum(sbRaca.pctBranca),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctIndigena",
          label: "Pop. indígena",
          a: parseNum(saRaca.pctIndigena),
          b: parseNum(sbRaca.pctIndigena),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        }
      ]
    },
    {
      label: "Saneamento",
      metrics: [
        {
          key: "aguaRedeGeral",
          label: "Água da rede geral",
          a: parseNum(saSaneamento.pctAguaRedeGeral),
          b: parseNum(sbSaneamento.pctAguaRedeGeral),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "esgotoRedeGeral",
          label: "Esgoto da rede geral",
          a: parseNum(saSaneamento.pctEsgotoRedeGeral),
          b: parseNum(sbSaneamento.pctEsgotoRedeGeral),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "lixoColetado",
          label: "Lixo coletado",
          a: parseNum(saSaneamento.pctLixoColetado),
          b: parseNum(sbSaneamento.pctLixoColetado),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "aguaNaoEncanada",
          label: "Sem água encanada",
          a: parseNum(saSaneamento.pctAguaNaoEncanada),
          b: parseNum(sbSaneamento.pctAguaNaoEncanada),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "domSemBanheiro",
          label: "Sem banheiro",
          a: parseNum(saSaneamento.pctDomSemBanheiro),
          b: parseNum(sbSaneamento.pctDomSemBanheiro),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "aguaInadequada",
          label: "Água inadequada",
          a: parseNum(saSaneamento.pctAguaInadequada),
          b: parseNum(sbSaneamento.pctAguaInadequada),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "esgotoInadequado",
          label: "Esgoto inadequado",
          a: parseNum(saSaneamento.pctEsgotoInadequado),
          b: parseNum(sbSaneamento.pctEsgotoInadequado),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "lixoInadequado",
          label: "Lixo inadequado",
          a: parseNum(saSaneamento.pctLixoInadequado),
          b: parseNum(sbSaneamento.pctLixoInadequado),
          format: "pct",
          higherIsBetter: false,
        }
      ]
    },
    {
      label: "Habitação e vulnerabilidade",
      metrics: [
        {
          key: "taxaAlfabetizacao15Mais",
          label: "Alfabetização (15+)",
          a: Math.max(0, 100 - parseNum(saEducacaoPop.taxaAnalfabetismo15Mais)),
          b: Math.max(0, 100 - parseNum(sbEducacaoPop.taxaAnalfabetismo15Mais)),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "razaoDependencia",
          label: "Razão de dependência",
          a: parseNum(saEstruturaEtaria.razaoDependencia),
          b: parseNum(sbEstruturaEtaria.razaoDependencia),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "domNaoSuperlotado",
          label: "Dom. não superlotados",
          a: Math.max(0, 100 - parseNum(saHabitacao.pctDomSuperlotado)),
          b: Math.max(0, 100 - parseNum(sbHabitacao.pctDomSuperlotado)),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "domUnipessoal",
          label: "Dom. unipessoais",
          a: parseNum(saHabitacao.pctDomUnipessoal),
          b: parseNum(sbHabitacao.pctDomUnipessoal),
          format: "pct",
          higherIsBetter: false,
          competitive: false,
        },
        {
          key: "domTipoCasa",
          label: "Dom. tipo casa",
          a: parseNum(saHabitacao.pctDomTipoCasa),
          b: parseNum(sbHabitacao.pctDomTipoCasa),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "domTipoApto",
          label: "Dom. tipo apartamento",
          a: parseNum(saHabitacao.pctDomTipoApto),
          b: parseNum(sbHabitacao.pctDomTipoApto),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "domDegradado",
          label: "Dom. degradado/inacabado",
          a: parseNum(saHabitacao.pctDomDegradado),
          b: parseNum(sbHabitacao.pctDomDegradado),
          format: "pct",
          higherIsBetter: false,
        }
      ]
    }
  ];

  return groups;
}
