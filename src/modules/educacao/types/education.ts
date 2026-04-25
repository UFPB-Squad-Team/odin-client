// Tipos exclusivos do módulo Educação.
// NÃO redefinir Estado, Municipio, Bairro, Escola — esses vêm de @/core/types/territory.

export type EducationIndicatorId =
  | "pct_com_internet"
  | "pct_com_biblioteca"
  | "pct_com_lab_informatica"
  | "pct_sem_acessibilidade"
  | "total_matriculas";

export interface EscolaAtlasMock {
  anoReferencia: number;
  dependenciaAdm: string;
  endereco: {
    bairro: string;
    logradouro: string;
    municipio: string;
    uf: string;
  };
  indicadores: {
    taxaAbandono?: number;
    taxaReprovacao?: number;
    docentesSuperior?: number;
    horasAulaDiarias?: number;
    tdi?: number;
    tnr?: number;
  };
  infraestrutura: {
    internetParaAlunos: boolean;
    possuiBiblioteca: boolean;
    possuiLaboratorioInformatica: boolean;
    possuiAcessibilidadePcd: boolean;
  };
  zonaLocalizacao: "Urbana" | "Rural";
}

// Tipo de resposta da API de educação para resumo de município/bairro
export interface EducationResumoMunicipio {
  total_escolas: number;
  total_matriculas: number;
  pct_com_internet: number;
  pct_com_biblioteca: number;
  pct_com_lab_informatica: number;
  pct_sem_acessibilidade: number;
}

export type EducationResumoBairro = EducationResumoMunicipio;
