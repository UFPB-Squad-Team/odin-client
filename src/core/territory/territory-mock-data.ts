import type { Bairro, Escola, Estado, Municipio } from "@/core/types/territory";
import { NORDESTE_ESTADOS } from "@/core/territory/estados-nordeste";

/**
 * Fallback offline: mesma lista canônica usada pela sidebar em produção,
 * garantindo que os 9 estados do Nordeste sempre apareçam no seletor.
 */
export const MOCK_ESTADOS: Estado[] = NORDESTE_ESTADOS;

/**
 * Um município-âncora por estado apenas para manter o filtro em cascata
 * funcional quando a API está indisponível (modo mock/demo).
 */
export const MOCK_MUNICIPIOS: Municipio[] = [
  { id: "jp", nome: "João Pessoa", estadoId: "pb" },
  { id: "cg", nome: "Campina Grande", estadoId: "pb" },
  { id: "maceio", nome: "Maceió", estadoId: "al" },
  { id: "salvador", nome: "Salvador", estadoId: "ba" },
  { id: "for", nome: "Fortaleza", estadoId: "ce" },
  { id: "saoluis", nome: "São Luís", estadoId: "ma" },
  { id: "rec", nome: "Recife", estadoId: "pe" },
  { id: "teresina", nome: "Teresina", estadoId: "pi" },
  { id: "natal", nome: "Natal", estadoId: "rn" },
  { id: "aracaju", nome: "Aracaju", estadoId: "se" },
];

export const MOCK_BAIRROS: Bairro[] = [
  { id: "manaira", nome: "Manaíra", municipioId: "jp" },
  { id: "tamba", nome: "Tambaú", municipioId: "jp" },
  { id: "catole", nome: "Catolé", municipioId: "cg" },
  { id: "boa-viagem", nome: "Boa Viagem", municipioId: "rec" },
  { id: "meireles", nome: "Meireles", municipioId: "for" },
];

export const MOCK_ESCOLAS: Escola[] = [
  { id: "ecit-1", nome: "ECIT Litorânea", bairroId: "manaira", ideb: 5.6, inse: 5.2 },
  { id: "escola-2", nome: "EMEF Tambaú", bairroId: "tamba", ideb: 5.1, inse: 4.8 },
  { id: "escola-3", nome: "EMEF Catolé", bairroId: "catole", ideb: 4.9, inse: 4.6 },
  { id: "escola-4", nome: "Escola Boa Viagem", bairroId: "boa-viagem", ideb: 5.8, inse: 5.3 },
  { id: "escola-5", nome: "Escola Meireles", bairroId: "meireles", ideb: 5.7, inse: 5 },
];

export const MOCK_ENDERECOS = [
  { id: "addr-1", logradouro: "Avenida Flávio Ribeiro Coutinho", bairroId: "manaira", municipioId: "jp", estadoId: "pb" },
  { id: "addr-2", logradouro: "Avenida Epitácio Pessoa", bairroId: "tamba", municipioId: "jp", estadoId: "pb" },
  { id: "addr-3", logradouro: "Rua Vigário Calixto", bairroId: "catole", municipioId: "cg", estadoId: "pb" },
  { id: "addr-4", logradouro: "Avenida Boa Viagem", bairroId: "boa-viagem", municipioId: "rec", estadoId: "pe" },
  { id: "addr-5", logradouro: "Avenida Beira Mar", bairroId: "meireles", municipioId: "for", estadoId: "ce" },
];