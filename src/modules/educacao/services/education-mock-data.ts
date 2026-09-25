/**
 * Mock territorial do módulo de Educação.
 *
 * Fonte canônica: `@/core/territory/territory-mock-data` — cobre os 9 estados
 * do Nordeste. Este barrel existe apenas para manter os imports históricos do
 * módulo e o tipo `MockAddress`.
 */
export {
  MOCK_BAIRROS,
  MOCK_ENDERECOS,
  MOCK_ESCOLAS,
  MOCK_ESTADOS,
  MOCK_MUNICIPIOS,
} from "@/core/territory/territory-mock-data";

export type MockAddress = {
  id: string;
  logradouro: string;
  bairroId: string;
  municipioId: string;
  estadoId: string;
};

