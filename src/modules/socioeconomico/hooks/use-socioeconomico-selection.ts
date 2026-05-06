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
      subtitle:
        "Dados socioeconômicos não disponíveis para escolas individuais",
      metrics: [],
    };
  }

  if (entity.kind === "municipio") {
    const props = entity.data.geoProps ?? {};
    const socio = props.socioeconomico as Record<string, unknown> | undefined;

    // Prefere dados da API (aninhados em socioeconomico.*), fallback para mock
    const hasApiData = socio != null;
    const mock = hasApiData
      ? null
      : getMockSocioeconomicoMunicipio(entity.data.id);

    const populacao = socio?.populacao as Record<string, unknown> | undefined;
    const saneamento = socio?.saneamento as Record<string, unknown> | undefined;
    const raca = socio?.raca as Record<string, unknown> | undefined;
    const estruturaEtaria = socio?.estruturaEtaria as
      | Record<string, unknown>
      | undefined;
    const educacaoPopulacao = socio?.educacaoPopulacao as
      | Record<string, unknown>
      | undefined;
    const familia = socio?.familia as Record<string, unknown> | undefined;
    const mortalidade = socio?.mortalidade as
      | Record<string, unknown>
      | undefined;
    const habitacao = socio?.habitacao as Record<string, unknown> | undefined;

    const totalPopulacao = populacao?.total ?? mock?.total_populacao;
    const totalDomicilios = populacao?.totalDomiciliosParticulares;
    const mediaHabitantes =
      populacao?.mediaMoradoresPorDomicilio ??
      mock?.media_moradores_por_domicilio;
    const pctAguaRede =
      saneamento?.pctAguaRedeGeral ?? mock?.pct_agua_rede_geral;
    const pctEsgotoRede =
      saneamento?.pctEsgotoRedeGeral ?? mock?.pct_esgoto_rede_geral;
    const pctLixoColetado =
      saneamento?.pctLixoColetado ?? mock?.pct_lixo_coletado;
    const pctPretaParda = raca?.pctPretaParda ?? mock?.pct_preta_parda;
    const pctCriancas =
      estruturaEtaria?.pctCriancas0a9 ?? mock?.pct_criancas_0_9;
    const pctIdosos =
      estruturaEtaria?.pctIdosos60Mais ?? mock?.pct_idosos_60_mais;
    const taxaAnalfabetismo =
      educacaoPopulacao?.taxaAnalfabetismo15Mais ??
      mock?.taxa_analfabetismo_15_mais;
    const pctResponsavelFeminino = familia?.pctResponsavelFeminino;
    const totalObitos = mortalidade?.totalObitosDomicilios;
    const obitosInfantis = mortalidade?.obitosInfantis0a4;
    const pctDomImprovisado = habitacao?.pctDomImprovisado;
    const pctDomSuperlotado = habitacao?.pctDomSuperlotado;

    const fonte =
      (socio?.fonte as string | undefined) ?? "IBGE Censo Demográfico 2022";
    const anoRef = (socio?.anoReferencia as number | undefined) ?? 2022;

    return {
      id: entity.data.id,
      nome: entity.data.nome,
      kind: "municipio",
      subtitle: `Contexto Socioeconômico — ${fonte} (${anoRef})`,
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
            {
              label: "Água rede geral",
              value: formatPct(pctAguaRede),
              description:
                "Domicílios com abastecimento de água por rede geral",
            },
            {
              label: "Esgoto rede geral",
              value: formatPct(pctEsgotoRede),
              description:
                "Domicílios com esgotamento sanitário por rede geral",
            },
            {
              label: "Lixo coletado",
              value: formatPct(pctLixoColetado),
              description: "Domicílios com coleta de lixo",
            },
          ],
        },
        {
          title: "Perfil demográfico",
          rows: [
            {
              label: "Pop. preta/parda",
              value: formatPct(pctPretaParda),
              description:
                "Percentual da população que se declara preta ou parda",
            },
            {
              label: "Crianças 0–9 anos",
              value: formatPct(pctCriancas),
              description: "Percentual da população entre 0 e 9 anos",
            },
            {
              label: "Idosos 60+ anos",
              value: formatPct(pctIdosos),
              description: "Percentual da população com 60 anos ou mais",
            },
            {
              label: "Média hab./domicílio",
              value: formatNum(mediaHabitantes),
              description: "Média de moradores por domicílio particular",
            },
            ...(totalDomicilios != null
              ? [
                  {
                    label: "Domicílios particulares",
                    value: formatNum(totalDomicilios),
                    description: "Total de domicílios particulares recenseados",
                  },
                ]
              : []),
            ...(pctResponsavelFeminino != null
              ? [
                  {
                    label: "Chefes de família femininas",
                    value: formatPct(pctResponsavelFeminino),
                    description:
                      "Percentual de domicílios com responsável do sexo feminino",
                  },
                ]
              : []),
          ],
        },
        {
          title: "Habitação",
          rows: [
            ...(pctDomImprovisado != null
              ? [
                  {
                    label: "Domicílios improvisados",
                    value: formatPct(pctDomImprovisado),
                    description:
                      "Percentual de domicílios em estruturas improvisadas",
                  },
                ]
              : []),
            ...(pctDomSuperlotado != null
              ? [
                  {
                    label: "Domicílios superlotados",
                    value: formatPct(pctDomSuperlotado),
                    description:
                      "Percentual de domicílios com mais de 3 moradores por dormitório",
                  },
                ]
              : []),
          ],
        },
        {
          title: "Mortalidade",
          rows: [
            ...(totalObitos != null
              ? [
                  {
                    label: "Óbitos registrados",
                    value: formatNum(totalObitos),
                    description: "Total de óbitos em domicílios recenseados",
                  },
                ]
              : []),
            ...(obitosInfantis != null
              ? [
                  {
                    label: "Óbitos infantis (0–4 anos)",
                    value: formatNum(obitosInfantis),
                    description: "Óbitos de crianças entre 0 e 4 anos",
                  },
                ]
              : []),
          ],
        },
      ].filter((s) => s.rows.length > 0),
    };
  }

  // bairro
  return {
    id: entity.data.id,
    nome: entity.data.nome,
    kind: "bairro",
    subtitle: "Contexto Socioeconômico — IBGE Censo 2022",
    metrics: [],
    sections: [
      {
        title: "Dados de bairro",
        rows: [
          { label: "Disponibilidade", value: "Em integração", description: "" },
        ],
      },
    ],
  };
}
