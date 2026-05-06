# Contrato de API — ODIN Frontend ↔ Backend

**Versão:** MVP  
**Data:** Abril 2026  
**Contexto:** Documento de referência para o time de backend sobre o que o frontend precisa de cada endpoint — novos, ajustes nos existentes e o que pode ser usado sem mudança.

---

## Índice

1. [Endpoints existentes — usar sem mudança](#1-endpoints-existentes--usar-sem-mudança)
2. [Endpoints existentes — precisam de ajuste](#2-endpoints-existentes--precisam-de-ajuste)
3. [Endpoints novos — precisam ser criados](#3-endpoints-novos--precisam-ser-criados)
4. [Endpoints legados — não usar](#4-endpoints-legados--não-usar)
5. [Observações gerais de contrato](#5-observações-gerais-de-contrato)

---

## 1. Endpoints existentes — usar sem mudança

### 1.1 `GET /api/v1/aggregations/cities`

**Status:** ✅ Pronto para uso  
**Usado para:** Camada de municípios no mapa + simbologia dinâmica por indicador + painel de detalhes de município

**Como o frontend usa:**

- Chamado na inicialização do Observatório com `sg_uf=PB`
- O GeoJSON retornado é passado diretamente para o MapLibre como source da camada `municipio`
- As `properties` de cada feature alimentam a simbologia dinâmica (escala de cores por indicador)
- Quando o usuário clica em um município no mapa, o frontend usa as `properties` para montar o painel de detalhes sem chamada adicional

**Parâmetros usados pelo frontend:**

```
GET /api/v1/aggregations/cities?sg_uf=PB
```

**O que o frontend espera nas `properties` de cada feature:**

```json
{
  "municipioIdIbge": "2507507",
  "co_municipio": "2507507",
  "municipio": "João Pessoa",
  "uf": "PB",
  "total_escolas": 412,
  "total_alunos": 98000,
  "avg_ideb": 4.8,
  "pct_com_biblioteca": 62.3,
  "pct_com_internet": 88.1,
  "pct_com_lab_informatica": 45.2,
  "pct_sem_acessibilidade": 31.0,
  "source": "municipio_indicadores"
}
```

**Observação importante:** O campo `source` é valioso — o frontend vai exibir uma nota de qualidade diferente quando `source === "setor_indicadores"` (fallback), indicando ao usuário que os dados são estimados por setor censitário.

---

### 1.2 `GET /api/v1/schools/{school_id}`

**Status:** ✅ Pronto para uso  
**Usado para:** Painel de detalhes completo de uma escola individual

**Como o frontend usa:**

- Chamado quando o usuário clica em uma escola no mapa ou na lista
- O `school_id` pode ser o `_id` do Mongo ou o `escolaIdInep` (INEP) — o frontend vai usar o `id` que vier no GeoJSON de escolas

**O que o frontend usa da resposta:**

```json
{
  "id": "...",
  "escola_nome": "EMEIF MAE IAIA",
  "municipio_nome": "Água Branca",
  "estado_sigla": "PB",
  "dependencia_adm": "Municipal",
  "tipo_localizacao": "Urbana",
  "localizacao": {
    "type": "Point",
    "coordinates": [-37.641, -7.514]
  },
  "endereco": {
    "bairro": "GUALTERINA ALENCAR VIDAL",
    "logradouro": "RUA SARGENTO FLORENTINO LEITE",
    "numero": "24",
    "municipio": "Água Branca",
    "uf": "PB",
    "cep": "58748000"
  },
  "indicadores": {
    "anoReferencia": 2024,
    "totalAlunos": 320,
    "educacaoInfantil": {
      "docentesSuperior": 100
    },
    "fundamentalAnosIniciais": {
      "taxaAprovacao": 100,
      "taxaAbandono": 0,
      "alunosPorTurma": null,
      "docentesSuperior": 100,
      "tdi": 28,
      "tnr": 1.5
    },
    "fundamentalAnosFinais": {
      "taxaAbandono": 11.8,
      "alunosPorTurma": 100,
      "docentesSuperior": 100,
      "horasAulaDiarias": 100,
      "tdi": 27
    },
    "ensinoMedio": {
      "taxaReprovacao": 29.4,
      "docentesSuperior": 100
    }
  },
  "infraestrutura": {
    "possuiAcessibilidadePcd": true,
    "possuiAguaPotavel": true,
    "possuiBiblioteca": false,
    "possuiColetaLixo": true,
    "possuiCozinha": true,
    "possuiEnergiaPublica": true,
    "possuiEsgotoRedePublica": true,
    "possuiLaboratorioCiencias": false,
    "possuiLaboratorioInformatica": true,
    "possuiPatioCoberto": true,
    "possuiPatioDescoberto": false,
    "possuiPiscina": false,
    "possuiQuadraEsportes": false,
    "possuiRefeitorio": true,
    "equipamentos": {
      "computadorPortatilAluno": true,
      "desktopAluno": true,
      "impressora": true,
      "lousaDigital": false,
      "multimidia": true,
      "tabletAluno": true
    },
    "internet": {
      "internetAdministrativa": true,
      "internetParaAlunos": false,
      "possuiInternet": true
    },
    "salas": {
      "acessiveis": 0,
      "climatizadas": 14,
      "utilizadas": 14
    }
  }
}
```

**Atenção:** O documento da API mostra o path como `GET /api/v1/{school_id}` (sem prefixo `schools/`). Confirmar se o path correto é `/api/v1/schools/{school_id}` ou `/api/v1/{school_id}`.

---

## 2. Endpoints existentes — precisam de ajuste

### 2.1 `GET /api/v1/aggregations/neighborhoods`

**Status:** ⚠️ Funcional, mas precisa de ajuste  
**Usado para:** Camada de bairros no mapa + painel de detalhes de bairro + fallback para setor censitário

**Como o frontend usa:**

- Chamado quando o usuário seleciona um município e a camada ativa é `bairro`
- Passado como source GeoJSON para o MapLibre
- As `properties` alimentam a simbologia dinâmica e o painel de detalhes

**Chamada atual:**

```
GET /api/v1/aggregations/neighborhoods?municipio_id=2507507&include_geometria=true
```

**Ajuste 1 — Normalizar o campo `tem_bairro_oficial`**

O schema da collection tem `tem_bairro_official` (typo em inglês). O frontend vai usar `tem_bairro_oficial` (português, sem typo). Solicitar que o endpoint normalize esse campo na resposta:

```json
// atual (typo)
"tem_bairro_official": true

// esperado pelo frontend
"tem_bairro_oficial": true
```

**Ajuste 2 — Retornar como GeoJSON FeatureCollection quando `include_geometria=true`**

Atualmente o endpoint retorna um array plano `[{...}, {...}]`. Quando `include_geometria=true`, o frontend precisa de um GeoJSON FeatureCollection para passar diretamente ao MapLibre:

```json
// atual
[
  {
    "_id": "...",
    "bairro": "Manaíra",
    "geometria": { "type": "MultiPolygon", "coordinates": [...] },
    "pct_com_internet": 100,
    ...
  }
]

// esperado pelo frontend quando include_geometria=true
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "2504009049",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [...]
      },
      "properties": {
        "id": "2504009049",
        "bairro": "Manaíra",
        "municipio": "João Pessoa",
        "municipioIdIbge": "2507507",
        "cd_bairro_ibge": "2504009049",
        "total_escolas": 2,
        "total_matriculas": 1651,
        "pct_com_biblioteca": 50,
        "pct_com_internet": 100,
        "pct_com_lab_informatica": 0,
        "pct_sem_acessibilidade": 0,
        "tem_bairro_oficial": true,
        "source": "bairros_indicadores"
      }
    }
  ]
}
```

Quando `include_geometria=false` (padrão), pode continuar retornando o array plano — o frontend usa esse formato para popular listas e filtros.

**Ajuste 3 — Incluir setor censitário no fallback com campo `nivel`**

Quando o fallback é `setor_indicadores`, o frontend precisa saber que está exibindo setores, não bairros, para mostrar a nota de qualidade correta. Adicionar campo `nivel` nas properties:

```json
"properties": {
  "nivel": "bairro",      // quando vem de bairros_indicadores
  // ou
  "nivel": "setor",       // quando vem de setor_indicadores (fallback)
  "cd_setor": "250010605000002",  // apenas quando nivel === "setor"
  ...
}
```

---

### 2.2 `GET /api/v1/escolas/geojson/paraiba`

**Status:** ⚠️ Funcional, mas precisa de parâmetro de filtro  
**Usado para:** Camada de escolas no mapa

**Problema atual:** Retorna todas as 3.728 escolas da PB de uma vez, sem filtro por município. Isso é pesado para o browser e desnecessário — o usuário só vê escolas de um município por vez.

**Ajuste necessário — Adicionar parâmetro `municipio_id`:**

```
GET /api/v1/escolas/geojson/paraiba?municipio_id=2507507
```

Quando `municipio_id` for informado, retornar apenas as escolas daquele município. Quando omitido, manter o comportamento atual (todas as escolas da PB).

**O que o frontend espera nas `properties` de cada feature:**

```json
{
  "id": "25033158",
  "escola_nome": "EMEIF MAE IAIA",
  "escola_id_inep": 25033158,
  "municipio_nome": "Água Branca",
  "municipioIdIbge": "2500106",
  "bairro": "GUALTERINA ALENCAR VIDAL",
  "dependencia_adm": "Municipal",
  "tipo_localizacao": "Urbana",
  "ideb": 4.2
}
```

**Ajuste adicional — Usar `escola_id_inep` como `id` da feature:**

O `id` da feature GeoJSON deve ser o `escolaIdInep` (string), não o `_id` do Mongo. O frontend usa esse `id` para chamar `GET /api/v1/schools/{school_id}` ao clicar na escola.

---

### 2.3 `GET /api/v1/schools`

**Status:** ⚠️ Funcional para listagem geral, mas sem filtro por município  
**Usado para:** Catálogo de busca fuzzy de escolas (autocomplete na sidebar)

**Ajuste necessário — Adicionar parâmetro `municipio_id`:**

```
GET /api/v1/schools?municipio_id=2507507&page=1&page_size=100
```

Quando `municipio_id` for informado, retornar apenas escolas daquele município. O frontend usa isso para popular o catálogo de busca quando o usuário seleciona um município.

**Campos mínimos necessários para o catálogo de busca:**

```json
{
  "schools": [
    {
      "id": "25033158",
      "escola_nome": "EMEIF MAE IAIA",
      "municipio_nome": "Água Branca",
      "municipioIdIbge": "2500106",
      "dependencia_adm": "Municipal",
      "tipo_localizacao": "Urbana",
      "localizacao": {
        "type": "Point",
        "coordinates": [-37.641, -7.514]
      }
    }
  ],
  "total_items": 412,
  "page": 1,
  "page_size": 100
}
```

---

## 3. Endpoints novos — precisam ser criados

### 3.1 `GET /api/v1/municipios` — Catálogo de municípios

**Prioridade:** 🔴 Alta — bloqueia o filtro em cascata com dados reais

**Usado para:** Popular o seletor de município na sidebar (filtro em cascata Estado → Município → Bairro)

**Por que não existe ainda:** O endpoint `aggregations/cities` retorna GeoJSON completo com geometrias — pesado demais para popular um dropdown. O frontend precisa de uma lista leve só com `id` e `nome`.

**Contrato:**

```
GET /api/v1/municipios?sg_uf=PB
```

**Parâmetros:**
| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| sg_uf | string | Não | Filtro por UF (ex: `PB`). Se omitido, retorna todos os estados disponíveis. |

**Response esperada:**

```json
[
  {
    "id": "2507507",
    "nome": "João Pessoa",
    "sg_uf": "PB"
  },
  {
    "id": "2504009",
    "nome": "Campina Grande",
    "sg_uf": "PB"
  }
]
```

**Lógica de negócio:**

- Fonte: collection `municipio_indicadores`
- Ordenar por `nome` alfabeticamente
- Retornar todos os municípios da UF informada (sem paginação — são no máximo 223 para PB)
- O campo `id` deve ser o `municipioIdIbge` como string (7 dígitos)

**Como o frontend usa:**

1. Na inicialização do Observatório, chama `GET /api/v1/municipios?sg_uf=PB`
2. Popula o dropdown de município na sidebar
3. Quando o usuário seleciona um município, usa o `id` retornado para chamar os outros endpoints

---

### 3.2 `GET /api/v1/municipios/{municipio_id}/resumo` — Resumo de município

**Prioridade:** 🟡 Média — melhora o painel de detalhes de município

**Usado para:** Painel de detalhes de município com dados mais ricos do que os disponíveis no GeoJSON de `aggregations/cities`

**Contexto:** O `aggregations/cities` já retorna os indicadores principais nas `properties` do GeoJSON. Este endpoint é necessário quando o usuário abre o painel de detalhes e o frontend precisa de dados adicionais não presentes no GeoJSON (ex: ranking de bairros, total de matrículas por etapa, flags de qualidade).

**Contrato:**

```
GET /api/v1/municipios/{municipio_id}/resumo
```

**Parâmetros:**
| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| municipio_id | string | Sim | Código IBGE do município (7 dígitos) |

**Response esperada:**

```json
{
  "municipioIdIbge": "2507507",
  "municipio": "João Pessoa",
  "sg_uf": "PB",
  "total_escolas": 412,
  "total_matriculas": 98000,
  "total_bairros": 64,
  "pct_com_biblioteca": 62.3,
  "pct_com_internet": 88.1,
  "pct_com_lab_informatica": 45.2,
  "pct_sem_acessibilidade": 31.0,
  "avg_ideb": 4.8,
  "tem_bairros_oficiais": true,
  "source": "municipio_indicadores"
}
```

**Lógica de negócio:**

- Fonte primária: `municipio_indicadores` (busca por `municipioIdIbge`)
- Fallback: `setor_indicadores` (agrega setores do município)
- O campo `source` indica qual collection foi usada
- O campo `tem_bairros_oficiais` indica se o município tem bairros mapeados no IBGE (para o frontend decidir se exibe a camada de bairros ou setor censitário)
- Retornar HTTP 404 se o município não existir

---

### 3.3 `GET /api/v1/bairros/{bairro_id}/resumo` — Resumo de bairro

**Prioridade:** 🟡 Média — painel de detalhes de bairro

**Usado para:** Painel de detalhes quando o usuário clica em um bairro no mapa

**Contrato:**

```
GET /api/v1/bairros/{bairro_id}/resumo
```

**Parâmetros:**
| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| bairro_id | string | Sim | `cd_bairro_ibge` do bairro (ex: `2504009049`) |

**Response esperada:**

```json
{
  "id": "2504009049",
  "bairro": "Acácio Figueiredo",
  "municipio": "Campina Grande",
  "municipioIdIbge": "2504009",
  "sg_uf": "PB",
  "total_escolas": 2,
  "total_matriculas": 1651,
  "pct_com_biblioteca": 50,
  "pct_com_internet": 100,
  "pct_com_lab_informatica": 0,
  "pct_sem_acessibilidade": 0,
  "tem_bairro_oficial": true,
  "source": "bairros_indicadores"
}
```

**Lógica de negócio:**

- Fonte primária: `bairros_indicadores` (busca por `cd_bairro_ibge`)
- Fallback: `setor_indicadores` (busca por `cd_setor`)
- Quando o fallback é usado, o campo `source` deve ser `"setor_indicadores"` e o campo `tem_bairro_oficial` deve ser `false`
- Retornar HTTP 404 se não encontrado em nenhuma collection

---

### 3.4 `GET /api/v1/busca/sugestoes` — Autocomplete de busca

**Prioridade:** 🟡 Média — melhora a busca inteligente (hoje funciona com mock local via fuse.js)

**Usado para:** Autocomplete na barra de busca inteligente da sidebar

**Contrato:**

```
GET /api/v1/busca/sugestoes?q=joao&sg_uf=PB&municipio_id=2507507
```

**Parâmetros:**
| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| q | string | Sim | Texto de busca (mínimo 2 caracteres) |
| sg_uf | string | Não | Filtrar por UF |
| municipio_id | string | Não | Restringir busca de escolas/bairros a um município |

**Response esperada:**

```json
[
  {
    "id": "2507507",
    "kind": "municipio",
    "label": "João Pessoa",
    "subtitle": "Município · PB",
    "municipioIdIbge": "2507507"
  },
  {
    "id": "2504009049",
    "kind": "bairro",
    "label": "Acácio Figueiredo",
    "subtitle": "Bairro · Campina Grande",
    "municipioIdIbge": "2504009",
    "cd_bairro_ibge": "2504009049"
  },
  {
    "id": "25033158",
    "kind": "escola",
    "label": "EMEIF MAE IAIA",
    "subtitle": "Escola · Água Branca",
    "municipioIdIbge": "2500106",
    "escola_id_inep": "25033158"
  }
]
```

**Lógica de negócio:**

- Busca case-insensitive e tolerante a acentuação nos campos `nome`/`municipio`/`bairro`/`escola_nome`
- Prioridade: correspondências exatas > correspondências parciais
- Retornar no máximo 8 resultados no total (mistura de municípios, bairros e escolas)
- Se `municipio_id` for informado, restringir bairros e escolas ao município
- Retornar HTTP 400 se `q` tiver menos de 2 caracteres

---

### 3.5 `GET /api/v1/estados` — Lista de estados disponíveis

**Prioridade:** 🟢 Baixa — o frontend tem mock funcional, mas precisa para dados reais

**Usado para:** Popular o seletor de estado na sidebar (primeiro nível do filtro em cascata)

**Contrato:**

```
GET /api/v1/estados
```

**Response esperada:**

```json
[
  {
    "id": "PB",
    "nome": "Paraíba",
    "sigla": "PB"
  }
]
```

**Lógica de negócio:**

- Retornar apenas os estados que têm dados na collection `municipio_indicadores`
- Para o MVP, será apenas `PB`
- O campo `id` deve ser a sigla (string de 2 caracteres) — é o que o frontend usa para filtrar municípios

---

## 4. Endpoints legados — não usar

| Endpoint                                  | Motivo                                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/bairro/{school_id}`          | Retorna apenas nome do bairro. Substituído por `aggregations/neighborhoods`.                                              |
| `GET /api/v1/bairros/geojson/{municipio}` | Parâmetro por nome (frágil). `avg_ideb` sempre null. Substituído por `aggregations/neighborhoods?include_geometria=true`. |

---

## 5. Observações gerais de contrato

### Normalização de IDs

O frontend trabalha com `municipioIdIbge` como **string de 7 dígitos** em todos os lugares. A collection `municipio_indicadores` armazena como número inteiro (`2500205`). Todos os endpoints devem retornar `municipioIdIbge` como string: `"2500205"`.

### Nomenclatura de campos

O frontend espera campos em **snake_case** nos endpoints REST, consistente com o que já existe. Os dados brutos das collections usam camelCase internamente — o backend deve normalizar na camada de API.

Mapeamento dos campos da collection de escola para o contrato da API:

| Collection (camelCase) | API (snake_case)    |
| ---------------------- | ------------------- |
| `escolaNome`           | `escola_nome`       |
| `escolaIdInep`         | `escola_id_inep`    |
| `municipioIdIbge`      | `municipio_id_ibge` |
| `dependenciaAdm`       | `dependencia_adm`   |
| `tipoLocalizacao`      | `tipo_localizacao`  |
| `estadoSigla`          | `estado_sigla`      |

### Campo `source` nas agregações

Todos os endpoints de agregação (municípios, bairros, setores) devem incluir o campo `source` indicando a collection de origem:

- `"municipio_indicadores"` — dados agregados por município
- `"bairros_indicadores"` — dados de bairro oficial IBGE
- `"setor_indicadores"` — fallback por setor censitário

O frontend usa esse campo para exibir notas de qualidade de dados ao usuário.

### Campo `tem_bairro_oficial`

Presente na collection `setor_indicadores` como `tem_bairro_oficial`. Deve ser exposto em todos os endpoints que retornam dados de bairro/setor. O frontend usa para:

- Decidir se exibe a camada de bairros ou setores censitários
- Exibir nota informativa no painel de detalhes ("Dados de bairro disponíveis apenas para 12 municípios")

### Tratamento de campos nulos nos indicadores de escola

Os indicadores por etapa de ensino (`educacaoInfantil`, `fundamentalAnosIniciais`, etc.) podem ter campos ausentes quando a escola não oferece aquela etapa. O frontend trata `null` e campo ausente da mesma forma — exibe "Não disponível". O backend não precisa preencher com zero.

### Performance

- `GET /api/v1/aggregations/cities?sg_uf=PB` — chamado uma vez na inicialização. Pode ser pesado, mas é aceitável com cache HTTP (`Cache-Control: max-age=3600`).
- `GET /api/v1/escolas/geojson/paraiba?municipio_id={id}` — chamado a cada troca de município. Deve responder em < 500ms para municípios com até 500 escolas.
- `GET /api/v1/aggregations/neighborhoods?municipio_id={id}&include_geometria=true` — chamado a cada troca de município. Deve responder em < 500ms.
- `GET /api/v1/busca/sugestoes` — chamado a cada keystroke (com debounce de 300ms no frontend). Deve responder em < 200ms.

---

## 6. Análise dos Requisitos do Sistema — Mapeamento Frontend / Backend

> Esta seção cruza cada requisito do `requirements.md` com o que já existe, o que precisa de ajuste e o que é novo. Endpoints adicionais identificados aqui foram incorporados nas seções anteriores em ordem de prioridade.

---

### Req 1 — Catálogo Territorial (Estados, Municípios, Bairros, Escolas)

**Escopo:** Backend + Frontend  
**Status:** ⚠️ Parcialmente coberto

| Necessidade                             | Situação                                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/estados`                   | ❌ Não existe — ver seção 3.5                                                                                          |
| `GET /api/v1/municipios?estado_id=PB`   | ❌ Não existe — ver seção 3.1                                                                                          |
| `GET /api/v1/bairros?municipio_id={id}` | ⚠️ Coberto por `aggregations/neighborhoods` mas retorna array plano, não lista de catálogo leve — ver ajuste seção 2.1 |
| `GET /api/v1/escolas?municipio_id={id}` | ⚠️ `GET /api/v1/schools` existe mas sem filtro por município — ver ajuste seção 2.3                                    |

**Frontend:** Já tem a lógica de filtro em cascata implementada com mock. Basta conectar aos endpoints reais quando disponíveis.

---

### Req 2 — Resumo por Entidade (Município, Bairro, Escola)

**Escopo:** Backend + Frontend  
**Status:** ⚠️ Parcialmente coberto

| Necessidade                          | Situação                                      |
| ------------------------------------ | --------------------------------------------- |
| `GET /api/v1/municipios/{id}/resumo` | ❌ Não existe — ver seção 3.2                 |
| `GET /api/v1/bairros/{id}/resumo`    | ❌ Não existe — ver seção 3.3                 |
| `GET /api/v1/schools/{id}`           | ✅ Existe e cobre o perfil completo de escola |

**Frontend:** Painel de detalhes já renderiza dados estruturados. Precisa conectar aos endpoints de resumo quando criados.

---

### Req 3 — Endpoints Geoespaciais (GeoJSON por camada)

**Escopo:** Backend + Frontend  
**Status:** ⚠️ Parcialmente coberto

| Necessidade                                 | Situação                                                                                                                         |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/geo/escolas?municipio_id={id}` | ⚠️ Existe como `/escolas/geojson/paraiba` mas sem filtro por município — ver ajuste seção 2.2                                    |
| `GET /api/v1/geo/municipios`                | ✅ Coberto por `aggregations/cities?sg_uf=PB`                                                                                    |
| `GET /api/v1/geo/bairros?municipio_id={id}` | ⚠️ Coberto por `aggregations/neighborhoods?include_geometria=true` mas precisa retornar FeatureCollection — ver ajuste seção 2.1 |
| Suporte a `bbox` para filtro geográfico     | ❌ Não existe — baixa prioridade para MVP                                                                                        |

**Frontend:** `useMapLayers` já consome GeoJSON e passa para MapLibre. Precisa atualizar as URLs dos endpoints.

---

### Req 4 — Integração Frontend com API Real

**Escopo:** Frontend  
**Status:** ⚠️ Estrutura pronta, falta conectar

O frontend já tem a lógica de fallback para mock quando a API não está disponível (`withFallback`). Basta atualizar os services em `src/modules/educacao/services/education-api.ts` para apontar para os endpoints reais quando criados.

**Nenhum endpoint novo necessário aqui** — depende dos Req 1, 2 e 3.

---

### Req 5 — Mapa Interativo com MapLibre

**Escopo:** Frontend  
**Status:** ✅ Implementado

O mapa MapLibre está funcionando com camadas de município, bairro e escola, simbologia dinâmica, hover, seleção e auto-pan. Precisa apenas conectar às fontes de dados reais (Req 3).

---

### Req 6 — Simbologia Dinâmica no Mapa

**Escopo:** Frontend  
**Status:** ⚠️ Estrutura existe, falta legenda e integração com dados reais

O `ModuleContract.getMapLayerStyle` já existe e o módulo Educação já implementa interpolação de cores por indicador. Falta:

- Componente de legenda no mapa (mín/máx do indicador visível)
- Conectar com dados reais para calcular os valores mín/máx do conjunto visível

**Nenhum endpoint novo necessário** — os dados já vêm nas `properties` do GeoJSON.

---

### Req 7 — Painel de Detalhes — Escola

**Escopo:** Frontend + Backend  
**Status:** ⚠️ Frontend tem estrutura, falta dados reais

O `EducationDetailPanel` existe mas usa mocks. Precisa conectar ao `GET /api/v1/schools/{id}` (já existe).

**Mapeamento de campos da collection para o painel:**

| Campo no painel                 | Campo na API                                        |
| ------------------------------- | --------------------------------------------------- |
| Nome                            | `escola_nome`                                       |
| Município                       | `municipio_nome`                                    |
| Dependência                     | `dependencia_adm`                                   |
| Localização                     | `tipo_localizacao`                                  |
| Endereço                        | `endereco.*`                                        |
| Internet para alunos            | `infraestrutura.internet.internetParaAlunos`        |
| Biblioteca                      | `infraestrutura.possuiBiblioteca`                   |
| Lab. informática                | `infraestrutura.possuiLaboratorioInformatica`       |
| Acessibilidade PCD              | `infraestrutura.possuiAcessibilidadePcd`            |
| Quadra esportes                 | `infraestrutura.possuiQuadraEsportes`               |
| Lab. ciências                   | `infraestrutura.possuiLaboratorioCiencias`          |
| Taxa aprovação (Fund. Iniciais) | `indicadores.fundamentalAnosIniciais.taxaAprovacao` |
| Taxa reprovação (Ens. Médio)    | `indicadores.ensinoMedio.taxaReprovacao`            |
| Ano referência                  | `indicadores.anoReferencia`                         |

---

### Req 8 — Painel de Detalhes — Município

**Escopo:** Frontend + Backend  
**Status:** ⚠️ Frontend tem estrutura, falta endpoint de resumo

Precisa do `GET /api/v1/municipios/{id}/resumo` (seção 3.2). Os dados básicos (`total_escolas`, indicadores percentuais) já vêm do GeoJSON de `aggregations/cities` e podem ser usados enquanto o endpoint de resumo não existe.

---

### Req 9 — Painel de Detalhes — Bairro

**Escopo:** Frontend + Backend  
**Status:** ⚠️ Frontend tem estrutura, falta endpoint de resumo e lógica de fallback setor

Precisa do `GET /api/v1/bairros/{id}/resumo` (seção 3.3). O campo `tem_bairro_oficial` do endpoint de bairros deve guiar o frontend para exibir nota de qualidade correta.

---

### Req 10 e 11 — Busca com Dados Reais

**Escopo:** Frontend + Backend  
**Status:** ⚠️ Frontend tem busca fuzzy local, falta endpoint de busca

Busca fuzzy com `fuse.js` já funciona com mock. Endpoint `GET /api/v1/busca/sugestoes` documentado na seção 3.4.

---

### Req 12 — UX da Sidebar

**Escopo:** Frontend  
**Status:** ✅ Implementado

Sidebar com 320px expandida, colapso para ícones, persistência em `localStorage`, atalho `Ctrl+B`. Tudo implementado.

---

### Req 13 — Indicadores de Qualidade de Dados

**Escopo:** Frontend + Backend  
**Status:** ⚠️ Parcialmente — falta campo `source` e `tem_bairro_oficial` nos endpoints

O frontend precisa receber `source` ("municipio_indicadores" vs "setor_indicadores") e `tem_bairro_oficial` nos endpoints de bairro/setor para exibir as notas corretas. Documentado nos ajustes da seção 2.1.

---

### Req 14 — Tooltips de Indicadores

**Escopo:** Frontend  
**Status:** ❌ Não implementado ainda

100% frontend. As definições dos indicadores já estão nos `ModuleIndicator.description` de cada módulo. Falta criar o componente `IndicatorTooltip` e integrá-lo no `EducationSidebarPanel` e no `EducationDetailPanel`.

---

### Req 15 — Ranking de Municípios por Indicador

**Escopo:** Frontend  
**Status:** ❌ Não implementado ainda

100% frontend. Os dados para o ranking já vêm nas `properties` do GeoJSON de `aggregations/cities`. O frontend pode calcular o ranking localmente sem endpoint adicional — basta ordenar as features pelo valor do indicador ativo.

---

### Req 16 — Seção "Feito por Quem" na Landing Page

**Escopo:** Frontend  
**Status:** ❌ Não implementado ainda

100% frontend. Conteúdo estático — nomes, descrições e links da equipe LEMA/UFPB. Nenhum endpoint necessário.

---

### Req 17 — Compartilhamento de Estado via Link

**Escopo:** Frontend  
**Status:** ⚠️ Parcialmente — URL sync existe, falta botão "Compartilhar" e parâmetros de mapa

A sincronização de filtros com URL já existe (`estado`, `municipio`, `bairro`, `layer`). Falta:

- Adicionar `zoom`, `lat`, `lng` e `indicador` aos parâmetros da URL
- Botão "Compartilhar" que copia a URL para o clipboard com feedback visual

**Nenhum endpoint necessário.**

---

### Req 18 — Indicadores Socioeconômicos no Mapa

**Escopo:** Frontend + Backend  
**Status:** ❌ Não implementado — aguarda dados socioeconômicos

O módulo `socioeconomico` já existe no frontend com os indicadores definidos. Falta:

- Os dados socioeconômicos nas `properties` do GeoJSON de municípios e bairros
- Endpoint novo documentado abaixo (seção 7.1)

---

### Req 19 — Tutorial Interativo de Boas-Vindas

**Escopo:** Frontend  
**Status:** ❌ Não implementado ainda

100% frontend. Nenhum endpoint necessário. Implementação com biblioteca de tour (ex.: `driver.js` ou implementação própria com overlay + spotlight).

---

### Req 20 — Ranking com Filtro por Porte Municipal

**Escopo:** Frontend + Backend  
**Status:** ❌ Não implementado

O ranking (Req 15) precisa existir primeiro. O filtro por porte depende do campo `total_populacao` nas `properties` do GeoJSON de municípios. Esse campo já existe na collection `municipio_indicadores` — precisa ser incluído no `aggregations/cities`. Documentado abaixo (seção 7.2).

---

### Req 21 — Contexto Socioeconômico no Painel de Município

**Escopo:** Frontend + Backend  
**Status:** ❌ Não implementado — aguarda dados socioeconômicos

Depende do bloco `socioeconomico` no `GET /api/v1/municipios/{id}/resumo`. Documentado na seção 3.2 (campo `socioeconomico` no response).

---

### Req 22 — Flags de Qualidade de Dados

**Escopo:** ETL + Backend + Frontend  
**Status:** ❌ Não implementado

Requer trabalho no ETL para calcular e persistir `flags_qualidade`. O campo deve aparecer no `GET /api/v1/municipios/{id}/resumo`. Documentado na seção 3.2.

---

### Req 23 — Exportação de Dados

**Escopo:** Frontend + Backend  
**Status:** ❌ Não implementado

Requer endpoints novos de exportação. Documentado abaixo (seção 7.3).

---

### Req 24 — Resumo Estadual com Agregação Ponderada

**Escopo:** Backend + Frontend  
**Status:** ❌ Não implementado

Requer endpoint novo. Documentado abaixo (seção 7.4).

---

## 7. Endpoints adicionais identificados na análise dos requisitos

### 7.1 `GET /api/v1/aggregations/cities` — Adicionar campos socioeconômicos e `total_populacao`

**Prioridade:** 🟡 Média  
**Requisitos:** 18, 20, 21

O endpoint já existe. Precisa incluir nas `properties` de cada feature:

```json
"properties": {
  "municipioIdIbge": "2507507",
  "municipio": "João Pessoa",
  "uf": "PB",
  "total_escolas": 412,
  "total_alunos": 98000,
  "pct_com_biblioteca": 62.3,
  "pct_com_internet": 88.1,
  "pct_com_lab_informatica": 45.2,
  "pct_sem_acessibilidade": 31.0,
  "total_populacao": 817511,
  "pct_preta_parda": 68.4,
  "pct_criancas_0_9": 11.2,
  "pct_agua_rede_geral": 91.3,
  "pct_esgoto_rede_geral": 72.1,
  "taxa_analfabetismo_15_mais": 4.2,
  "source": "municipio_indicadores"
}
```

**Lógica:** Os campos socioeconômicos vêm da collection `municipio_socioeconomico` (join por `municipioIdIbge`). Se não houver dados socioeconômicos para um município, retornar `null` nos campos socioeconômicos — o frontend exibe cor neutra (cinza) nesses casos.

---

### 7.2 `GET /api/v1/municipios/{id}/resumo` — Incluir bloco `socioeconomico` e `flags_qualidade`

**Prioridade:** 🟡 Média  
**Requisitos:** 21, 22

Complemento ao endpoint já documentado na seção 3.2. O response deve incluir:

```json
{
  "municipioIdIbge": "2507507",
  "municipio": "João Pessoa",
  "sg_uf": "PB",
  "total_escolas": 412,
  "total_matriculas": 98000,
  "pct_com_biblioteca": 62.3,
  "pct_com_internet": 88.1,
  "pct_com_lab_informatica": 45.2,
  "pct_sem_acessibilidade": 31.0,
  "source": "municipio_indicadores",
  "flags_qualidade": [],
  "socioeconomico": {
    "total_populacao": 817511,
    "taxa_analfabetismo_15_mais": 4.2,
    "pct_agua_rede_geral": 91.3,
    "pct_esgoto_rede_geral": 72.1,
    "pct_lixo_coletado": 96.8,
    "pct_preta_parda": 68.4,
    "pct_criancas_0_9": 11.2,
    "pct_idosos_60_mais": 14.8,
    "media_moradores_por_domicilio": 2.9,
    "source": "municipio_socioeconomico"
  }
}
```

Se não houver dados socioeconômicos, retornar `"socioeconomico": null` — o frontend exibe mensagem "Dados socioeconômicos não disponíveis para este município".

---

### 7.3 `GET /api/v1/municipios/{id}/exportar` — Exportação de dados

**Prioridade:** 🟢 Baixa  
**Requisitos:** 23

**Contrato:**

```
GET /api/v1/municipios/{municipio_id}/exportar?formato=csv
GET /api/v1/municipios/exportar?formato=csv  (todos os municípios)
```

**Response para `formato=csv`:**

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="odin_municipio_joao_pessoa_2024.csv"`
- Primeira linha: comentário com metadados (`# Gerado em: ..., Fonte: INEP 2024 / IBGE 2022, URL: ...`)
- Cabeçalho em português
- Uma linha por município com todos os indicadores educacionais e socioeconômicos disponíveis

**Colunas mínimas do CSV:**

```
municipio_id_ibge, municipio, uf, total_escolas, total_matriculas,
pct_com_internet, pct_com_biblioteca, pct_com_lab_informatica, pct_sem_acessibilidade,
total_populacao, taxa_analfabetismo_15_mais, pct_agua_rede_geral,
pct_esgoto_rede_geral, pct_lixo_coletado, pct_preta_parda,
pct_criancas_0_9, pct_idosos_60_mais, fonte_educacao, fonte_socioeconomico
```

---

### 7.4 `GET /api/v1/estados/{id}/resumo` — Resumo estadual com agregação ponderada

**Prioridade:** 🟢 Baixa  
**Requisitos:** 24

**Contrato:**

```
GET /api/v1/estados/PB/resumo
```

**Response esperada:**

```json
{
  "estado": "Paraíba",
  "sg_uf": "PB",
  "total_municipios": 223,
  "total_escolas": 3728,
  "total_matriculas": 650000,
  "total_populacao": 4059905,
  "indicadores_educacionais": {
    "pct_com_internet": 72.4,
    "pct_com_biblioteca": 38.1,
    "pct_com_lab_informatica": 29.6,
    "pct_sem_acessibilidade": 44.2,
    "metodo_agregacao": "soma_absoluta"
  },
  "indicadores_socioeconomicos": {
    "taxa_analfabetismo_15_mais": 16.8,
    "pct_agua_rede_geral": 68.3,
    "pct_esgoto_rede_geral": 41.2,
    "pct_lixo_coletado": 78.9,
    "pct_preta_parda": 71.2,
    "metodo_agregacao": "ponderado_populacao"
  }
}
```

**Lógica de negócio:**

- `taxa_analfabetismo_15_mais` estadual = média ponderada pela `total_populacao` de cada município (não média simples)
- Indicadores de saneamento = médias ponderadas pelo `total_domicilios`
- Indicadores educacionais percentuais = calculados sobre o total absoluto de escolas (não média de percentuais)
- O campo `metodo_agregacao` deve ser incluído em cada bloco para transparência metodológica

---

## 8. Resumo de prioridades — todos os endpoints

| Prioridade | Endpoint                                                                                 | Tipo   | Requisitos   |
| ---------- | ---------------------------------------------------------------------------------------- | ------ | ------------ |
| 🔴 Alta    | `GET /api/v1/municipios?sg_uf=PB`                                                        | Novo   | 1, 4         |
| 🔴 Alta    | `GET /api/v1/schools?municipio_id={id}`                                                  | Ajuste | 1, 4         |
| 🔴 Alta    | `GET /api/v1/escolas/geojson/paraiba?municipio_id={id}`                                  | Ajuste | 3, 5         |
| 🔴 Alta    | `GET /api/v1/aggregations/neighborhoods` → retornar FeatureCollection + corrigir typo    | Ajuste | 3, 9, 13     |
| 🟡 Média   | `GET /api/v1/municipios/{id}/resumo`                                                     | Novo   | 2, 8, 21, 22 |
| 🟡 Média   | `GET /api/v1/bairros/{id}/resumo`                                                        | Novo   | 2, 9         |
| 🟡 Média   | `GET /api/v1/busca/sugestoes`                                                            | Novo   | 10, 11       |
| 🟡 Média   | `GET /api/v1/aggregations/cities` → adicionar `total_populacao` + campos socioeconômicos | Ajuste | 18, 20       |
| 🟢 Baixa   | `GET /api/v1/estados`                                                                    | Novo   | 1            |
| 🟢 Baixa   | `GET /api/v1/municipios/{id}/exportar`                                                   | Novo   | 23           |
| 🟢 Baixa   | `GET /api/v1/municipios/exportar`                                                        | Novo   | 23           |
| 🟢 Baixa   | `GET /api/v1/estados/{id}/resumo`                                                        | Novo   | 24           |
