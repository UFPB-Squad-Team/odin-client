import type { MapEntity, ObservatorySelection } from "@/core/types/shell";
import type { EscolaEntityData, EtapaIndicadores } from "@/modules/educacao/types/education";
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

function etapaRows(label: string, etapa: EtapaIndicadores | undefined) {
  if (!etapa || Object.values(etapa).every((v) => !v)) return [];
  return [
    {
      label: `${label} — alunos/turma`,
      value: formatNum(etapa.alunosPorTurma),
      description: "",
    },
    {
      label: `${label} — aprovação`,
      value: formatPct(etapa.taxaAprovacao),
      description: "",
    },
    {
      label: `${label} — reprovação`,
      value: formatPct(etapa.taxaReprovacao),
      description: "",
    },
    {
      label: `${label} — horas/dia`,
      value: etapa.horasAulaDiarias
        ? `${Number(etapa.horasAulaDiarias).toFixed(1)}h`
        : "—",
      description: "",
    },
  ].filter((row) => row.value !== "—");
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
    const props = entity.data.geoProps ?? {};
    const educacao = props.educacao as Record<string, unknown> | undefined;
    const hasApiData =
      educacao != null ||
      "total_escolas" in props ||
      "total_matriculas" in props ||
      "pct_com_internet" in props ||
      "pct_com_biblioteca" in props ||
      "pct_com_lab_informatica" in props ||
      "pct_sem_acessibilidade" in props;

    if (hasApiData) {
      const totalEscolas = educacao?.totalEscolas ?? props.total_escolas;
      const totalMatriculas = educacao?.totalMatriculas ?? props.total_matriculas;

      return {
        id: entity.data.id,
        nome: entity.data.nome,
        kind: "bairro",
        subtitle: "Visão territorial detalhada por bairro",
        sourceEntity: entity,
        metrics: [
          {
            label: "Escolas no bairro",
            value: formatNum(totalEscolas),
            description: "Total de escolas no bairro ou no recorte territorial",
          },
          {
            label: "Matrículas",
            value: formatNum(totalMatriculas),
            description: "Total de matrículas ativas no bairro ou recorte territorial",
          },
        ].filter((metric) => metric.value !== "—"),
        sections: [
          {
            title: "Indicadores educacionais",
            rows: [
              {
                label: "Total de escolas",
                value: formatNum(totalEscolas),
                description: "Escolas no bairro/setor",
              },
              {
                label: "Total de matrículas",
                value: formatNum(totalMatriculas),
                description: "Matrículas ativas no bairro/setor",
              },
              {
                label: "IDEB médio",
                value: formatDecimal(educacao?.avgIdeb ?? props.avg_ideb),
                description: "Índice de Desenvolvimento da Educação Básica médio do recorte",
              },
            ].filter((row) => row.value !== "—"),
          },
          {
            title: "Infraestrutura escolar",
            rows: [
              {
                label: "Com internet",
                value: formatPct(educacao?.pctComInternet ?? props.pct_com_internet),
                description: "Escolas com acesso à internet",
              },
              {
                label: "Com biblioteca",
                value: formatPct(educacao?.pctComBiblioteca ?? props.pct_com_biblioteca),
                description: "Escolas com biblioteca ou sala de leitura",
              },
              {
                label: "Com lab. informática",
                value: formatPct(educacao?.pctComLabInformatica ?? props.pct_com_lab_informatica),
                description: "Escolas com laboratório de informática",
              },
              {
                label: "Sem acessibilidade",
                value: formatPct(educacao?.pctSemAcessibilidade ?? props.pct_sem_acessibilidade),
                description: "Escolas sem infraestrutura de acessibilidade",
              },
            ].filter((row) => row.value !== "—"),
          },
        ].filter((section) => section.rows.length > 0),
      };
    }

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
  const raw = entity.data as EscolaEntityData;

  console.log("Construindo seleção para escola com dados:", raw);

  const indicadores = raw.indicadores;
  const matriculas = raw.matriculas ?? (raw.geoProps?.matriculas as Record<string, unknown> | undefined);

  const totalAlunos = matriculas?.totalAlunos != null ? Number(matriculas.totalAlunos) : null;
  const inepId = raw.inepId ?? raw.id;
  const ibgeMunicipio = raw.municipioId ?? "—";
  const geoProps = (raw.geoProps ?? {}) as Record<string, unknown>;
  const escolaMunicipio = raw.municipioNome ?? String(geoProps.municipio_nome ?? geoProps.municipio ?? "—");
  const escolaBairro = raw.bairroNome ?? String(geoProps.bairro_nome ?? geoProps.bairro ?? "—");
  const escolaUf = raw.estadoSigla ?? String(geoProps.estado_sigla ?? geoProps.uf ?? "—");
  const escolaDependencia =
    raw.dependencia_adm ??
    raw.dependenciaAdministrativa ??
    String(geoProps.dependencia_adm ?? geoProps.dependencia ?? "Não informado");
  const escolaZona =
    raw.tipo_localizacao ??
    raw.tipoLocalizacao ??
    String(geoProps.tipo_localizacao ?? geoProps.zona ?? geoProps.zonaLocalizacao ?? "—");
  const escolaAno = indicadores?.anoReferencia ?? null;
  const etapasSections = [
  ...etapaRows("Ed. infantil", indicadores?.educacaoInfantil),
  ...etapaRows("Fund. iniciais", indicadores?.fundamentalAnosIniciais),
  ...etapaRows("Fund. finais", indicadores?.fundamentalAnosFinais),
  ...etapaRows("Ensino médio", indicadores?.ensinoMedio),
];

  const matriculasRows = matriculas
    ? [
        ...(matriculas.totalAlunos != null && Number(matriculas.totalAlunos) > 0 ? [{ label: "Total de alunos (censo)", value: formatNum(matriculas.totalAlunos), description: "Soma INF+FUND+MED+EJA do censo escolar" }] : []),
        ...(matriculas.educacaoInfantil != null && Number(matriculas.educacaoInfantil) > 0 ? [{ label: "Educação infantil", value: formatNum(matriculas.educacaoInfantil), description: "Matrículas em educação infantil" }] : []),
        ...(matriculas.educacaoInfantilCreche != null && Number(matriculas.educacaoInfantilCreche) > 0 ? [{ label: "Creche", value: formatNum(matriculas.educacaoInfantilCreche), description: "Matrículas em creche" }] : []),
        ...(matriculas.educacaoInfantilPreEscola != null && Number(matriculas.educacaoInfantilPreEscola) > 0 ? [{ label: "Pré-escola", value: formatNum(matriculas.educacaoInfantilPreEscola), description: "Matrículas em pré-escola" }] : []),
        ...(matriculas.fundamentalTotal != null && Number(matriculas.fundamentalTotal) > 0 ? [{ label: "Fundamental (total)", value: formatNum(matriculas.fundamentalTotal), description: "Matrículas no ensino fundamental" }] : []),
        ...(matriculas.fundamentalAnosIniciais != null && Number(matriculas.fundamentalAnosIniciais) > 0 ? [{ label: "Fund. anos iniciais", value: formatNum(matriculas.fundamentalAnosIniciais), description: "Matrículas nos anos iniciais do fundamental" }] : []),
        ...(matriculas.fundamentalAnosFinais != null && Number(matriculas.fundamentalAnosFinais) > 0 ? [{ label: "Fund. anos finais", value: formatNum(matriculas.fundamentalAnosFinais), description: "Matrículas nos anos finais do fundamental" }] : []),
        ...(matriculas.ensinoMedio != null && Number(matriculas.ensinoMedio) > 0 ? [{ label: "Ensino médio", value: formatNum(matriculas.ensinoMedio), description: "Matrículas no ensino médio" }] : []),
        ...(matriculas.eja != null && Number(matriculas.eja) > 0 ? [{ label: "EJA", value: formatNum(matriculas.eja), description: "Matrículas em Educação de Jovens e Adultos" }] : []),
      ]
    : [];

return {
  id: entity.data.id,
  nome: raw.nome,
  kind: "escola",
  subtitle: "Visão micro em unidade escolar",
  sourceEntity: entity,
  metrics: [
    {
      label: "IDEB",
      value: raw.ideb != null ? Number(raw.ideb).toFixed(1) : "—",
      description: "",
    },
    {
      label: "INSE",
      value: raw.inse != null ? Number(raw.inse).toFixed(1) : "—",
      description: "",
    },
  ],
  sections: [
    {
      title: "Identificação",
      rows: [
        { label: "IBGE (mun.)", value: String(ibgeMunicipio), description: "" },
        { label: "INEP", value: String(inepId), description: "" },
        { label: "Alunos", value: totalAlunos != null ? String(totalAlunos) : "—", description: "" },
        { label: "Município", value: escolaMunicipio, description: "" },
        { label: "Bairro", value: escolaBairro, description: "" },
        { label: "UF", value: escolaUf, description: "" },
        { label: "Dependência", value: escolaDependencia, description: "" },
        { label: "Ano referência", value: escolaAno ? String(escolaAno) : "—", description: "" },
        { label: "Zona", value: escolaZona, description: "" },
      ],
    },
    ...(matriculasRows.length > 0
      ? [{ title: "Matrículas por etapa", rows: matriculasRows }]
      : []),
    ...(etapasSections.length > 0
      ? [{ title: "Indicadores por etapa", rows: etapasSections }]
      : []),
  ],
};
}
