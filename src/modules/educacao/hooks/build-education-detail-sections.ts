import type { MapEntity } from "@/core/types/shell";
import type { ModuleDetailContribution, DetailSection } from "@/core/types/module";
import type { EscolaEntityData, EtapaIndicadores } from "@/modules/educacao/types/education";

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
  return num.toLocaleString("pt-BR");
}

function formatDecimal(value: unknown, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num.toFixed(decimals);
}

function formatHoras(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `${num.toFixed(1)}h`;
}

function etapaRows(label: string, etapa: EtapaIndicadores | undefined) {
  if (!etapa || Object.values(etapa).every((v) => !v)) return [];
  return [
    { label: `${label} — alunos/turma`, value: formatNum(etapa.alunosPorTurma), description: "" },
    { label: `${label} — aprovação`, value: formatPct(etapa.taxaAprovacao), description: "" },
    { label: `${label} — reprovação`, value: formatPct(etapa.taxaReprovacao), description: "" },
    { label: `${label} — horas/dia`, value: etapa.horasAulaDiarias ? `${Number(etapa.horasAulaDiarias).toFixed(1)}h` : "—", description: "" },
  ].filter((row) => row.value !== "—");
}

export function buildEducationDetailSections(
  entity: MapEntity,
): ModuleDetailContribution | null {
  if (entity.kind === "municipio") {
    const props = entity.data.geoProps ?? {};
    const edu = props.educacao as Record<string, unknown> | undefined;

    const hasData = edu != null || "total_escolas" in props || "pct_com_internet" in props;
    if (!hasData) return null;

    return {
      metrics: [
        { label: "Escolas", value: formatNum(edu?.totalEscolas ?? props.total_escolas), description: "Total de escolas no município" },
        { label: "Matrículas", value: formatNum(edu?.totalMatriculas ?? props.total_alunos), description: "Total de matrículas ativas" },
      ],
      sections: [
        {
          title: "IDEB",
          source: "Censo Escolar",
          rows: [
            { label: "Anos iniciais", value: formatDecimal(edu?.mediaIdebAnosIniciais), description: "IDEB médio dos anos iniciais do fundamental" },
            { label: "Anos finais", value: formatDecimal(edu?.mediaIdebAnosFinals ?? edu?.mediaIdebAnosFinais), description: "IDEB médio dos anos finais do fundamental" },
            { label: "Ensino médio", value: formatDecimal(edu?.mediaIdebEnsinoMedio), description: "IDEB médio do ensino médio" },
          ].filter((r) => r.value !== "—"),
        },
        {
          title: "Infraestrutura escolar",
          source: "Censo Escolar",
          rows: [
            { label: "Com internet (geral)", value: formatPct(edu?.pctComInternet ?? props.pct_com_internet), description: "Escolas com acesso à internet" },
            { label: "Internet para alunos", value: formatPct(edu?.pctComInternetAlunos ?? props.pct_com_internet_alunos), description: "Escolas com internet disponível para alunos" },
            { label: "Biblioteca", value: formatPct(edu?.pctComBiblioteca ?? props.pct_com_biblioteca), description: "Escolas com biblioteca ou sala de leitura" },
            { label: "Lab. informática", value: formatPct(edu?.pctComLaboratorioInformatica ?? props.pct_com_lab_informatica), description: "Escolas com laboratório de informática" },
            { label: "Lab. ciências", value: formatPct(edu?.pctComLaboratorioCiencias ?? props.pct_com_lab_ciencias), description: "Escolas com laboratório de ciências" },
            { label: "Quadra de esportes", value: formatPct(edu?.pctComQuadraEsportes), description: "Escolas com quadra de esportes" },
            { label: "Cozinha", value: formatPct(edu?.pctComCozinha), description: "Escolas com cozinha" },
            { label: "Refeitório", value: formatPct(edu?.pctComRefeitorio), description: "Escolas com refeitório" },
            { label: "Água potável", value: formatPct(edu?.pctComAguaPotavel), description: "Escolas com água potável" },
            { label: "Energia pública", value: formatPct(edu?.pctComEnergiaPublica), description: "Escolas com energia da rede pública" },
            { label: "Esgoto rede pública", value: formatPct(edu?.pctComEsgotoRedePublica), description: "Escolas com esgoto da rede pública" },
            { label: "Coleta de lixo", value: formatPct(edu?.pctComColetaLixo), description: "Escolas com coleta de lixo" },
            { label: "Sem acessibilidade PCD", value: formatPct(edu?.pctSemAcessibilidade ?? props.pct_sem_acessibilidade), description: "Escolas sem infraestrutura de acessibilidade" },
          ].filter((r) => r.value !== "—"),
        },
        {
          title: "Taxas de aprovação",
          source: "Censo Escolar",
          defaultOpen: false,
          rows: [
            { label: "Anos iniciais", value: formatPct(edu?.mediaTaxaAprovacaoAi), description: "Taxa média de aprovação nos anos iniciais" },
            { label: "Anos finais", value: formatPct(edu?.mediaTaxaAprovacaoAf), description: "Taxa média de aprovação nos anos finais" },
            { label: "Ensino médio", value: formatPct(edu?.mediaTaxaAprovacaoEm), description: "Taxa média de aprovação no ensino médio" },
          ].filter((r) => r.value !== "—"),
        },
        {
          title: "Taxas de abandono",
          source: "Censo Escolar",
          defaultOpen: false,
          rows: [
            { label: "Anos iniciais", value: formatPct(edu?.mediaTaxaAbandonoAi), description: "Taxa média de abandono nos anos iniciais" },
            { label: "Anos finais", value: formatPct(edu?.mediaTaxaAbandonoAf), description: "Taxa média de abandono nos anos finais" },
            { label: "Ensino médio", value: formatPct(edu?.mediaTaxaAbandonoEm), description: "Taxa média de abandono no ensino médio" },
          ].filter((r) => r.value !== "—"),
        },
        {
          title: "Distorção idade-série (TDI)",
          source: "Censo Escolar",
          defaultOpen: false,
          rows: [
            { label: "Anos iniciais", value: formatPct(edu?.mediaTdiAnosIniciais), description: "Taxa de distorção idade-série nos anos iniciais" },
            { label: "Anos finais", value: formatPct(edu?.mediaTdiAnosFinais), description: "Taxa de distorção idade-série nos anos finais" },
            { label: "Ensino médio", value: formatPct(edu?.mediaTdiEnsinoMedio), description: "Taxa de distorção idade-série no ensino médio" },
          ].filter((r) => r.value !== "—"),
        },
        {
          title: "Docentes com ensino superior",
          source: "Censo Escolar",
          defaultOpen: false,
          rows: [
            { label: "Anos iniciais", value: formatPct(edu?.mediaDocentesSuperiorAi), description: "% docentes com formação superior nos anos iniciais" },
            { label: "Anos finais", value: formatPct(edu?.mediaDocentesSuperiorAf), description: "% docentes com formação superior nos anos finais" },
            { label: "Ensino médio", value: formatPct(edu?.mediaDocentesSuperiorEm), description: "% docentes com formação superior no ensino médio" },
          ].filter((r) => r.value !== "—"),
        },
        {
          title: "Adequação formação docente (AFD)",
          source: "Censo Escolar",
          defaultOpen: false,
          rows: [
            { label: "Anos iniciais", value: formatPct(edu?.mediaAfdAnosIniciais), description: "Adequação da formação docente nos anos iniciais" },
            { label: "Anos finais", value: formatPct(edu?.mediaAfdAnosFinais), description: "Adequação da formação docente nos anos finais" },
            { label: "Ensino médio", value: formatPct(edu?.mediaAfdEnsinoMedio), description: "Adequação da formação docente no ensino médio" },
          ].filter((r) => r.value !== "—"),
        },
        {
          title: "Horas-aula diárias",
          source: "Censo Escolar",
          defaultOpen: false,
          rows: [
            { label: "Anos iniciais", value: formatHoras(edu?.mediaHorasAulaAi), description: "Média de horas-aula diárias nos anos iniciais" },
            { label: "Anos finais", value: formatHoras(edu?.mediaHorasAulaAf), description: "Média de horas-aula diárias nos anos finais" },
            { label: "Ensino médio", value: formatHoras(edu?.mediaHorasAulaEm), description: "Média de horas-aula diárias no ensino médio" },
          ].filter((r) => r.value !== "—"),
        },
        {
          title: "Alunos por turma",
          source: "Censo Escolar",
          defaultOpen: false,
          rows: [
            { label: "Anos iniciais", value: formatDecimal(edu?.mediaAlunosTurmaAi), description: "Média de alunos por turma nos anos iniciais" },
            { label: "Anos finais", value: formatDecimal(edu?.mediaAlunosTurmaAf), description: "Média de alunos por turma nos anos finais" },
            { label: "Ensino médio", value: formatDecimal(edu?.mediaAlunosTurmaEm), description: "Média de alunos por turma no ensino médio" },
          ].filter((r) => r.value !== "—"),
        },
        {
          title: "Informações gerais",
          source: "Censo Escolar",
          defaultOpen: false,
          rows: [
            { label: "Bairros com escolas", value: formatNum(edu?.totalBairros), description: "Bairros que possuem ao menos uma escola" },
          ].filter((r) => r.value !== "—" && r.value !== "0"),
        },
      ].filter((s) => s.rows.length > 0),
    };
  }

  if (entity.kind === "bairro") {
    const props = entity.data.geoProps ?? {};
    const edu = props.educacao as Record<string, unknown> | undefined;

    const hasData = edu != null || "total_escolas" in props || "pct_com_internet" in props;
    if (!hasData) return null;

    return {
      metrics: [
        { label: "Escolas", value: formatNum(edu?.totalEscolas ?? props.total_escolas), description: "Total de escolas no bairro" },
        { label: "Matrículas", value: formatNum(edu?.totalMatriculas ?? props.total_matriculas), description: "Total de matrículas ativas" },
      ].filter((m) => m.value !== "—"),
      sections: [
        {
          title: "Infraestrutura escolar",
          source: "Censo Escolar",
          rows: [
            { label: "Com internet", value: formatPct(edu?.pctComInternet ?? props.pct_com_internet), description: "Escolas com acesso à internet" },
            { label: "Internet para alunos", value: formatPct(edu?.pctComInternetAlunos ?? props.pct_com_internet_alunos), description: "Escolas com internet para alunos" },
            { label: "Biblioteca", value: formatPct(edu?.pctComBiblioteca ?? props.pct_com_biblioteca), description: "Escolas com biblioteca" },
            { label: "Lab. informática", value: formatPct(edu?.pctComLaboratorioInformatica ?? props.pct_com_lab_informatica), description: "Escolas com laboratório de informática" },
            { label: "Lab. ciências", value: formatPct(edu?.pctComLaboratorioCiencias ?? props.pct_com_lab_ciencias), description: "Escolas com laboratório de ciências" },
            { label: "Sem acessibilidade", value: formatPct(edu?.pctSemAcessibilidade ?? props.pct_sem_acessibilidade), description: "Escolas sem acessibilidade" },
          ].filter((r) => r.value !== "—"),
        },
      ].filter((s) => s.rows.length > 0),
    };
  }

  // escola
  const raw = entity.data as EscolaEntityData;
  const indicadores = raw.indicadores;
  const matriculas = raw.matriculas ?? (raw.geoProps?.matriculas as Record<string, unknown> | undefined);
  const totalAlunos = matriculas?.totalAlunos != null ? Number(matriculas.totalAlunos) : null;

  const sections: DetailSection[] = [];

  // Identificação
  sections.push({
    title: "Identificação",
    source: "Censo Escolar",
    rows: [
      { label: "INEP", value: raw.inepId ?? raw.id },
      { label: "Alunos", value: totalAlunos != null ? formatNum(totalAlunos) : "—" },
      { label: "Município", value: raw.municipioNome ?? "—" },
      { label: "Bairro", value: raw.bairroNome ?? "—" },
      { label: "Dependência", value: raw.dependencia_adm ?? raw.dependenciaAdministrativa ?? "—" },
      { label: "Zona", value: raw.tipo_localizacao ?? raw.tipoLocalizacao ?? "—" },
    ].filter((r) => r.value !== "—"),
  });

  // Matrículas por etapa
  if (matriculas) {
    const matriculasRows = [
      ...(matriculas.educacaoInfantil != null && Number(matriculas.educacaoInfantil) > 0 ? [{ label: "Educação infantil", value: formatNum(matriculas.educacaoInfantil), description: "Matrículas em educação infantil" }] : []),
      ...(matriculas.fundamentalTotal != null && Number(matriculas.fundamentalTotal) > 0 ? [{ label: "Fundamental", value: formatNum(matriculas.fundamentalTotal), description: "Matrículas no ensino fundamental" }] : []),
      ...(matriculas.ensinoMedio != null && Number(matriculas.ensinoMedio) > 0 ? [{ label: "Ensino médio", value: formatNum(matriculas.ensinoMedio), description: "Matrículas no ensino médio" }] : []),
      ...(matriculas.eja != null && Number(matriculas.eja) > 0 ? [{ label: "EJA", value: formatNum(matriculas.eja), description: "Educação de Jovens e Adultos" }] : []),
    ];
    if (matriculasRows.length > 0) {
      sections.push({ title: "Matrículas por etapa", source: "Censo Escolar", rows: matriculasRows });
    }
  }

  // Indicadores por etapa
  const etapasSections = [
    ...etapaRows("Ed. infantil", indicadores?.educacaoInfantil),
    ...etapaRows("Fund. iniciais", indicadores?.fundamentalAnosIniciais),
    ...etapaRows("Fund. finais", indicadores?.fundamentalAnosFinais),
    ...etapaRows("Ensino médio", indicadores?.ensinoMedio),
  ];
  if (etapasSections.length > 0) {
    sections.push({ title: "Indicadores por etapa", source: "Censo Escolar", rows: etapasSections });
  }

  return {
    metrics: [
      { label: "IDEB", value: raw.ideb != null ? Number(raw.ideb).toFixed(1) : "—" },
      { label: "INSE", value: raw.inse != null ? Number(raw.inse).toFixed(1) : "—" },
    ].filter((m) => m.value !== "—"),
    sections: sections.filter((s) => s.rows.length > 0),
  };
}
