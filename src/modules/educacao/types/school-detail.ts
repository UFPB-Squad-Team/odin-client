export type SchoolDetail = {
  id: string;
  escola_id_inep?: string | number;
  municipio_id_ibge?: string;
  escola_nome: string;
  municipio_nome: string;
  estado_sigla: string;
  dependencia_adm: string;
  tipo_localizacao: string;
  localizacao?: { type: string; coordinates: [number, number] };
  endereco?: {
    bairro: string;
    logradouro: string;
    numero?: string;
    municipio: string;
    uf: string;
    cep?: string;
  };
  indicadores?: {
    anoReferencia: number;
    totalAlunos?: number;
    educacaoInfantil?: Record<string, number | null>;
    fundamentalAnosIniciais?: Record<string, number | null>;
    fundamentalAnosFinais?: Record<string, number | null>;
    ensinoMedio?: Record<string, number | null>;
  };
  infraestrutura?: {
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
    equipamentos?: Record<string, boolean>;
    internet?: {
      internetAdministrativa?: boolean;
      internetParaAlunos?: boolean;
      possuiInternet?: boolean;
    };
    salas?: {
      acessiveis?: number;
      climatizadas?: number;
      utilizadas?: number;
    };
  };
};