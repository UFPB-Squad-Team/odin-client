// Lógica de construção do ObservatorySelection para entidades educacionais.
// Extraído de useObservatorioShell — o Shell não deve conter esta lógica.

import type { MapEntity, ObservatorySelection } from "@/core/types/shell";
import type { EscolaAtlasMock } from "@/modules/educacao/types/education";

export const ESCOLA_ATLAS_MOCKS: Record<string, EscolaAtlasMock> = {
  "ecit-1": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: { bairro: "Manaíra", logradouro: "Av. Flávio Ribeiro Coutinho", municipio: "João Pessoa", uf: "PB" },
    indicadores: { taxaAbandono: 1.2, taxaReprovacao: 5.3, docentesSuperior: 94, horasAulaDiarias: 5.4, tdi: 12, tnr: 1.1 },
    infraestrutura: { internetParaAlunos: true, possuiBiblioteca: true, possuiLaboratorioInformatica: true, possuiAcessibilidadePcd: true },
    zonaLocalizacao: "Urbana",
  },
  "escola-2": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: { bairro: "Tambaú", logradouro: "Av. Epitácio Pessoa", municipio: "João Pessoa", uf: "PB" },
    indicadores: { taxaAbandono: 2.1, taxaReprovacao: 8.7, docentesSuperior: 91, horasAulaDiarias: 5, tdi: 14, tnr: 1.3 },
    infraestrutura: { internetParaAlunos: false, possuiBiblioteca: false, possuiLaboratorioInformatica: true, possuiAcessibilidadePcd: true },
    zonaLocalizacao: "Urbana",
  },
  "escola-3": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: { bairro: "Catolé", logradouro: "Rua Vigário Calixto", municipio: "Campina Grande", uf: "PB" },
    indicadores: { taxaAbandono: 3.6, taxaReprovacao: 12.4, docentesSuperior: 88, horasAulaDiarias: 4.8, tdi: 18, tnr: 1.6 },
    infraestrutura: { internetParaAlunos: false, possuiBiblioteca: false, possuiLaboratorioInformatica: false, possuiAcessibilidadePcd: false },
    zonaLocalizacao: "Urbana",
  },
  "escola-4": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: { bairro: "Boa Viagem", logradouro: "Av. Boa Viagem", municipio: "Recife", uf: "PE" },
    indicadores: { taxaAbandono: 0.9, taxaReprovacao: 4.9, docentesSuperior: 96, horasAulaDiarias: 5.7, tdi: 10, tnr: 0.9 },
    infraestrutura: { internetParaAlunos: true, possuiBiblioteca: true, possuiLaboratorioInformatica: true, possuiAcessibilidadePcd: true },
    zonaLocalizacao: "Urbana",
  },
  "escola-5": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: { bairro: "Meireles", logradouro: "Av. Beira Mar", municipio: "Fortaleza", uf: "CE" },
    indicadores: { taxaAbandono: 1.1, taxaReprovacao: 5.7, docentesSuperior: 95, horasAulaDiarias: 5.6, tdi: 11, tnr: 1 },
    infraestrutura: { internetParaAlunos: true, possuiBiblioteca: true, possuiLaboratorioInformatica: true, possuiAcessibilidadePcd: true },
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
export function buildEducationSelection(entity: MapEntity): ObservatorySelection {
  if (entity.kind === "municipio") {
    // Para município, usamos os mocks disponíveis como proxy
    const municipioEscolaDetails = Object.values(ESCOLA_ATLAS_MOCKS);
    const internetCount = municipioEscolaDetails.filter(
      (e) => e.infraestrutura.internetParaAlunos,
    ).length;

    return {
      id: entity.data.id,
      nome: entity.data.nome,
      kind: "municipio",
      subtitle: "Visão agregada por município",
      metrics: [
        {
          label: "Escolas no recorte", value: String(municipioEscolaDetails.length),
          description: ""
        },
        {
          label: "% internet para alunos",
          value: municipioEscolaDetails.length
            ? `${((internetCount / municipioEscolaDetails.length) * 100).toFixed(1)}%`
            : "—",
          description: ""
        },
      ],
      sections: [
        {
          title: "Indicadores educacionais (mock)",
          rows: [
            {
              label: "Taxa média de abandono",
              value: `${average(municipioEscolaDetails.map((e) => e.indicadores.taxaAbandono ?? 0).filter((v) => v > 0)).toFixed(1)}%`,
              description: ""
            },
            {
              label: "Taxa média de reprovação",
              value: `${average(municipioEscolaDetails.map((e) => e.indicadores.taxaReprovacao ?? 0).filter((v) => v > 0)).toFixed(1)}%`,
              description: ""
            },
            {
              label: "Docentes com superior (média)",
              value: `${average(municipioEscolaDetails.map((e) => e.indicadores.docentesSuperior ?? 0).filter((v) => v > 0)).toFixed(1)}%`,
              description: ""
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
      metrics: [
        {
          label: "Escolas no bairro", value: String(bairroEscolaDetails.length),
          description: ""
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

  return {
    id: entity.data.id,
    nome: entity.data.nome,
    kind: "escola",
    subtitle: "Visão micro em unidade escolar",
    metrics: [
      { label: "IDEB", value: entity.data.ideb?.toFixed(1) ?? "—", description: "" },
      { label: "INSE", value: entity.data.inse?.toFixed(1) ?? "—", description: "" },
    ],
    sections: detail
      ? [
          {
            title: "Identificação",
            rows: [
              { label: "Dependência", value: detail.dependenciaAdm, description: "" },
              { label: "Ano referência", value: String(detail.anoReferencia), description: "" },
              { label: "Zona", value: detail.zonaLocalizacao, description: "" },
            ],
          },
          {
            title: "Endereço",
            rows: [
              { label: "Município", value: detail.endereco.municipio, description: "" },
              { label: "Bairro", value: detail.endereco.bairro, description: "" },
              { label: "Logradouro", value: detail.endereco.logradouro, description: "" },
              { label: "UF", value: detail.endereco.uf, description: "" },
            ],
          },
          {
            title: "Indicadores (mock)",
            rows: [
              { label: "Taxa abandono", value: `${detail.indicadores.taxaAbandono ?? "—"}%`, description: "" },
              { label: "Taxa reprovação", value: `${detail.indicadores.taxaReprovacao ?? "—"}%`, description: "" },
              { label: "Docentes superior", value: `${detail.indicadores.docentesSuperior ?? "—"}%`, description: "" },
              {
                label: "Horas aula diárias",
                value: detail.indicadores.horasAulaDiarias
                  ? `${detail.indicadores.horasAulaDiarias.toFixed(1)}h`
                  : "—",
                description: "",
              },
              { label: "TDI", value: String(detail.indicadores.tdi ?? "—"), description: "" },
              { label: "TNR", value: String(detail.indicadores.tnr ?? "—"), description: "" },
            ],
          },
          {
            title: "Infraestrutura",
            rows: [
              { label: "Internet para alunos", value: detail.infraestrutura.internetParaAlunos ? "Sim" : "Não", description: "" },
              { label: "Biblioteca", value: detail.infraestrutura.possuiBiblioteca ? "Sim" : "Não", description: "" },
              { label: "Lab. informática", value: detail.infraestrutura.possuiLaboratorioInformatica ? "Sim" : "Não", description: "" },
              { label: "Acessibilidade PCD", value: detail.infraestrutura.possuiAcessibilidadePcd ? "Sim" : "Não", description: "" },
            ],
          },
        ]
      : undefined,
  };
}
