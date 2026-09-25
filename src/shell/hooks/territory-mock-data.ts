/**
 * Barrel de compatibilidade: o mock territorial canônico vive em
 * `@/core/territory/territory-mock-data` (escopo Nordeste completo).
 * Mantido para não quebrar imports existentes do Shell.
 */
export {
  MOCK_BAIRROS,
  MOCK_ENDERECOS,
  MOCK_ESCOLAS,
  MOCK_ESTADOS,
  MOCK_MUNICIPIOS,
} from "@/core/territory/territory-mock-data";
