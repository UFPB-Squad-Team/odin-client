import type { MapEntity, ObservatorySelection } from "@/core/types/shell";
import type { EscolaAtlasMock } from "@/modules/educacao/types/education";

export const ESCOLA_ATLAS_MOCKS: Record<string, EscolaAtlasMock> = {
  "ecit-1": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Manaíra",
      logradouro: "Av. Flávio Ribeiro Coutinho",
      municipio: "João Pessoa",
      uf: "PB",
    },
    indicadores: {
      taxaAbandono: 1.2,
      taxaReprovacao: 5.3,
      docentesSuperior: 94,
      horasAulaDiarias: 5.4,
      tdi: 12,
      tnr: 1.1,
    },
    infraestrutura: {
      internetParaAlunos: true,
      possuiBiblioteca: true,
      possuiLaboratorioInformatica: true,
      possuiAcessibilidadePcd: true,
    },
    zonaLocalizacao: "Urbana",
  },
  "escola-2": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Tambaú",
      logradouro: "Av. Epitácio Pessoa",
      municipio: "João Pessoa",
      uf: "PB",
    },
    indicadores: {
      taxaAbandono: 2.1,
      taxaReprovacao: 8.7,
      docentesSuperior: 91,
      horasAulaDiarias: 5,
      tdi: 14,
      tnr: 1.3,
    },
    infraestrutura: {
      internetParaAlunos: false,
      possuiBiblioteca: false,
      possuiLaboratorioInformatica: true,
      possuiAcessibilidadePcd: true,
    },
    zonaLocalizacao: "Urbana",
  },
  "escola-3": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Catolé",
      logradouro: "Rua Vigário Calixto",
      municipio: "Campina Grande",
      uf: "PB",
    },
    indicadores: {
      taxaAbandono: 3.6,
      taxaReprovacao: 12.4,
      docentesSuperior: 88,
      horasAulaDiarias: 4.8,
      tdi: 18,
      tnr: 1.6,
    },
    infraestrutura: {
      internetParaAlunos: false,
      possuiBiblioteca: false,
      possuiLaboratorioInformatica: false,
      possuiAcessibilidadePcd: false,
    },
    zonaLocalizacao: "Urbana",
  },
  "escola-4": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Boa Viagem",
      logradouro: "Av. Boa Viagem",
      municipio: "Recife",
      uf: "PE",
    },
    indicadores: {
      taxaAbandono: 0.9,
      taxaReprovacao: 4.9,
      docentesSuperior: 96,
      horasAulaDiarias: 5.7,
      tdi: 10,
      tnr: 0.9,
    },
    infraestrutura: {
      internetParaAlunos: true,
      possuiBiblioteca: true,
      possuiLaboratorioInformatica: true,
      possuiAcessibilidadePcd: true,
    },
    zonaLocalizacao: "Urbana",
  },
  "escola-5": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Meireles",
      logradouro: "Av. Beira Mar",
      municipio: "Fortaleza",
      uf: "CE",
    },
    indicadores: {
      taxaAbandono: 1.1,
      taxaReprovacao: 5.7,
      docentesSuperior: 95,
      horasAulaDiarias: 5.6,
      tdi: 11,
      tnr: 1,
    },
    infraestrutura: {
      internetParaAlunos: true,
      possuiBiblioteca: true,
      possuiLaboratorioInformatica: true,
      possuiAcessibilidadePcd: true,
    },
    zonaLocalizacao: "Urbana",
  },
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Constrói o ObservatorySelection para uma entidade educacional.
 * Chamado pelo Shell via ModuleContract.buildSelection().
 */
function formatPct(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `${num.toFixed(1)}%`;
}

function formatNum(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return String(num);
}

function formatDecimal(value: unknown, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num.toFixed(decimals);
}

export function buildEducationSelection(
  entity: MapEntity,
): ObservatorySelection {
  if (entity.kind === "municipio") {
    const props = entity.data.geoProps ?? {};
    const hasApiData =
      entity.data.geoProps != null &&
      (props.source === "municipio_indicadores" ||
        "total_escolas" in props ||
        "avg_ideb" in props ||
        "pct_com_internet" in props);

    if (hasApiData) {
      // A API retorna tanto campos flat quanto aninhados em `educacao`
      // Preferimos os aninhados quando disponíveis pois são mais completos
      const edu = props.educacao as Record<string, unknown> | undefined;

      return {
        id: entity.data.id,
        nome: entity.data.nome,
        kind: "municipio",
        subtitle: "Visão agregada por município",
        metrics: [
          {
            label: "Escolas",
            value: formatNum(edu?.totalEscolas ?? props.total_escolas),
            description:
              "Total de escolas no município conforme dados do censo escolar",
          },
          {
            label: "Matrículas",
            value: formatNum(edu?.totalMatriculas ?? props.total_alunos),
            description: "Total de matrículas ativas no município",
          },
        ],
        sections: [
          {
            title: "Indicadores educacionais",
            rows: [
              {
                label: "Total de matrículas",
                value: formatNum(edu?.totalMatriculas ?? props.total_alunos),
                description: "Total de matrículas ativas no município",
              },
              {
                label: "IDEB médio",
                value: formatDecimal(props.avg_ideb),
                description:
                  "Índice de Desenvolvimento da Educação Básica médio do município",
              },
              {
                label: "Bairros com escolas",
                value: formatNum(edu?.totalBairros),
                description:
                  "Número de bairros que possuem ao menos uma escola",
              },
            ],
          },
          {
            title: "Infraestrutura escolar",
            rows: [
              {
                label: "Com internet para alunos",
                value: formatPct(edu?.pctComInternet ?? props.pct_com_internet),
                description:
                  "Percentual de escolas com acesso à internet para alunos",
              },
              {
                label: "Com biblioteca",
                value: formatPct(
                  edu?.pctComBiblioteca ?? props.pct_com_biblioteca,
                ),
                description:
                  "Percentual de escolas com biblioteca ou sala de leitura",
              },
              {
                label: "Com lab. informática",
                value: formatPct(
                  edu?.pctComLabInformatica ?? props.pct_com_lab_informatica,
                ),
                description:
                  "Percentual de escolas com laboratório de informática",
              },
              {
                label: "Sem acessibilidade PCD",
                value: formatPct(
                  edu?.pctSemAcessibilidade ?? props.pct_sem_acessibilidade,
                ),
                description:
                  "Percentual de escolas sem infraestrutura de acessibilidade para PCD",
              },
            ],
          },
        ],
      };
    }

    // Fallback para mock quando não há dados da API
    const municipioEscolaDetails = Object.values(ESCOLA_ATLAS_MOCKS);
    const internetCount = municipioEscolaDetails.filter(
      (e) => e.infraestrutura.internetParaAlunos,
    ).length;

    return {
      id: entity.data.id,
      nome: entity.data.nome,
      kind: "municipio",
      subtitle: "Visão agregada por município",
      sourceEntity: entity,
      metrics: [
        {
          label: "Escolas no recorte",
          value: String(municipioEscolaDetails.length),
          description: "",
        },
        {
          label: "% internet para alunos",
          value: municipioEscolaDetails.length
            ? `${((internetCount / municipioEscolaDetails.length) * 100).toFixed(1)}%`
            : "—",
          description: "",
        },
      ],
      sections: [
        {
          title: "Indicadores educacionais (mock)",
          rows: [
            {
              label: "Taxa média de abandono",
              value: `${average(municipioEscolaDetails.map((e) => e.indicadores.taxaAbandono ?? 0).filter((v) => v > 0)).toFixed(1)}%`,
              description: "",
            },
            {
              label: "Taxa média de reprovação",
              value: `${average(municipioEscolaDetails.map((e) => e.indicadores.taxaReprovacao ?? 0).filter((v) => v > 0)).toFixed(1)}%`,
              description: "",
            },
            {
              label: "Docentes com superior (média)",
              value: `${average(municipioEscolaDetails.map((e) => e.indicadores.docentesSuperior ?? 0).filter((v) => v > 0)).toFixed(1)}%`,
              description: "",
            },
          ],
        },
      ],
    };
  }

  if (entity.kind === "bairro") {
    const bairroEscolaDetails = Object.values(ESCOLA_ATLAS_MOCKS).slice(0, 2);

    return {
      id: entity.data.id,
      nome: entity.data.nome,
      kind: "bairro",
      subtitle: "Visão territorial detalhada por bairro",
      sourceEntity: entity,
      metrics: [
        {
          label: "Escolas no bairro",
          value: String(bairroEscolaDetails.length),
          description: "",
        },
        { label: "Nível de análise", value: "Granular", description: "" },
      ],
      sections: [
        {
          title: "Infraestrutura (mock)",
          rows: [
            {
              label: "Escolas com biblioteca",
              value: `${bairroEscolaDetails.filter((e) => e.infraestrutura.possuiBiblioteca).length}/${bairroEscolaDetails.length}`,
              description: "",
            },
            {
              label: "Escolas com lab. informática",
              value: `${bairroEscolaDetails.filter((e) => e.infraestrutura.possuiLaboratorioInformatica).length}/${bairroEscolaDetails.length}`,
              description: "",
            },
            {
              label: "Escolas com internet p/ alunos",
              value: `${bairroEscolaDetails.filter((e) => e.infraestrutura.internetParaAlunos).length}/${bairroEscolaDetails.length}`,
              description: "",
            },
          ],
        },
      ],
    };
  }

  // escola
  const detail = ESCOLA_ATLAS_MOCKS[entity.data.id];
  const escolaNome = entity.data.nome;
  const escolaMunicipio = entity.data.municipioNome ?? "—";
  const escolaBairro = entity.data.bairroNome ?? "—";
  const escolaUf = entity.data.estadoSigla ?? detail?.endereco.uf ?? "—";
  const escolaDependencia = detail?.dependenciaAdm ?? "Não informado";
  const escolaZona = detail?.zonaLocalizacao ?? "—";
  const escolaAno = detail?.anoReferencia ?? null;

  return {
    id: entity.data.id,
    nome: escolaNome,
    kind: "escola",
    subtitle: "Visão micro em unidade escolar",
    sourceEntity: entity,
    metrics: [
      {
        label: "IDEB",
        value: entity.data.ideb?.toFixed(1) ?? "—",
        description: "",
      },
      {
        label: "INSE",
        value: entity.data.inse?.toFixed(1) ?? "—",
        description: "",
      },
    ],
    sections: [
      {
        title: "Identificação",
        rows: [
          { label: "INEP", value: String(entity.data.inepId ?? entity.data.id), description: "" },
          { label: "Município", value: escolaMunicipio, description: "" },
          { label: "Bairro", value: escolaBairro, description: "" },
          { label: "UF", value: escolaUf, description: "" },
          { label: "Dependência", value: escolaDependencia, description: "" },
          { label: "Ano referência", value: escolaAno ? String(escolaAno) : "—", description: "" },
          { label: "Zona", value: escolaZona, description: "" },
        ],
      },
      {
        title: "Indicadores",
        rows: [
          { label: "IDEB", value: entity.data.ideb?.toFixed(1) ?? "—", description: "" },
          { label: "INSE", value: entity.data.inse?.toFixed(1) ?? "—", description: "" },
        ],
      },
    ],
  };
}
