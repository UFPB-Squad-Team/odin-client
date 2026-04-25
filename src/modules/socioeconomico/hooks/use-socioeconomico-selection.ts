import type { MapEntity, ObservatorySelection } from "@/core/types/shell";
import { getMockSocioeconomicoMunicipio } from "@/modules/socioeconomico/services/socioeconomico-mock-data";

function formatPct(value: number | undefined): string {
  if (value === undefined || value === null) return "Sem dados";
  return `${value.toFixed(1)}%`;
}

function formatNum(value: number | undefined): string {
  if (value === undefined || value === null) return "Sem dados";
  return value.toLocaleString("pt-BR");
}

export function buildSocioeconomicoSelection(entity: MapEntity): ObservatorySelection {
  if (entity.kind === "escola") {
    return {
      id: entity.data.id,
      nome: entity.data.nome,
      kind: "escola",
      subtitle: "Dados socioeconômicos não disponíveis para escolas individuais",
      metrics: [],
    };
  }

  const resumo = getMockSocioeconomicoMunicipio(entity.data.id);

  if (entity.kind === "municipio") {
    return {
      id: entity.data.id,
      nome: entity.data.nome,
      kind: "municipio",
      subtitle: "Contexto Socioeconômico — IBGE Censo 2022",
      metrics: [
        { label: "População total", value: formatNum(resumo?.total_populacao) },
        { label: "Renda per capita", value: resumo?.renda_per_capita_media ? `R$ ${resumo.renda_per_capita_media.toLocaleString("pt-BR")}` : "Sem dados" },
      ],
      sections: resumo
        ? [
            {
              title: "Saneamento e Infraestrutura",
              rows: [
                { label: "Água rede geral", value: formatPct(resumo.pct_agua_rede_geral) },
                { label: "Esgoto rede geral", value: formatPct(resumo.pct_esgoto_rede_geral) },
                { label: "Lixo coletado", value: formatPct(resumo.pct_lixo_coletado) },
              ],
            },
            {
              title: "Perfil Demográfico",
              rows: [
                { label: "Pop. preta/parda", value: formatPct(resumo.pct_preta_parda) },
                { label: "Crianças 0–9 anos", value: formatPct(resumo.pct_criancas_0_9) },
                { label: "Idosos 60+ anos", value: formatPct(resumo.pct_idosos_60_mais) },
                { label: "Analfabetismo 15+", value: formatPct(resumo.taxa_analfabetismo_15_mais) },
              ],
            },
          ]
        : undefined,
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
        rows: [{ label: "Disponibilidade", value: "Dados de bairro em integração" }],
      },
    ],
  };
}
