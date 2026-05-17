// Tipos exclusivos do módulo Educação.
// NÃO redefinir Estado, Municipio, Bairro, Escola — esses vêm de @/core/types/territory.

import type {
  EscolaIndicadores,
  EscolaMatriculas,
} from "@/core/types/territory";

export type { EtapaIndicadores, EscolaIndicadores, EscolaMatriculas } from "@/core/types/territory";

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

export type EscolaEquipamentos = {
  computadorPortatilAluno?: boolean;
  desktopAluno?: boolean;
  impressora?: boolean;
  lousaDigital?: boolean;
  multimidia?: boolean;
  tabletAluno?: boolean;
};

export type EscolaInternet = {
  possuiInternet?: boolean;
  internetParaAlunos?: boolean;
  internetAdministrativa?: boolean;
};

export type EscolaSalas = {
  utilizadas?: number | null;
  climatizadas?: number | null;
  acessiveis?: number | null;
};

export type EscolaInfraestrutura = {
  possuiAcessibilidadePcd?: boolean;
  possuiAguaPotavel?: boolean;
  possuiBiblioteca?: boolean;
  possuiColetaLixo?: boolean;
  possuiCozinha?: boolean;
  possuiEnergiaPublica?: boolean;
  possuiEsgotoRedePublica?: boolean;
  possuiLaboratorioCiencias?: boolean;
  possuiLaboratorioInformatica?: boolean;
  possuiPatioCoberto?: boolean;
  possuiPatioDescoberto?: boolean;
  possuiPiscina?: boolean;
  possuiQuadraEsportes?: boolean;
  possuiRefeitorio?: boolean;
  equipamentos?: EscolaEquipamentos;
  internet?: EscolaInternet;
  salas?: EscolaSalas;
};

/**
 * Forma tipada dos dados de escola dentro de MapEntity.data.
 * Campos opcionais pois o GeoJSON pode trazer subset dos dados.
 */
export type EscolaEntityData = {
  id: string;
  nome: string;
  inepId?: string;
  bairroId?: string;
  bairroNome?: string;
  municipioId?: string;
  municipioNome?: string;
  estadoSigla?: string;
  geoProps?: Record<string, unknown>;
  dependencia_adm?: string;
  dependenciaAdministrativa?: string;
  tipo_localizacao?: string;
  tipoLocalizacao?: string;
  ideb?: number | null;
  inse?: number | null;
  indicadores?: EscolaIndicadores;
  infraestrutura?: EscolaInfraestrutura;
  matriculas?: EscolaMatriculas;
};
