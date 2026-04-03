# ODIN Frontend — Fase 3 (Integração Geoespacial)

## Objetivo

Integrar Mapbox ao shell do observatório com renderização de camadas geoespaciais, interatividade por clique, e sincronização com o backend via API FastAPI.

---

## Arquitetura — Visão geral

```
ObservatorioShell (orquestrador)
├─ Sidebar: filtros/camada
├─ MapboxObservatorioMap: mapa + camadas
└─ DetailPanel: entidade selecionada
        ↓                                    ↓
useObservatorioShell          useMapLayers (novo)
(estado filtros)              (buscar geometrias)
        ↓                                    ↓
FastAPI Backend
GET /camadas?nivel=municipio&recorte=pb
GET /camadas?nivel=bairro&recorte=jp
GET /resumo/{entidade_type}?id=<id>
```

---

## Componentes — Estrutura proposta

### MapboxObservatorioMap (novo)

Substitui `observatorio-map-stage.tsx`. Responsável por:

- Renderizar mapa Mapbox
- Gerenciar camadas GeoJSON
- Detectar zoom e trocar camada ativa
- Emitir evento de clique em feature
- Loading states enquanto busca geometrias

### useMapLayers (novo hook)

- Busca dados geoespaciais do backend
- Cache inteligente para evitar requestar mesmos dados
- Loading states por nível
- Error handling com fallback gracioso

### Tipos Geoespaciais (novos)

- `GeoJSONFeature`: estrutura de feature com properties
- `CamadaGeoespacial`: envelope de nível + geometrias
- `MapLayerStyle`: estilo visual por tipo
- Contracts: respostas esperadas do `/camadas` endpoint

---

## Dados — Fluxo e contrato

### Backend: GET /camadas

Request:

```
GET /camadas?nivel=municipio&recorte=pb
```

Response (GeoJSON FeatureCollection):

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "jp",
      "properties": {
        "nome": "João Pessoa",
        "estado_id": "pb",
        "nivel": "municipio",
        "populacao": 809015,
        "area_km2": 254.3
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": []
      }
    }
  ]
}
```

Contrato de types:

```typescript
type Feature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  {
    id: string;
    nome: string;
    nivel: "municipio" | "bairro" | "escola";
  }
>;

type CamadaGeoespacial = {
  nivel: ObservatoryLayer;
  recorte: string;
  features: Feature[];
  bounds: [[lng, lat], [lng, lat]];
};
```

---

## Interatividade — Zoom-based layer switching

### Lógica de camadas

| Zoom | Camada    | Endpoint                                        | Click               |
| ---- | --------- | ----------------------------------------------- | ------------------- |
| 4-7  | Município | `GET /camadas?nivel=municipio&recorte=<estado>` | Seleciona município |
| 8-11 | Bairro    | `GET /camadas?nivel=bairro&recorte=<municipio>` | Seleciona bairro    |
| 12+  | Escola    | `GET /camadas?nivel=escola&recorte=<bairro>`    | Seleciona escola    |

### Estilo visual

Cada nível tem cor/padrão distinto:

- **Município**: Cyan (#06B6D4)
- **Bairro**: Violet (#A78BFA)
- **Escola**: Emerald (#10B981)

Hover: overlay com 20% de opacidade
Selected: destaque com sombra + stroke

---

## Estado — Diagrama de fluxo

```
Usuário abre observatório
↓
useObservatorioShell carrega filtros (localStorage)
↓
MapboxObservatorioMap inicializa
↓
useMapLayers busca GET /camadas?nivel=municipio
↓
Features renderizadas no mapa
↓
Usuário clica em feature
↓
onFeatureClick() → selectEntity() + setDetailsOpen(true)
↓
DetailPanel abre
↓
Usuário faz zoom
↓
useEffect detecta zoom change
↓
Camada visível muda + useMapLayers refetch
```

---

## Responsividade

### Desktop (≥1024px)

- Mapa full viewport com sidebar 320px
- Painel detalhes lado direito
- Zoom inicial: 7

### Tablet (640-1023px)

- Mapa responsivo, sidebar colável
- Painel detalhes bottom sheet se aberto
- Zoom inicial: 6-7

### Mobile (<640px)

- Mapa full, sidebar drawer horizontal
- Painel detalhes bottom sheet full height
- Zoom inicial: 5
- Touch interactions para pan/zoom

---

## Acessibilidade

- ARIA labels em botões de camada
- Keyboard navigation no mapa (arrow keys para pan)
- Contraste de cores validado (WCAG AA)
- Alt text para features (nome + nível)
- Screen reader context: "Mapa com [N] municípios"

---

## Estratégia de cache

```
cacheKey = `odin:geospatial:${nivel}:${recorte}:v1`

Reuse se:
1. Cache hit
2. Dados < 5 min antigos
3. Mesmo recorte/nível

Invalidate se:
1. Usuário muda filtro
2. 5 min passaram
3. Erro de fetch
```

---

## Loading/Error states

### Loading

- Spinner no centro do mapa
- Features atuais ficam semi-opacas (0.5)
- Mensagem: "Carregando geometrias..."

### Error

- Toast notificação no topo
- Features opacas com padrão "error"
- Mensagem com CTA "Tentar novamente"
- Fallback: cache antigo se disponível

---

## Instalação de dependências

```bash
npm install react-map-gl mapbox-gl
npm install -D @types/mapbox-gl
```

Variáveis de ambiente:

```
NEXT_PUBLIC_MAPBOX_TOKEN=<seu_token>
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## Definição de Pronto (Fase 3)

- [ ] MapboxObservatorioMap renderizando mapa
- [ ] Zoom-based layer switching funcional
- [ ] Click-to-select funcionando
- [ ] useMapLayers com cache
- [ ] Responsivo em mobile/tablet/desktop
- [ ] Acessibilidade validada (ARIA, keyboard)
- [ ] Loading/error states
- [ ] Integração end-to-end com shell
- [ ] Lint/build sem erros
- [ ] Documentação atualizada

---

## Próximas iterações (Fase 4+)

- [ ] Cluster de features para melhor performance
- [ ] Filtro por atributo no mapa
- [ ] Exportar dados selecionados
- [ ] Timeline de dados históricos
- [ ] Heatmaps de densidade
