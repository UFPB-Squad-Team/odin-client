# ODIN — Observatório de Dados e Indicadores

Frontend do sistema ODIN, uma plataforma de observatório territorial com dados de educação, saneamento e demografia para a Paraíba. Desenvolvido com Next.js 15 + App Router, MapLibre GL e Tailwind CSS.

---

## Pré-requisitos

- Node.js 20+
- npm, yarn, pnpm ou bun
- Variável de ambiente `NEXT_PUBLIC_API_BASE_URL` apontando para a API ODIN

---

## Instalação e execução

```bash
# instalar dependências
npm install

# servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

```bash
# build de produção
npm run build
npm start

# lint
npm run lint
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Sim | URL base da API ODIN |

Crie um `.env.local` na raiz:

```env
NEXT_PUBLIC_API_BASE_URL=""
```

Sem essa variável, o sistema roda em modo local com dados mock.

---

## Estrutura do projeto

```
src/
├── app/                    # Next.js App Router — rotas e páginas
│   ├── observatorio/       # Mapa interativo principal
│   ├── schools/[schoolId]  # Página de detalhes de escola
│   └── bairros/[bairroId]  # Página de detalhes de bairro
├── core/                   # Lógica compartilhada — sem dependência de módulos
│   ├── types/              # Tipos globais (territory, shell, geospatial, module)
│   ├── geospatial/         # Hooks e utilitários de mapa
│   ├── choropleth/         # Lógica de coloração por indicador
│   ├── filters/            # Hook de filtros em cascata
│   ├── registry/           # ModuleRegistry — registro dinâmico de módulos
│   ├── selections/         # Builders de seleção compartilhados entre módulos
│   └── territory/          # API de território (estados, municípios, bairros)
├── shell/                  # Layout principal, sidebar, mapa, painel de detalhes
│   ├── components/
│   └── hooks/
├── modules/                # Módulos de domínio (plugáveis via registry)
│   ├── educacao/
│   └── socioeconomico/
├── components/
│   └── ui/                 # Componentes visuais puros (sem regra de negócio)
└── lib/                    # Utilitários genéricos
```

> **Leia o guia de arquitetura antes de contribuir:**
> [`src/architecture.md`](./src/architecture.md)

---

## Arquitetura em resumo

O projeto segue **Clean Architecture** com fronteiras rígidas entre três zonas:

- **`core/`** — código compartilhado, sem dependência de módulos ou shell
- **`shell/`** — layout e orquestração; acessa módulos **somente via registry**
- **`modules/`** — lógica de domínio plugável; importa apenas de `core/`

Adicionar um novo módulo não requer alterar o Shell. Basta implementar o contrato `ModuleContract`, registrar no bootstrap e a aba aparece automaticamente na sidebar.

As regras de importação são enforçadas pelo ESLint (`import/no-restricted-paths`) e violações **bloqueiam o build em CI**.

---

## Camadas do mapa

O observatório opera em três camadas territoriais:

| Camada | Descrição |
|---|---|
| `municipio` | Todos os municípios do estado selecionado |
| `bairro` | Bairros do município selecionado (com fallback por setor censitário) |
| `escola` | Pontos de escolas com indicadores IDEB/INSE |

---

## Dados e fontes

| Dado | Fonte | Endpoint principal |
|---|---|---|
| Geometrias municipais | IBGE | `GET /aggregations/cities?sg_uf=PB` |
| Geometrias e indicadores de bairro | IBGE Censo 2022 / Setor censitário | `GET /aggregations/neighborhoods?municipio_id=` |
| Escolas | Censo Escolar / INEP | `GET /schools` |
| Resumo de bairro | bairros_indicadores / setor_indicadores | `GET /bairros/{id}/resumo` |
| Detalhe de escola | Censo Escolar | `GET /schools/{id}` |

Campos `source` (`bairros_indicadores` ou `setor_indicadores`) e `tem_bairro_oficial` são usados pelo frontend para exibir notas de qualidade de dados ao usuário.

---

## Módulos registrados

| ID | Label | Camadas suportadas |
|---|---|---|
| `educacao` | Educação | municipio, bairro, escola |
| `socioeconomico` | Socioeconômico | municipio, bairro |

Novos módulos são registrados em `src/shell/components/module-bootstrap.tsx`.

---

## Tecnologias principais

- [Next.js 15](https://nextjs.org) — App Router, Server Components
- [MapLibre GL](https://maplibre.org) via `react-map-gl` — mapa interativo
- [Tailwind CSS](https://tailwindcss.com) — estilização
- [Fuse.js](https://fusejs.io) — busca fuzzy na sidebar
- [Lucide React](https://lucide.dev) — ícones