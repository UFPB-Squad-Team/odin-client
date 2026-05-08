import type { Bairro, Escola, Estado, Municipio } from "@/core/types/territory";

export const MOCK_ESTADOS: Estado[] = [
  { id: "pb", nome: "Paraíba", sigla: "PB" },
  { id: "pe", nome: "Pernambuco", sigla: "PE" },
  { id: "ce", nome: "Ceará", sigla: "CE" },
];

export const MOCK_MUNICIPIOS: Municipio[] = [
  { id: "jp", nome: "João Pessoa", estadoId: "pb" },
  { id: "cg", nome: "Campina Grande", estadoId: "pb" },
  { id: "rec", nome: "Recife", estadoId: "pe" },
  { id: "for", nome: "Fortaleza", estadoId: "ce" },
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