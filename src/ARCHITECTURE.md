# Arquitetura Frontend — ODIN

## Visão Geral

O frontend do ODIN é organizado em três zonas com fronteiras rígidas, seguindo Clean Architecture e o princípio Open/Closed: o sistema é aberto para extensão (novos módulos) e fechado para modificação (o Shell não muda quando um módulo é adicionado).

```
┌─────────────────────────────────────────────────────────────┐
│                      src/app/                               │
│                  (Next.js App Router)                       │
│         Bootstrap: registra módulos antes do render         │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  ┌────────────┐   ┌──────────────┐   ┌──────────────────┐
  │  src/shell │   │ src/modules/ │   │   src/core/      │
  │            │   │              │   │                  │
  │ layout     │   │ educacao/    │   │ types/           │
  │ sidebar    │   │ socioec../   │   │   territory.ts   │
  │ mapa       │   │ saude/       │   │   shell.ts       │
  │ painel     │   │ ...          │   │   module.ts      │
  │ hooks      │   │              │   │   geospatial.ts  │
  └─────┬──────┘   └──────┬───────┘   │ registry/        │
        │                 │           │ geospatial/      │
        └─────────────────┴──────────►│ filters/         │
                                      └──────────────────┘

Fluxo de dependência (setas = "pode importar de"):
  modules  →  core   ✓
  shell    →  core   ✓
  shell    →  registry (via getModule/listModules)  ✓
  modules  →  modules  ✗  PROIBIDO
  core     →  modules  ✗  PROIBIDO
  core     →  shell    ✗  PROIBIDO
  shell    →  modules  ✗  PROIBIDO (use o registry)
```

---

## Onde Fica o Quê

| O que é                                                            | Caminho canônico                                  |
| ------------------------------------------------------------------ | ------------------------------------------------- |
| Entidades territoriais (Estado, Municipio, Bairro, Escola)         | `src/core/types/territory.ts`                     |
| Tipo de camada (ObservatoryLayer)                                  | `src/core/types/territory.ts`                     |
| Tipos GeoJSON e geoespaciais                                       | `src/core/types/geospatial.ts`                    |
| Tipos do Shell (ObservatorySelection, MapEntity, SearchSuggestion) | `src/core/types/shell.ts`                         |
| Contrato de módulo (ModuleContract, ModuleIndicator)               | `src/core/types/module.ts`                        |
| ModuleRegistry (registerModule, getModule, listModules)            | `src/core/registry/module-registry.ts`            |
| Hook de camadas geoespaciais                                       | `src/core/geospatial/use-map-layers.ts`           |
| Hook de filtros em cascata                                         | `src/core/filters/use-cascade-filters.ts`         |
| Componentes visuais puros (sem regra de negócio)                   | `src/components/ui/`                              |
| Componentes do Shell                                               | `src/shell/components/`                           |
| Hooks do Shell                                                     | `src/shell/hooks/`                                |
| ShellContext                                                       | `src/shell/context/shell-context.tsx`             |
| Tipos exclusivos de um módulo                                      | `src/modules/{nome}/types/`                       |
| Componentes de módulo                                              | `src/modules/{nome}/components/`                  |
| Hooks de módulo                                                    | `src/modules/{nome}/hooks/`                       |
| API calls de módulo                                                | `src/modules/{nome}/services/{nome}-api.ts`       |
| Mock data de módulo                                                | `src/modules/{nome}/services/{nome}-mock-data.ts` |
| Barrel de módulo                                                   | `src/modules/{nome}/index.ts`                     |

---

## Como Adicionar um Novo Módulo

**4 passos. Nenhum arquivo fora do módulo precisa ser alterado, exceto o bootstrap.**

### 1. Criar a estrutura de pastas

```
src/modules/{nome}/
├── index.ts                    ← exporta o objeto que implementa ModuleContract
├── components/
│   ├── {nome}-sidebar-panel.tsx
│   └── {nome}-detail-panel.tsx
├── hooks/
│   └── use-{nome}-selection.ts
├── services/
│   ├── {nome}-api.ts
│   └── {nome}-mock-data.ts
└── types/
    └── {nome}.ts
```

### 2. Implementar o ModuleContract em `index.ts`

```typescript
import type { ModuleContract } from "@/core/types/module";
import { MeuSidebarPanel } from "./components/meu-sidebar-panel";

export const meuModulo: ModuleContract = {
  id: "meu-modulo", // único no registry
  label: "Meu Módulo", // exibido na aba da sidebar
  description: "Descrição curta para o seletor de módulo",
  availableLayers: ["municipio", "bairro"],
  SidebarPanel: MeuSidebarPanel,
  // DetailPanel, getIndicators, getMapLayerStyle, buildSelection — opcionais
};
```

### 3. Registrar no bootstrap

```typescript
// src/app/observatorio/page.tsx
import { meuModulo } from "@/modules/meu-modulo";
if (!getModule("meu-modulo")) registerModule(meuModulo);
```

### 4. Pronto

A aba aparece automaticamente na sidebar. O Shell não precisa de nenhuma alteração.

---

## Imports Corretos vs. Proibidos

```typescript
// ✅ Módulo importando do core
import type { Municipio } from "@/core/types/territory";
import type { ModuleContract } from "@/core/types/module";
import type { MapEntity } from "@/core/types/shell";

// ✅ Shell acessando módulo via registry
import { getModule, listModules } from "@/core/registry/module-registry";
const mod = getModule(activeModuleId);

// ✅ Módulo consumindo ShellContext via hook público
import { useShellContext } from "@/shell/context/shell-context";

// ❌ Shell importando módulo diretamente — PROIBIDO
import { educacaoModule } from "@/modules/educacao";

// ❌ Módulo importando de outro módulo — PROIBIDO
import { SOCIO_INDICATORS } from "@/modules/socioeconomico/types/socioeconomico";

// ❌ Core dependendo de módulo — PROIBIDO
import { MOCK_ESCOLAS } from "@/modules/educacao/services/education-mock-data";

// ❌ Tipo territorial redefinido em módulo — PROIBIDO
// src/modules/educacao/types/education.ts
interface Municipio {
  id: string;
  nome: string;
} // já existe em core/types/territory.ts
```

---

## Convenções de Nomenclatura

| O que             | Convenção                 | Exemplo                                    |
| ----------------- | ------------------------- | ------------------------------------------ |
| Arquivos          | `kebab-case`              | `use-shell-filters.ts`                     |
| Componentes React | `PascalCase`              | `EducationDetailPanel`                     |
| Hooks             | prefixo `use-` no arquivo | `use-shell-filters.ts` → `useShellFilters` |
| Serviços de API   | sufixo `-api.ts`          | `education-api.ts`                         |
| Mock data         | sufixo `-mock-data.ts`    | `education-mock-data.ts`                   |
| Barrel de módulo  | sempre `index.ts`         | `src/modules/educacao/index.ts`            |

---

## Boas Práticas Obrigatórias

- Componentes `src/components/ui/` são **burros** — sem lógica de negócio, sem fetch, sem contexto de domínio
- Sem `fetch` direto em componentes — toda chamada HTTP fica em `services/`
- Sem `any` explícito — usar `unknown` com type guard quando necessário
- Sem estado global fora de ShellContext ou hooks dedicados
- Hooks de composição (`useObservatorioShell`) não contêm lógica — apenas compõem hooks especializados
- Sem re-exports circulares entre zonas

---

## Regras Enforçadas pelo ESLint

As regras `import/no-restricted-paths` em `.eslintrc.json` bloqueiam automaticamente:

1. `src/core/` importando de `src/modules/` ou `src/shell/`
2. `src/shell/` importando diretamente de `src/modules/`
3. `src/modules/educacao/` importando de `src/modules/socioeconomico/` e vice-versa

Violações geram **erro** (não aviso) e bloqueiam o build em CI.

---

> Dúvidas? Consulte também `.kiro/steering/architecture.md` — lido automaticamente por agentes de IA.
