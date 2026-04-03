# ODIN Frontend — Arquitetura Base

## Objetivo

Garantir separação clara entre UI, estado e integração de dados para escalar sem retrabalho.

## Estrutura de pastas (feature-first)

- `src/app`
  - Rotas e layouts (App Router)
- `src/components`
  - `ui`: componentes visuais reutilizáveis e burros
  - `layout`: primitives de layout
  - `features`: composição por domínio/tela (landing, observatório)
- `src/hooks`
  - Hooks de comportamento e estado local de interface
- `src/services`
  - Acesso a API e contratos de integração
- `src/types`
  - Tipos de domínio e contratos compartilhados

## Regras práticas

1. Componentes em `ui` não conhecem regras de negócio.
2. `features` orquestram seções de tela e usam `ui` + `hooks`.
3. Acesso HTTP fica em `services`, nunca direto no componente.
4. Tipos ficam em `types` para reduzir acoplamento.
5. Estado geoespacial complexo deve ser centralizado (etapa futura).

## Fase 2 — Observatório (App Shell)

- `features/observatorio` concentra a composição da tela `/observatorio`.
- `useObservatorioShell` orquestra filtros, camada ativa e seleção atual.
- `services/education-api` define contratos de API.
- `services/education-mock-data` garante operação local sem backend.
- `types/observatory` descreve seleção e entidades exibidas no shell.

Princípio da fase: permitir evolução incremental para mapa real sem refatoração estrutural.

## Tema e design tokens

- Dark-first com toggle para light.
- Tokens globais em `globals.css` via CSS variables.
- Classes utilitárias em Tailwind com `darkMode: "class"`.
