export type ObservatoryLayer = "municipio" | "bairro" | "escola";

export type EtapaIndicadores = {
  alunosPorTurma?: number | null;
  taxaAprovacao?: number | null;
  taxaReprovacao?: number | null;
  horasAulaDiarias?: number | null;
  tnr?: number | null;
};

export type EscolaIndicadores = {
  anoReferencia?: number | null;
  totalAlunos?: number | null;
  educacaoInfantil?: EtapaIndicadores;
  fundamentalAnosIniciais?: EtapaIndicadores;
  fundamentalAnosFinais?: EtapaIndicadores;
  ensinoMedio?: EtapaIndicadores;
};

export interface Estado {
  id: string;
  nome: string;
  sigla: string;
}

export interface Municipio {
  id: string;
  nome: string;
  estadoId: string;
  geoProps?: Record<string, unknown>;
}

export interface Bairro {
  id: string;
  nome: string;
  municipioId: string;
  geoProps?: Record<string, unknown>;
  source?: string;
  temBairroOficial?: boolean;
}

export type EscolaMatriculas = {
  totalAlunos?: number | null;
  educacaoInfantil?: number | null;
  educacaoInfantilCreche?: number | null;
  educacaoInfantilPreEscola?: number | null;
  fundamentalTotal?: number | null;
  fundamentalAnosIniciais?: number | null;
  fundamentalAnosFinais?: number | null;
  ensinoMedio?: number | null;
  eja?: number | null;
};

export interface Escola {
  id: string;
  inepId?: string;
  nome: string;
  bairroId: string;
  bairroNome?: string;
  municipioId?: string;
  municipioNome?: string;
  estadoSigla?: string;
  geoProps?: Record<string, unknown>;
  dependenciaAdministrativa?: string;
  dependencia_adm?: string;
  tipoLocalizacao?: string;
  tipo_localizacao?: string;
  ideb?: number;
  inse?: number;
  infraestrutura?: Record<string, unknown>;
  indicadores?: EscolaIndicadores;
  matriculas?: EscolaMatriculas;
}

export type TerritoryFilters = {
  activeLayer: string;
  estadoId: string | null;
  municipioId: string | null;
  bairroId: string | null;
};