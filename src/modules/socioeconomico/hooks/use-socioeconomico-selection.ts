import type { MapEntity, ObservatorySelection } from "@/core/types/shell";
import { getMockSocioeconomicoMunicipio } from "@/modules/socioeconomico/services/socioeconomico-mock-data";

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


export function buildSocioeconomicoSelection(
  entity: MapEntity,
): ObservatorySelection {
  if (entity.kind === "escola") {
    return {
      id: entity.data.id,
      nome: entity.data.nome,
      kind: "escola",
      subtitle: "Dados socioeconômicos não disponíveis para escolas individuais",
      sourceEntity: entity,
      metrics: [],
    };
  }

  if (entity.kind === "municipio") {
    const props = entity.data.geoProps ?? {};
    const socio = props.socioeconomico as Record<string, unknown> | undefined;

    const hasApiData = socio != null;
    const mock = hasApiData ? null : getMockSocioeconomicoMunicipio(entity.data.id);

    const populacao = socio?.populacao as Record<string, unknown> | undefined;
    const saneamento = socio?.saneamento as Record<string, unknown> | undefined;
    const raca = socio?.raca as Record<string, unknown> | undefined;
    const estruturaEtaria = socio?.estruturaEtaria as Record<string, unknown> | undefined;
    const educacaoPopulacao = socio?.educacaoPopulacao as Record<string, unknown> | undefined;
    const familia = socio?.familia as Record<string, unknown> | undefined;
    const mortalidade = socio?.mortalidade as Record<string, unknown> | undefined;
    const habitacao = socio?.habitacao as Record<string, unknown> | undefined;
    const genero = socio?.genero as Record<string, unknown> | undefined;

    const totalPopulacao = populacao?.total ?? mock?.total_populacao;
    const totalDomicilios = populacao?.totalDomicilios ?? populacao?.totalDomiciliosParticulares;
    const mediaHabitantes = populacao?.mediaMoradoresPorDomicilio ?? mock?.media_moradores_por_domicilio;
    const pctAguaRede = saneamento?.pctAguaRedeGeral ?? mock?.pct_agua_rede_geral;
    const pctEsgotoRede = saneamento?.pctEsgotoRedeGeral ?? mock?.pct_esgoto_rede_geral;
    const pctLixoColetado = saneamento?.pctLixoColetado ?? mock?.pct_lixo_coletado;
    const pctAguaNaoEncanada = saneamento?.pctAguaNaoEncanada;
    const pctDomSemBanheiro = saneamento?.pctDomSemBanheiro;
    const pctPretaParda = raca?.pctPretaParda ?? mock?.pct_preta_parda;
    const pctBranca = raca?.pctBranca;
    const pctIndigena = raca?.pctIndigena;
    const pctCriancas = estruturaEtaria?.pctCriancas0a9 ?? mock?.pct_criancas_0_9;
    const pctIdosos = estruturaEtaria?.pctIdosos60Mais ?? mock?.pct_idosos_60_mais;
    const pctJovens15a29 = estruturaEtaria?.pctJovens15a29;
    const pctAdultos30a59 = estruturaEtaria?.pctAdultos30a59;
    const taxaAnalfabetismo = educacaoPopulacao?.taxaAnalfabetismo15Mais ?? mock?.taxa_analfabetismo_15_mais;
    const pctResponsavelFeminino = familia?.pctResponsavelFeminino;
    const pctPopMasculina = genero?.pctPopMasculina;
    const pctPopFeminina = genero?.pctPopFeminina;
    const totalObitos = mortalidade?.totalObitosDomicilios;
    const obitosInfantis = mortalidade?.obitosInfantis0a4;
    const pctDomImprovisado = habitacao?.pctDomImprovisado;
    const pctDomSuperlotado = habitacao?.pctDomSuperlotado;
    const pctDomUnipessoal = habitacao?.pctDomUnipessoal;
    const pctDomTipoCasa = habitacao?.pctDomTipoCasa;
    const pctDomTipoApto = habitacao?.pctDomTipoApto;
    const pctDomDegradado = habitacao?.pctDomDegradado;

    const fonte = (socio?.fonte as string | undefined) ?? "IBGE Censo Demográfico 2022";
    const anoRef = (socio?.anoReferencia as number | undefined) ?? 2022;

    return {
      id: entity.data.id,
      nome: entity.data.nome,
      kind: "municipio",
      subtitle: `Contexto Socioeconômico — ${fonte} (${anoRef})`,
      sourceEntity: entity,
      metrics: [
        {
          label: "População",
          value: formatNum(totalPopulacao),
          description: "População residente total conforme Censo Demográfico",
        },
        {
          label: "Analfabetismo 15+",
          value: formatPct(taxaAnalfabetismo),
          description: "Taxa de analfabetismo da população com 15 anos ou mais",
        },
      ],
      sections: [
        {
          title: "Saneamento básico",
          rows: [
            { label: "Água rede geral", value: formatPct(pctAguaRede), description: "Domicílios com abastecimento de água por rede geral" },
            { label: "Esgoto rede geral", value: formatPct(pctEsgotoRede), description: "Domicílios com esgotamento sanitário por rede geral" },
            { label: "Lixo coletado", value: formatPct(pctLixoColetado), description: "Domicílios com coleta de lixo" },
            ...(pctAguaNaoEncanada != null ? [{ label: "Sem água encanada", value: formatPct(pctAguaNaoEncanada), description: "Domicílios sem água encanada" }] : []),
            ...(pctDomSemBanheiro != null ? [{ label: "Sem banheiro", value: formatPct(pctDomSemBanheiro), description: "Domicílios sem banheiro" }] : []),
          ],
        },
        {
          title: "Gênero",
          rows: [
            ...(pctPopMasculina != null ? [{ label: "Pop. masculina", value: formatPct(pctPopMasculina), description: "Percentual da população do sexo masculino" }] : []),
            ...(pctPopFeminina != null ? [{ label: "Pop. feminina", value: formatPct(pctPopFeminina), description: "Percentual da população do sexo feminino" }] : []),
          ],
        },
        {
          title: "Perfil demográfico",
          rows: [
            { label: "Pop. preta/parda", value: formatPct(pctPretaParda), description: "Percentual da população que se declara preta ou parda" },
            ...(pctBranca != null ? [{ label: "Pop. branca", value: formatPct(pctBranca), description: "Percentual da população que se declara branca" }] : []),
            ...(pctIndigena != null ? [{ label: "Pop. indígena", value: formatPct(pctIndigena), description: "Percentual da população que se declara indígena" }] : []),
            { label: "Crianças 0–9 anos", value: formatPct(pctCriancas), description: "Percentual da população entre 0 e 9 anos" },
            ...(pctJovens15a29 != null ? [{ label: "Jovens 15–29 anos", value: formatPct(pctJovens15a29), description: "Percentual da população entre 15 e 29 anos" }] : []),
            ...(pctAdultos30a59 != null ? [{ label: "Adultos 30–59 anos", value: formatPct(pctAdultos30a59), description: "Percentual da população entre 30 e 59 anos" }] : []),
            { label: "Idosos 60+ anos", value: formatPct(pctIdosos), description: "Percentual da população com 60 anos ou mais" },
            { label: "Média hab./domicílio", value: formatNum(mediaHabitantes), description: "Média de moradores por domicílio particular" },
            ...(totalDomicilios != null ? [{ label: "Total de domicílios", value: formatNum(totalDomicilios), description: "Total de domicílios recenseados" }] : []),
            ...(pctResponsavelFeminino != null ? [{ label: "Chefes de família femininas", value: formatPct(pctResponsavelFeminino), description: "Percentual de domicílios com responsável do sexo feminino" }] : []),
          ],
        },
        {
          title: "Habitação",
          rows: [
            ...(pctDomImprovisado != null ? [{ label: "Domicílios improvisados", value: formatPct(pctDomImprovisado), description: "Percentual de domicílios em estruturas improvisadas" }] : []),
            ...(pctDomSuperlotado != null ? [{ label: "Domicílios superlotados", value: formatPct(pctDomSuperlotado), description: "Percentual de domicílios com mais de 3 moradores por dormitório" }] : []),
            ...(pctDomUnipessoal != null ? [{ label: "Domicílios unipessoais", value: formatPct(pctDomUnipessoal), description: "Percentual de domicílios com apenas 1 morador" }] : []),
            ...(pctDomTipoCasa != null ? [{ label: "Tipo casa", value: formatPct(pctDomTipoCasa), description: "Percentual de domicílios do tipo casa" }] : []),
            ...(pctDomTipoApto != null ? [{ label: "Tipo apartamento", value: formatPct(pctDomTipoApto), description: "Percentual de domicílios do tipo apartamento" }] : []),
            ...(pctDomDegradado != null ? [{ label: "Degradado/inacabado", value: formatPct(pctDomDegradado), description: "Percentual de domicílios degradados ou inacabados" }] : []),
          ],
        },
        {
          title: "Mortalidade",
          rows: [
            ...(totalObitos != null ? [{ label: "Óbitos registrados", value: formatNum(totalObitos), description: "Total de óbitos em domicílios recenseados" }] : []),
            ...(obitosInfantis != null ? [{ label: "Óbitos infantis (0–4 anos)", value: formatNum(obitosInfantis), description: "Óbitos de crianças entre 0 e 4 anos" }] : []),
          ],
        },
      ].filter((s) => s.rows.length > 0),
    };
  }

  // bairro
  const geoProps = (entity.data as unknown as Record<string, unknown>).geoProps as
    | Record<string, unknown>
    | undefined;
  const source = (geoProps?.source ?? (entity.data as unknown as Record<string, unknown>).source) as string | undefined;
  const temBairroOficial = (entity.data as unknown as Record<string, unknown>).temBairroOficial as boolean | undefined;

  const socio = geoProps?.socioeconomico as Record<string, unknown> | undefined;
  const educacao = geoProps?.educacao as Record<string, unknown> | undefined;

  const populacao = socio?.populacao as Record<string, unknown> | undefined;
  const saneamento = socio?.saneamento as Record<string, unknown> | undefined;
  const raca = socio?.raca as Record<string, unknown> | undefined;
  const estruturaEtaria = socio?.estruturaEtaria as Record<string, unknown> | undefined;
  const educacaoPopulacao = socio?.educacaoPopulacao as Record<string, unknown> | undefined;
  const familia = socio?.familia as Record<string, unknown> | undefined;
  const mortalidade = socio?.mortalidade as Record<string, unknown> | undefined;
  const habitacao = socio?.habitacao as Record<string, unknown> | undefined;
  const genero = socio?.genero as Record<string, unknown> | undefined;

  const hasRealSocioData = socio != null;
  const hasRealEducacaoData = educacao != null;
  const isSectorFallback = source === "setor_indicadores" || temBairroOficial === false;
  const isOfficialNeighborhood = source === "bairro_indicadores" || temBairroOficial === true;

  const subtitleQuality =
    isSectorFallback
      ? "Dados de setor censitário (sem delimitação oficial de bairro)"
      : isOfficialNeighborhood
      ? "Dados oficiais de bairro"
      : "Contexto Socioeconômico — IBGE Censo 2022";

  return {
    id: entity.data.id,
    nome: entity.data.nome,
    kind: "bairro",
    subtitle: subtitleQuality,
    sourceEntity: entity,
    metrics: hasRealSocioData
      ? [
          { label: "População", value: formatNum(populacao?.total), description: "População residente total" },
          { label: "Analfabetismo 15+", value: formatPct(educacaoPopulacao?.taxaAnalfabetismo15Mais), description: "Taxa de analfabetismo — 15 anos ou mais" },
        ]
      : [],
    sections: [
      ...(hasRealEducacaoData
        ? [
            {
              title: "Educação",
              rows: [
                { label: "Total de escolas", value: formatNum(educacao?.totalEscolas ?? geoProps?.total_escolas), description: "Escolas no bairro/setor" },
                { label: "Total de matrículas", value: formatNum(educacao?.totalMatriculas ?? geoProps?.total_matriculas), description: "Matrículas ativas no bairro/setor" },
                { label: "Com internet", value: formatPct(educacao?.pctComInternet ?? geoProps?.pct_com_internet), description: "Escolas com acesso à internet" },
                { label: "Com biblioteca", value: formatPct(educacao?.pctComBiblioteca ?? geoProps?.pct_com_biblioteca), description: "Escolas com biblioteca" },
                { label: "Com lab. informática", value: formatPct(educacao?.pctComLabInformatica ?? geoProps?.pct_com_lab_informatica), description: "Escolas com laboratório de informática" },
                { label: "Sem acessibilidade", value: formatPct(educacao?.pctSemAcessibilidade ?? geoProps?.pct_sem_acessibilidade), description: "Escolas sem infraestrutura de acessibilidade" },
              ].filter((r) => r.value !== "—"),
            },
          ]
        : []),
      ...(hasRealSocioData
        ? [
            {
              title: "Saneamento básico",
              rows: [
                { label: "Água rede geral", value: formatPct(saneamento?.pctAguaRedeGeral), description: "Domicílios com abastecimento de água por rede geral" },
                { label: "Esgoto rede geral", value: formatPct(saneamento?.pctEsgotoRedeGeral), description: "Domicílios com esgotamento sanitário por rede geral" },
                { label: "Lixo coletado", value: formatPct(saneamento?.pctLixoColetado), description: "Domicílios com coleta de lixo" },
                ...(saneamento?.pctAguaNaoEncanada != null ? [{ label: "Sem água encanada", value: formatPct(saneamento.pctAguaNaoEncanada), description: "Domicílios sem água encanada" }] : []),
                ...(saneamento?.pctDomSemBanheiro != null ? [{ label: "Sem banheiro", value: formatPct(saneamento.pctDomSemBanheiro), description: "Domicílios sem banheiro" }] : []),
              ].filter((r) => r.value !== "—"),
            },
            {
              title: "Gênero",
              rows: [
                ...(genero?.pctPopMasculina != null ? [{ label: "Pop. masculina", value: formatPct(genero.pctPopMasculina), description: "Percentual da população do sexo masculino" }] : []),
                ...(genero?.pctPopFeminina != null ? [{ label: "Pop. feminina", value: formatPct(genero.pctPopFeminina), description: "Percentual da população do sexo feminino" }] : []),
              ],
            },
            {
              title: "Perfil demográfico",
              rows: [
                { label: "Pop. preta/parda", value: formatPct(raca?.pctPretaParda), description: "Percentual da população que se declara preta ou parda" },
                ...(raca?.pctBranca != null ? [{ label: "Pop. branca", value: formatPct(raca.pctBranca), description: "Percentual da população que se declara branca" }] : []),
                ...(raca?.pctIndigena != null ? [{ label: "Pop. indígena", value: formatPct(raca.pctIndigena), description: "Percentual da população que se declara indígena" }] : []),
                { label: "Crianças 0–9 anos", value: formatPct(estruturaEtaria?.pctCriancas0a9), description: "Percentual da população entre 0 e 9 anos" },
                ...(estruturaEtaria?.pctJovens15a29 != null ? [{ label: "Jovens 15–29 anos", value: formatPct(estruturaEtaria.pctJovens15a29), description: "Percentual da população entre 15 e 29 anos" }] : []),
                ...(estruturaEtaria?.pctAdultos30a59 != null ? [{ label: "Adultos 30–59 anos", value: formatPct(estruturaEtaria.pctAdultos30a59), description: "Percentual da população entre 30 e 59 anos" }] : []),
                { label: "Idosos 60+ anos", value: formatPct(estruturaEtaria?.pctIdosos60Mais), description: "Percentual da população com 60 anos ou mais" },
                { label: "Média hab./domicílio", value: formatNum(populacao?.mediaMoradoresPorDomicilio), description: "Média de moradores por domicílio particular" },
                ...(populacao?.totalDomicilios != null ? [{ label: "Total de domicílios", value: formatNum(populacao.totalDomicilios), description: "Total de domicílios recenseados" }] : []),
                ...(populacao?.totalDomiciliosParticulares != null && populacao?.totalDomicilios == null ? [{ label: "Domicílios particulares", value: formatNum(populacao.totalDomiciliosParticulares), description: "Total de domicílios particulares recenseados" }] : []),
                ...(familia?.pctResponsavelFeminino != null ? [{ label: "Chefes de família femininas", value: formatPct(familia.pctResponsavelFeminino), description: "Percentual de domicílios com responsável do sexo feminino" }] : []),
              ].filter((r) => r.value !== "—"),
            },
            {
              title: "Habitação",
              rows: [
                ...(habitacao?.pctDomImprovisado != null ? [{ label: "Domicílios improvisados", value: formatPct(habitacao.pctDomImprovisado), description: "Percentual de domicílios em estruturas improvisadas" }] : []),
                ...(habitacao?.pctDomSuperlotado != null ? [{ label: "Domicílios superlotados", value: formatPct(habitacao.pctDomSuperlotado), description: "Percentual de domicílios com mais de 3 moradores por dormitório" }] : []),
                ...(habitacao?.pctDomUnipessoal != null ? [{ label: "Domicílios unipessoais", value: formatPct(habitacao.pctDomUnipessoal), description: "Percentual de domicílios com apenas 1 morador" }] : []),
                ...(habitacao?.pctDomTipoCasa != null ? [{ label: "Tipo casa", value: formatPct(habitacao.pctDomTipoCasa), description: "Percentual de domicílios do tipo casa" }] : []),
                ...(habitacao?.pctDomTipoApto != null ? [{ label: "Tipo apartamento", value: formatPct(habitacao.pctDomTipoApto), description: "Percentual de domicílios do tipo apartamento" }] : []),
                ...(habitacao?.pctDomDegradado != null ? [{ label: "Degradado/inacabado", value: formatPct(habitacao.pctDomDegradado), description: "Percentual de domicílios degradados ou inacabados" }] : []),
              ].filter((r) => r.value !== "—"),
            },
            {
              title: "Mortalidade",
              rows: [
                ...(mortalidade?.totalObitosDomicilios != null ? [{ label: "Óbitos registrados", value: formatNum(mortalidade.totalObitosDomicilios), description: "Total de óbitos em domicílios recenseados" }] : []),
                ...(mortalidade?.obitosInfantis0a4 != null ? [{ label: "Óbitos infantis (0–4 anos)", value: formatNum(mortalidade.obitosInfantis0a4), description: "Óbitos de crianças entre 0 e 4 anos" }] : []),
              ].filter((r) => r.value !== "—"),
            },
          ]
        : [
            {
              title: "Qualidade dos dados",
              rows: [
                {
                  label: "Disponibilidade",
                  value: isSectorFallback
                    ? "Setor censitário"
                    : isOfficialNeighborhood
                    ? "Bairro oficial"
                    : "Em integração",
                  description: isSectorFallback
                    ? "Dados agregados por setor censitário quando não há bairro oficial delimitado"
                    : "Dados oficiais de bairro quando a delimitação existe",
                },
              ],
            },
          ]),
    ].filter((s) => s.rows.length > 0),
  };
}
