# ODIN Frontend — Plano de Sprints

## Visão

- Stack base: Next.js 14 + Tailwind 3.4 + TypeScript
- Estratégia: dark-first com suporte a light
- Prioridade atual: Landing Page

---

## Fase 0 — Fundação (Sprint 0)

**Objetivo:** preparar base técnica, convenções e tema global para evitar retrabalho.

### Escopo (Fase 0)

- [x] Projeto Next.js inicializado e validado
- [x] Makefile com comandos de DX
- [x] Theme provider global com `next-themes`
- [x] Toggle de tema funcional (dark/light)
- [x] Metadados e idioma base (`pt-BR`)
- [x] Definir padrão de arquitetura de pastas (feature-first)
- [x] Criar componentes base de layout da landing
- [x] Definir tipografia e tokens iniciais da marca ODIN

### Entregáveis (Fase 0)

- App funcionando em `/` e `/observatorio`
- Tema dark/light sem erro de hidratação
- Documento de sprint atualizado

### Critérios de pronto (Fase 0)

- `make check` sem erros
- Navegação entre rotas ok
- Tema alternando corretamente nas duas rotas

---

## Fase 1 — Landing Page (Sprint 1)

**Objetivo:** entregar landing institucional pronta para conversão.

### Escopo (Fase 1)

- Navbar com branding
- Hero com proposta de valor
- Seção “wow factor” (nível bairro)
- Bento de funcionalidades
- CTA para entrar no observatório
- Footer institucional
- Responsividade e acessibilidade base

### Critérios de pronto (Fase 1)

- Landing completa e responsiva
- CTA principal levando para `/observatorio`
- Lighthouse aceitável (performance e acessibilidade)

### Status atual

- [x] Landing institucional completa
- [x] Seção de governança e autoria (LEMA/UFPB)
- [x] CTA consistente (navbar/hero/seção final)
- [ ] Rodada final de Lighthouse para fechamento formal da fase

---

## Fase 2 — App Shell Observatório (Sprint 2)

**Objetivo:** consolidar estrutura do dashboard e contratos de dados.

### Escopo (Fase 2)

- [x] Sidebar de filtros em cascata
- [x] Busca por texto nos filtros (estado/município/bairro)
- [x] Busca fuzzy para bairro/escola/endereço (mock)
- [x] Área de mapa full-screen (stage de integração)
- [x] Painel lateral de detalhes (slide-over)
- [x] Estados globais mínimos (filtros + seleção)
- [x] Contratos de tipos para entidade geoespacial
- [x] Sidebar recolhível para ganho de área útil
- [x] Persistência local + querystring sincronizada
- [x] Atalhos de teclado no shell
- [ ] Conectar shell com endpoints reais de resumo/camadas

Referência de implementação/documentação:

- `docs/phase-2-app-shell.md`

---

## Fase 3 — Integração geoespacial (Sprint 3+)

**Objetivo:** conectar mapa e dados reais do backend.

### Escopo (Fase 3)

- `react-map-gl` com camadas por zoom
- município → bairro → escola
- integração com API FastAPI
- loading/error states e cache
