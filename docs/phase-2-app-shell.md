# ODIN Frontend — Fase 2 (App Shell do Observatório)

## Objetivo

Consolidar a estrutura funcional do `/observatorio` com filtros em cascata, área de mapa preparada para integração e painel de detalhes em slide-over.

---

## O que foi implementado

### 1) Shell do Observatório

- Componente principal client-side: `ObservatorioShell`
- Layout: `sidebar + mapa` com comportamento responsivo
- Controles globais na tela:
  - botão de retorno para landing
  - toggle de tema

Arquivos:

- `src/components/features/observatorio/observatorio-shell.tsx`
- `src/app/observatorio/page.tsx`

### 2) Sidebar com filtros em cascata

- Combobox com busca por texto em `Estado -> Município -> Bairro`
- Mudança de nível reseta níveis inferiores
- Camada ativa alternável:
  - Município
  - Bairro
  - Escola
- Indicadores de loading por nível
- Modo recolhido/expandido no desktop para ampliar área de visualização

Arquivo:

- `src/components/features/observatorio/observatorio-sidebar.tsx`

### 3) Área de mapa (stage de integração)

- Placeholder visual para fase de integração com Mapbox (Fase 3)
- Lista de entidades clicáveis conforme camada ativa
- Destaque visual da seleção atual

Arquivo:

- `src/components/features/observatorio/observatorio-map-stage.tsx`

### 4) Painel lateral de detalhes (slide-over)

- Abre ao selecionar entidade do mapa
- Mostra metadados + métricas resumidas
- Fecha por:
  - botão explícito
  - botão “Fechar painel” no stage do mapa
  - tecla `Esc`
  - clique no backdrop
- Responsivo:
  - desktop: painel lateral direito
  - mobile: painel inferior

Arquivo:

- `src/components/features/observatorio/observatorio-detail-panel.tsx`

### 5) Hook de orquestração da tela

- `useObservatorioShell` centraliza:
  - estado de filtros
  - carregamento de dados
  - camada ativa
  - seleção atual
  - abertura/fechamento do painel
- Estratégia de fallback para desenvolvimento local:
  - tenta API real
  - em ausência/erro, usa mock

Arquivo:

- `src/hooks/use-observatorio-shell.ts`

### 6) Dados mock e contratos

- Catálogo mock para operação local
- Tipos de observatório para seleção/camada/entidade

Arquivos:

- `src/services/education-mock-data.ts`
- `src/types/observatory.ts`

### 7) Busca fuzzy por território/endereço

- Busca inteligente por:
  - bairro
  - escola
  - endereço (mock)
- Resultado da busca aplica automaticamente o recorte territorial mais próximo
- Implementado com `fuse.js` para tolerância a erros de digitação

Arquivos:

- `src/hooks/use-observatorio-shell.ts`
- `src/components/features/observatorio/observatorio-sidebar.tsx`
- `src/services/education-mock-data.ts`

### 8) Pente fino de UX/UI (abril/2026)

- Correção de sobreposição visual entre painel de detalhes e ações globais
- Controle explícito de recolher/expandir sidebar sem conflito com chips do mapa
- Combobox de filtros com comportamento de select + busca:
  - abrir/fechar previsível
  - limpar seleção explícita
  - dropdown acionável por botão
- Busca inteligente com feedback de "aplicado" e limpeza rápida
- Correção de re-seleção automática ao limpar filtros
- Inicialização mais robusta da animação de rede no primeiro carregamento da landing

### 9) Hardening de produção (abril/2026)

- Atalhos de teclado no shell:
  - `/` ou `Ctrl/Cmd + K`: foco na busca inteligente
  - `Ctrl/Cmd + B`: recolher/expandir sidebar
  - `Esc`: fechar painel de detalhes
- Persistência de sessão no `localStorage`:
  - `estado`, `município`, `bairro`, `layer`, estado da sidebar
- Sincronização de estado com querystring:
  - `estado`, `municipio`, `bairro`, `layer`, `sidebar`
  - links compartilháveis para reproduzir contexto de análise

---

## Endpoints necessários (contrato de backend)

> Base URL: `NEXT_PUBLIC_API_BASE_URL`

### A) Catálogo territorial

1. `GET /estados`
   - resposta: `Estado[]`

2. `GET /municipios?estado_id=<id>`
   - resposta: `Municipio[]`

3. `GET /bairros?municipio_id=<id>`
   - resposta: `Bairro[]`

4. `GET /escolas?bairro_id=<id>`
   - resposta: `Escola[]`

### B) Endpoints recomendados para próxima iteração

1. `GET /resumo/municipio?id=<id>`
   - objetivo: dados agregados para painel de detalhes

2. `GET /resumo/bairro?id=<id>`
   - objetivo: métricas locais para prioridade territorial

3. `GET /resumo/escola?id=<id>`
   - objetivo: perfil detalhado da unidade escolar

4. `GET /camadas?nivel=<municipio|bairro|escola>&recorte=<id>`
   - objetivo: geometrias/atributos para renderização no mapa

### C) Endpoints recomendados para busca inteligente

1. `GET /busca/sugestoes?q=<texto>&estado_id=<id?>&municipio_id=<id?>`
   - objetivo: autocomplete fuzzy de bairro/escola/endereço
   - resposta sugerida: `SearchSuggestion[]`

2. `GET /geocode?q=<texto>&limit=<n?>`
   - objetivo: resolver endereço para coordenada/entidade mais próxima

3. `GET /reverse-geocode?lat=<x>&lng=<y>`
   - objetivo: retornar rua/bairro/município para clique no mapa

---

## Princípios aplicados

- Separação clara entre UI (`components`), estado (`hooks`) e integração (`services`)
- Reuso de tipos de domínio em `src/types`
- Componentes desacoplados por responsabilidade
- Acessibilidade mínima de produção:
  - `aria-label`
  - foco visível
  - controles com semântica clara

---

## Definição de pronto parcial da Fase 2

- [x] Sidebar com filtros em cascata
- [x] Busca por texto nos filtros de território
- [x] Área de mapa preparada para integração
- [x] Painel de detalhes em slide-over
- [x] Estado mínimo global da tela
- [x] Contratos documentados para backend
- [x] Modo de foco visual com sidebar recolhível
- [x] Persistência de filtros/camada no `localStorage`
- [x] Sincronização de filtros/camada via querystring
- [x] Atalhos de teclado de produtividade

Pendências da Fase 2:

- [ ] Estado global compartilhado para múltiplas features do observatório
- [ ] Conectar painel de detalhes a endpoints de resumo
