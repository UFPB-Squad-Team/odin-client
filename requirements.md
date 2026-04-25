# Documento de Requisitos — ODIN MVP Observatório

## Introdução

O ODIN (Observatório de Dados Integrados do Nordeste) é uma plataforma de análise territorial desenvolvida pelo LEMA/UFPB. O ODIN tem como visão mapear o máximo de domínios possíveis — educação, saúde, economia, ONGs, entre outros — organizados em módulos independentes e escaláveis, cobrindo progressivamente os estados do Nordeste. A arquitetura do ETL já reflete essa visão: cada domínio é implementado como um job separado (`education_jobs`, `socioeconomico_jobs`, e futuros `saude_jobs`, `economia_jobs`, etc.).

O MVP do Observatório tem como objetivo conectar o frontend já construído (app shell com filtros, mapa e painel de detalhes) aos dados reais disponíveis no MongoDB, e adicionar as funcionalidades de maior valor para o usuário final. **O MVP ativa os dois primeiros módulos: Educação e Socioeconômico, ambos com escopo inicial na Paraíba.** Toda decisão de arquitetura — API, frontend, ETL e banco de dados — deve ser tomada considerando a adição futura de novos módulos sem necessidade de refatoração estrutural.

O escopo do MVP cobre cinco eixos principais:

1. **Integração de dados reais** — substituir os mocks do frontend por dados reais da API FastAPI, que por sua vez lê as collections MongoDB já populadas pelo ETL.
2. **Mapa interativo** — renderizar escolas, bairros e municípios em um mapa real (MapLibre/react-map-gl) com simbologia dinâmica por indicador.
3. **Detalhamento de entidades** — páginas e painéis com perfil completo de escolas, municípios e bairros.
4. **Exploração e descoberta** — ícones de informação nos indicadores, ranking por indicador, filtros cruzando dados educacionais com indicadores socioeconômicos do IBGE Censo 2022, e compartilhamento de estado via link.
5. **Experiência do usuário** — seção "Feito por quem" na landing page e tutorial interativo de boas-vindas para novos usuários.

**Fora do escopo do MVP:** busca semântica NLP, módulo de negócios/Receita Federal, expansão para outros estados do Nordeste, modo de comparação entre entidades, integração com IA, inclusão de escolas privadas, score de vulnerabilidade composta.

---

## Referência de Produto e Princípios de Design

### Benchmark: Opportunity Atlas (opportunityatlas.org)

O benchmark visual e de experiência do ODIN é o [Opportunity Atlas](https://www.opportunityatlas.org/), desenvolvido pelo Opportunity Insights (Harvard/Census Bureau). O Atlas mapeia mobilidade econômica intergeracional nos EUA no nível de census tract (equivalente ao setor censitário brasileiro) e serve como referência direta para as decisões de UX e arquitetura de informação do ODIN.

**O que o ODIN herda do Opportunity Atlas:**

- O mapa é o produto principal, não um acessório. Ele ocupa permanentemente o canvas e nunca some ou fica em segundo plano.
- A navegação é orientada por território: o usuário explora o mapa, clica em uma entidade e o painel de detalhes aparece como consequência da seleção — não como destino separado.
- A simbologia dinâmica por indicador é o mecanismo central de descoberta. Trocar o indicador no seletor é a ação mais frequente do usuário analítico.
- Os painéis (sidebar, detalhes) são sobreposições ao mapa, não páginas separadas. O mapa permanece visível e interativo enquanto os painéis estão abertos.
- A progressão natural de uso é: mapa → seleciona território → vê resumo → aprofunda nos detalhes estatísticos se quiser. O aprofundamento é uma escolha, não uma obrigação.

**O diferencial do ODIN em relação ao Opportunity Atlas:**

O Opportunity Atlas trabalha com uma dimensão principal (mobilidade econômica). O ODIN é multi-módulo por design — educação, saúde, economia, ONGs e outros domínios serão incorporados progressivamente. No MVP, os dois primeiros módulos ativos (Educação e Socioeconômico) já permitem cruzamentos que não existem em nenhuma plataforma pública atual para a Paraíba — como correlacionar infraestrutura escolar com saneamento domiciliar no nível municipal. Cada novo módulo adicionado multiplica as possibilidades de cruzamento disponíveis para o usuário.

### Modelo de Dados Territoriais e Comportamento de Clique

O ODIN cobre o território da Paraíba com quatro granularidades sobrepostas. Quando o usuário clica em qualquer ponto do mapa, o sistema exibe os dados da camada ativa naquele ponto:

| Camada ativa     | Geometria               | Cobertura                    | Dados disponíveis (MVP)         |
| ---------------- | ----------------------- | ---------------------------- | ------------------------------- |
| Município        | Centróide (Point)       | 223/223 municípios           | Educacional + Socioeconômico    |
| Setor Censitário | Polígono (MultiPolygon) | ~98,7% do território PB      | Educacional agregado por setor  |
| Bairro           | Polígono (Polygon)      | 194 bairros em 12 municípios | Educacional agregado por bairro |
| Escola           | Ponto (Point)           | 3.728 escolas                | Perfil completo individual      |

A coluna "Dados disponíveis (MVP)" reflete os módulos ativos no MVP. Novos módulos (saúde, economia, etc.) adicionarão indicadores nas mesmas granularidades geográficas, sem alterar a estrutura de navegação territorial.

O campo `tem_bairro_oficial` presente em cada documento de setor censitário indica se aquele setor pertence a um município com delimitação oficial de bairro IBGE, permitindo ao frontend decidir automaticamente se exibe a camada de bairro ou usa o setor como unidade de análise inframunicipal.

### Princípios de Design que guiam decisões de UX

1. **O mapa é o canvas permanente.** Nenhuma interação deve remover o mapa da tela ou redirecionar para uma página sem mapa.
2. **Dados primeiro, análise por escolha.** O ODIN expõe dados organizados e contextualizados. A interpretação e a análise são do usuário. O produto não deve forçar conclusões.
3. **Cada clique tem resposta.** Qualquer ponto clicável no mapa deve retornar dados — a cobertura por setor censitário garante isso para ~98,7% do território.
4. **Contexto sem ruído.** Indicadores de qualidade de dados (flags, notas metodológicas, ano de referência) devem estar disponíveis mas não devem dominar a interface. Aparecem quando relevantes, não em todo lugar.
5. **Comparação por navegação.** O usuário compara territórios navegando pelo mapa e pelo ranking, não por um modo de comparação lado a lado — que fica fora do escopo do MVP.

---

## Glossário

- **Observatório**: a aplicação web ODIN acessível em `/observatorio`.
- **API**: o serviço FastAPI (`odin-api`) que expõe os dados do MongoDB.
- **ETL**: o pipeline de dados (`odin-etl`) que popula o MongoDB.
- **Frontend**: a aplicação Next.js 14 (`odin-frontend`).
- **Shell**: o componente `ObservatorioShell` — layout principal do observatório com sidebar, mapa e painel de detalhes.
- **Sidebar**: painel lateral esquerdo com filtros em cascata (Estado → Município → Bairro) e controles de camada.
- **Painel_de_Detalhes**: slide-over que exibe o perfil completo de uma entidade selecionada.
- **Camada_Ativa**: nível geográfico atualmente visualizado no mapa — `municipio`, `bairro` ou `escola`.
- **Escola**: unidade escolar com perfil completo (infraestrutura, indicadores, localização).
- **Municipio**: município da Paraíba com indicadores educacionais agregados.
- **Bairro**: bairro oficial IBGE com indicadores educacionais agregados (disponível em 12 municípios).
- **Setor_Censitario**: unidade geográfica base do IBGE com cobertura de 98,7% das escolas da PB.
- **GeoJSON**: formato padrão para representação de geometrias geoespaciais.
- **Indicador**: métrica educacional calculada pelo ETL (ex.: `pct_com_internet`, `total_matriculas`).
- **Simbologia_Dinamica**: variação de cor e/ou tamanho dos pontos/polígonos no mapa conforme o valor de um indicador selecionado.
- **Filtro_em_Cascata**: sequência de filtros onde a seleção de um nível restringe as opções do nível seguinte (Estado → Município → Bairro).
- **Busca_Fuzzy**: busca tolerante a erros de digitação implementada com `fuse.js`.
- **Mock**: dados fictícios usados no frontend enquanto a API não está integrada.
- **INEP**: Instituto Nacional de Estudos e Pesquisas Educacionais — fonte dos dados do Censo Escolar.
- **IBGE**: Instituto Brasileiro de Geografia e Estatística — fonte das geometrias geoespaciais.
- **IDEB**: Índice de Desenvolvimento da Educação Básica.
- **Indicador_Socioeconomico**: métrica socioeconômica calculada pelo ETL a partir do IBGE Censo 2022, disponível nas mesmas granularidades geográficas dos indicadores educacionais (ex.: `pct_preta_parda`, `taxa_analfabetismo_15_mais`, `total_populacao`).
- **Ranking**: lista ordenada de municípios ou bairros por valor de um indicador selecionado, exibida em ordem decrescente ou crescente conforme o contexto do indicador.
- **Tooltip_Indicador**: elemento de interface que exibe, ao passar o cursor sobre um indicador, a definição textual completa daquele indicador.
- **Tutorial**: guia interativo de boas-vindas que apresenta as funcionalidades principais do Observatório em etapas sequenciais, exibido na primeira visita e acessível novamente via botão de ajuda.
- **Estado_Compartilhavel**: conjunto de parâmetros que define completamente a visualização atual do Observatório — filtros aplicados, camada ativa, indicador selecionado, zoom e centro do mapa — codificado na query string da URL.
- **LEMA**: Laboratório de Estudos em Modelagem e Análise de Dados da UFPB — equipe responsável pelo desenvolvimento do ODIN.
- **ODS_Racial**: projeto do LEMA/UFPB de monitoramento dos Objetivos de Desenvolvimento Sustentável com recorte racial.
- **Porte_Municipal**: classificação de municípios por população total em três faixas — Pequeno (até 10.000 hab.), Médio (10.001 a 50.000 hab.) e Grande (acima de 50.000 hab.) — usada para filtrar rankings e comparações.
- **Flag_Qualidade**: marcador textual persistido no MongoDB que indica características atípicas documentadas de um município (ex.: território indígena, ausência de rede de água), prevenindo interpretações equivocadas dos indicadores.
- **Agregacao_Ponderada**: método de cálculo de indicadores estaduais que pondera cada município pelo seu peso populacional ou domiciliar, em oposição à média simples que trata todos os municípios com o mesmo peso independentemente do tamanho.

---

## Requisitos

### Requisito 1: Endpoints de Catálogo Territorial na API

**User Story:** Como desenvolvedor do frontend, quero endpoints REST que retornem listas de estados, municípios, bairros e escolas com seus identificadores e nomes, para que os filtros em cascata do Observatório possam ser populados com dados reais.

#### Critérios de Aceitação

1. THE API SHALL expor o endpoint `GET /api/v1/estados` retornando a lista de estados disponíveis com `id`, `nome` e `sigla`.
2. WHEN uma requisição `GET /api/v1/municipios?estado_id={id}` é recebida, THE API SHALL retornar a lista de municípios do estado informado com `id`, `nome` e `estadoId`.
3. WHEN uma requisição `GET /api/v1/bairros?municipio_id={id}` é recebida, THE API SHALL retornar a lista de bairros do município informado com `id`, `nome` e `municipioId`.
4. WHEN uma requisição `GET /api/v1/escolas?municipio_id={id}` é recebida, THE API SHALL retornar a lista paginada de escolas do município com `id`, `nome`, `dependenciaAdm`, `tipoLocalizacao` e coordenadas.
5. WHERE o parâmetro `bairro_id` for fornecido em `GET /api/v1/escolas`, THE API SHALL filtrar as escolas pelo bairro informado.
6. IF um `estado_id`, `municipio_id` ou `bairro_id` inválido for fornecido, THEN THE API SHALL retornar HTTP 404 com mensagem descritiva do erro.
7. THE API SHALL retornar todos os endpoints de catálogo com tempo de resposta inferior a 500ms para listas de até 500 itens.

---

### Requisito 2: Endpoints de Resumo por Entidade na API

**User Story:** Como usuário do Observatório, quero ver indicadores educacionais detalhados ao selecionar um município, bairro ou escola no mapa, para que eu possa analisar a situação educacional daquela localidade.

#### Critérios de Aceitação

1. WHEN uma requisição `GET /api/v1/municipios/{id}/resumo` é recebida, THE API SHALL retornar os indicadores agregados do município: `total_escolas`, `total_matriculas`, `pct_com_internet`, `pct_com_biblioteca`, `pct_com_lab_informatica` e `pct_sem_acessibilidade`.
2. WHEN uma requisição `GET /api/v1/bairros/{id}/resumo` é recebida, THE API SHALL retornar os indicadores agregados do bairro com os mesmos campos do resumo de município.
3. WHEN uma requisição `GET /api/v1/escolas/{id}` é recebida, THE API SHALL retornar o perfil completo da escola incluindo `infraestrutura`, `indicadores` por etapa de ensino, `endereco` e `localizacao`.
4. IF um identificador de entidade não existir no banco de dados, THEN THE API SHALL retornar HTTP 404 com mensagem descritiva.
5. THE API SHALL retornar os endpoints de resumo com tempo de resposta inferior a 300ms.

---

### Requisito 3: Endpoints Geoespaciais na API

**User Story:** Como desenvolvedor do frontend, quero endpoints que retornem dados geoespaciais em formato GeoJSON, para que o mapa do Observatório possa renderizar pontos e polígonos das entidades educacionais.

#### Critérios de Aceitação

1. WHEN uma requisição `GET /api/v1/geo/escolas?municipio_id={id}` é recebida, THE API SHALL retornar um `FeatureCollection` GeoJSON com pontos (`Point`) de todas as escolas do município, incluindo `escolaIdInep`, `escolaNome`, `dependenciaAdm` e indicadores-chave nas `properties`.
2. WHEN uma requisição `GET /api/v1/geo/municipios` é recebida, THE API SHALL retornar um `FeatureCollection` GeoJSON com os centróides (`Point`) de todos os municípios da PB e seus indicadores agregados nas `properties`.
3. WHEN uma requisição `GET /api/v1/geo/bairros?municipio_id={id}` é recebida, THE API SHALL retornar um `FeatureCollection` GeoJSON com os polígonos (`Polygon`) dos bairros do município e seus indicadores nas `properties`.
4. WHERE o parâmetro `bbox` (bounding box: `min_lng,min_lat,max_lng,max_lat`) for fornecido, THE API SHALL filtrar as features retornadas para aquelas que intersectam o bounding box informado.
5. IF um `municipio_id` inválido for fornecido nos endpoints geoespaciais, THEN THE API SHALL retornar HTTP 404 com mensagem descritiva.
6. THE API SHALL retornar os endpoints geoespaciais com tempo de resposta inferior a 1000ms para municípios com até 500 escolas.

---

### Requisito 4: Integração do Frontend com a API Real

**User Story:** Como usuário do Observatório, quero que os filtros em cascata, a busca e o painel de detalhes utilizem dados reais da API, para que as informações exibidas reflitam a situação educacional real da Paraíba.

#### Critérios de Aceitação

1. WHEN o Observatório é carregado com `NEXT_PUBLIC_API_BASE_URL` configurado, THE Frontend SHALL buscar a lista de estados da API e popular o filtro de Estado com dados reais.
2. WHEN o usuário seleciona um estado no filtro, THE Frontend SHALL buscar os municípios daquele estado na API e popular o filtro de Município.
3. WHEN o usuário seleciona um município no filtro, THE Frontend SHALL buscar os bairros daquele município na API e popular o filtro de Bairro.
4. WHILE `NEXT_PUBLIC_API_BASE_URL` não estiver configurado ou a API retornar erro, THE Frontend SHALL utilizar os dados mock como fallback sem exibir erro ao usuário.
5. WHEN a API retorna dados, THE Frontend SHALL substituir os dados mock pelos dados reais sem necessidade de recarregar a página.
6. THE Frontend SHALL exibir indicadores de carregamento (loading states) durante todas as requisições à API.
7. IF uma requisição à API falhar após 3 tentativas, THEN THE Frontend SHALL exibir uma mensagem de erro contextual e manter o último estado válido exibido.

---

### Requisito 5: Mapa Interativo com MapLibre

**User Story:** Como usuário do Observatório, quero visualizar escolas, bairros e municípios em um mapa real e interativo, para que eu possa explorar geograficamente os dados educacionais da Paraíba.

#### Critérios de Aceitação

1. THE Frontend SHALL renderizar um mapa interativo usando `react-map-gl` com tiles de mapa base (OpenStreetMap ou similar) centralizado na Paraíba.
2. WHEN a Camada_Ativa é `municipio`, THE Frontend SHALL renderizar os centróides dos municípios como pontos no mapa com os indicadores disponíveis.
3. WHEN a Camada_Ativa é `bairro` e um município está selecionado, THE Frontend SHALL renderizar os polígonos dos bairros daquele município no mapa.
4. WHEN a Camada_Ativa é `escola` e um município ou bairro está selecionado, THE Frontend SHALL renderizar os pontos das escolas no mapa.
5. WHEN o usuário clica em um ponto ou polígono no mapa, THE Frontend SHALL selecionar aquela entidade e abrir o Painel_de_Detalhes com suas informações.
6. WHEN uma entidade é selecionada no mapa, THE Frontend SHALL realizar auto-pan para centralizar a entidade selecionada na área visível do mapa, considerando o espaço ocupado pelo Painel_de_Detalhes.
7. THE Frontend SHALL ajustar automaticamente o zoom do mapa ao nível adequado para a Camada_Ativa selecionada (estado → município → bairro → escola).
8. IF os dados geoespaciais de uma camada não estiverem disponíveis, THEN THE Frontend SHALL exibir uma mensagem informativa no mapa e manter as outras camadas funcionais.

---

### Requisito 6: Simbologia Dinâmica no Mapa

**User Story:** Como analista de dados educacionais, quero que as cores e tamanhos dos pontos e polígonos no mapa variem conforme o indicador selecionado, para que eu possa identificar visualmente padrões e disparidades territoriais.

#### Critérios de Aceitação

1. THE Frontend SHALL exibir um seletor de indicador na interface do mapa com as opções disponíveis para a Camada_Ativa atual.
2. WHEN o usuário seleciona um indicador (ex.: `pct_com_internet`), THE Frontend SHALL atualizar a cor dos pontos/polígonos no mapa usando uma escala de cores contínua proporcional ao valor do indicador.
3. THE Frontend SHALL exibir uma legenda de cores no mapa indicando os valores mínimo e máximo do indicador selecionado para o conjunto de dados visível.
4. WHEN o indicador selecionado é alterado, THE Frontend SHALL atualizar a simbologia do mapa em menos de 500ms sem recarregar os dados geoespaciais.
5. WHILE nenhum indicador estiver selecionado, THE Frontend SHALL exibir todos os pontos/polígonos com a cor padrão da camada conforme definido em `LAYER_STYLES`.
6. THE Frontend SHALL aplicar simbologia dinâmica para os seguintes indicadores: `pct_com_internet`, `pct_com_biblioteca`, `pct_com_lab_informatica`, `pct_sem_acessibilidade`, `total_matriculas`.

---

### Requisito 7: Painel de Detalhes — Perfil de Escola

**User Story:** Como usuário do Observatório, quero ver o perfil completo de uma escola ao selecioná-la no mapa ou na lista, para que eu possa analisar sua infraestrutura, indicadores educacionais e localização.

#### Critérios de Aceitação

1. WHEN o usuário seleciona uma escola, THE Painel_de_Detalhes SHALL exibir: nome, município, dependência administrativa, tipo de localização e endereço completo.
2. THE Painel_de_Detalhes SHALL exibir os indicadores de infraestrutura da escola em formato de lista com ícones: internet, biblioteca, laboratório de informática, acessibilidade PCD, quadra esportiva, laboratório de ciências.
3. THE Painel_de_Detalhes SHALL exibir os indicadores educacionais por etapa de ensino disponíveis: taxa de aprovação, taxa de reprovação e alunos por turma para Educação Infantil, Fundamental Anos Iniciais, Fundamental Anos Finais e Ensino Médio.
4. WHEN um indicador de etapa de ensino não estiver disponível para a escola, THE Painel_de_Detalhes SHALL exibir "Não disponível" para aquele campo, sem omitir a etapa.
5. THE Painel_de_Detalhes SHALL exibir um mini-mapa ou indicação de localização da escola dentro do município.
6. IF os dados completos da escola não puderem ser carregados, THEN THE Painel_de_Detalhes SHALL exibir os dados básicos disponíveis e uma mensagem indicando que detalhes adicionais não estão disponíveis.

---

### Requisito 8: Painel de Detalhes — Perfil de Município

**User Story:** Como usuário do Observatório, quero ver os indicadores educacionais agregados de um município ao selecioná-lo no mapa, para que eu possa comparar a situação educacional entre municípios da Paraíba.

#### Critérios de Aceitação

1. WHEN o usuário seleciona um município, THE Painel_de_Detalhes SHALL exibir: nome do município, total de escolas e total de matrículas.
2. THE Painel_de_Detalhes SHALL exibir os percentuais de infraestrutura do município: `pct_com_internet`, `pct_com_biblioteca`, `pct_com_lab_informatica` e `pct_sem_acessibilidade`, cada um com barra de progresso visual.
3. THE Painel_de_Detalhes SHALL exibir um botão "Ver escolas deste município" que altera a Camada_Ativa para `escola` e aplica o filtro de município correspondente.
4. IF os dados de resumo do município não estiverem disponíveis, THEN THE Painel_de_Detalhes SHALL exibir os dados básicos (nome, total de escolas) e indicar que os indicadores detalhados não estão disponíveis.

---

### Requisito 9: Painel de Detalhes — Perfil de Bairro

**User Story:** Como usuário do Observatório, quero ver os indicadores educacionais de um bairro ao selecioná-lo no mapa, para que eu possa analisar disparidades intramunicipais nas cidades com dados de bairro disponíveis.

#### Critérios de Aceitação

1. WHEN o usuário seleciona um bairro, THE Painel_de_Detalhes SHALL exibir: nome do bairro, município ao qual pertence, total de escolas e total de matrículas no bairro.
2. THE Painel_de_Detalhes SHALL exibir os percentuais de infraestrutura do bairro com barras de progresso: `pct_com_internet`, `pct_com_biblioteca`, `pct_com_lab_informatica` e `pct_sem_acessibilidade`.
3. THE Painel_de_Detalhes SHALL exibir um botão "Ver escolas deste bairro" que altera a Camada_Ativa para `escola` e aplica o filtro de bairro correspondente.
4. THE Painel_de_Detalhes SHALL exibir uma nota informativa indicando que dados de bairro estão disponíveis apenas para os 12 municípios com delimitação oficial IBGE.
5. IF os dados de bairro não estiverem disponíveis para a entidade selecionada, THEN THE Painel_de_Detalhes SHALL exibir os dados do Setor_Censitario correspondente como alternativa, indicando claramente a diferença.

---

### Requisito 10: Busca Integrada com Dados Reais

**User Story:** Como usuário do Observatório, quero buscar escolas, bairros e municípios pelo nome na barra de busca, para que eu possa navegar rapidamente para a entidade de interesse sem usar os filtros em cascata.

#### Critérios de Aceitação

1. WHEN o usuário digita 2 ou mais caracteres na barra de busca, THE Frontend SHALL exibir sugestões de autocompletar com escolas, bairros e municípios que correspondam ao texto digitado.
2. THE Frontend SHALL buscar sugestões na API usando o endpoint `GET /api/v1/busca/sugestoes?q={texto}` quando a API estiver disponível.
3. WHILE a API não estiver disponível, THE Frontend SHALL realizar a busca fuzzy localmente nos dados mock usando `fuse.js`.
4. WHEN o usuário seleciona uma sugestão do tipo `municipio`, THE Frontend SHALL aplicar o filtro de município correspondente e centralizar o mapa naquele município.
5. WHEN o usuário seleciona uma sugestão do tipo `bairro`, THE Frontend SHALL aplicar os filtros de município e bairro correspondentes e centralizar o mapa naquele bairro.
6. WHEN o usuário seleciona uma sugestão do tipo `escola`, THE Frontend SHALL aplicar os filtros correspondentes, centralizar o mapa na escola e abrir o Painel_de_Detalhes com o perfil da escola.
7. THE Frontend SHALL exibir no máximo 8 sugestões por busca, ordenadas por relevância.
8. IF a busca não retornar resultados, THEN THE Frontend SHALL exibir a mensagem "Nenhum resultado encontrado para '{termo}'" na lista de sugestões.

---

### Requisito 11: Endpoint de Busca de Sugestões na API

**User Story:** Como desenvolvedor do frontend, quero um endpoint de busca que retorne sugestões de autocompletar para escolas, bairros e municípios, para que a busca do Observatório funcione com dados reais.

#### Critérios de Aceitação

1. WHEN uma requisição `GET /api/v1/busca/sugestoes?q={texto}` é recebida com `texto` de 2 ou mais caracteres, THE API SHALL retornar uma lista de sugestões com `id`, `kind` (`municipio`, `bairro` ou `escola`), `label` e `subtitle`.
2. THE API SHALL buscar correspondências nos nomes de municípios, bairros e escolas usando busca textual case-insensitive e tolerante a acentuação.
3. THE API SHALL retornar no máximo 10 sugestões por requisição, priorizando correspondências exatas antes de correspondências parciais.
4. WHERE o parâmetro `municipio_id` for fornecido, THE API SHALL restringir as sugestões de bairros e escolas ao município informado.
5. IF o parâmetro `q` tiver menos de 2 caracteres, THEN THE API SHALL retornar HTTP 400 com mensagem "O termo de busca deve ter pelo menos 2 caracteres".
6. THE API SHALL retornar o endpoint de busca com tempo de resposta inferior a 200ms.

---

### Requisito 12: Ajustes de UX na Sidebar

**User Story:** Como usuário do Observatório, quero uma sidebar mais larga e com comportamento de colapso aprimorado, para que os indicadores e filtros sejam legíveis e eu possa ampliar a área do mapa quando necessário.

#### Critérios de Aceitação

1. THE Frontend SHALL exibir a Sidebar com largura mínima de 320px no estado expandido para garantir legibilidade dos nomes de municípios e valores de indicadores.
2. WHEN o usuário clica no botão de colapso da Sidebar, THE Frontend SHALL recolher a Sidebar para uma largura de 48px exibindo apenas ícones de ação.
3. WHEN a Sidebar está recolhida e o usuário clica no ícone de expansão, THE Frontend SHALL expandir a Sidebar para a largura anterior com animação de transição suave (duração entre 150ms e 300ms).
4. THE Frontend SHALL persistir o estado de colapso/expansão da Sidebar no `localStorage` entre sessões.
5. WHILE a Sidebar está recolhida, THE Frontend SHALL manter acessíveis via ícone os controles de: camada ativa, busca e acesso ao painel de filtros.

---

### Requisito 13: Indicadores de Qualidade de Dados

**User Story:** Como usuário do Observatório, quero saber quando os dados de uma entidade têm cobertura parcial ou limitações conhecidas, para que eu possa interpretar corretamente os indicadores exibidos.

#### Critérios de Aceitação

1. WHEN o Painel_de_Detalhes exibe dados de um bairro, THE Frontend SHALL indicar visualmente se os dados provêm de bairro oficial IBGE ou de Setor_Censitario como proxy.
2. WHEN um indicador educacional de escola não estiver disponível (valor `null` ou ausente), THE Frontend SHALL exibir "Não disponível" em vez de zero ou campo vazio.
3. THE Frontend SHALL exibir o ano de referência dos dados (`anoReferencia`) no Painel_de_Detalhes de escola.
4. WHEN a cobertura de dados de bairro for exibida, THE Frontend SHALL informar que dados de bairro estão disponíveis para 12 dos 223 municípios da Paraíba.

---

### Requisito 14: Ícones de Informação nos Indicadores

**User Story:** Como usuário do Observatório, quero ver uma definição clara de cada indicador ao passar o cursor sobre ele, para que eu possa interpretar corretamente os dados exibidos no mapa e no painel de detalhes sem precisar consultar documentação externa.

#### Critérios de Aceitação

1. THE Frontend SHALL exibir um ícone de informação (ícone de interrogação ou "i") ao lado de cada Indicador exibido no mapa e no Painel_de_Detalhes.
2. WHEN o usuário passa o cursor sobre o ícone de informação de um Indicador, THE Frontend SHALL exibir um Tooltip_Indicador com a definição textual completa daquele indicador.
3. THE Frontend SHALL exibir Tooltip_Indicador para todos os indicadores educacionais disponíveis, incluindo: `pct_com_internet` ("Percentual de escolas do município com acesso à internet banda larga"), `pct_com_biblioteca` ("Percentual de escolas do município com biblioteca"), `pct_com_lab_informatica` ("Percentual de escolas do município com laboratório de informática"), `pct_sem_acessibilidade` ("Percentual de escolas do município sem nenhum recurso de acessibilidade para PCD") e `total_matriculas` ("Soma de matrículas ativas em Educação Infantil, Ensino Fundamental e Ensino Médio").
4. WHEN o Tooltip_Indicador é exibido, THE Frontend SHALL posicioná-lo de forma a não obstruir o valor do indicador nem ultrapassar os limites da área visível da tela.
5. THE Frontend SHALL exibir os Tooltip_Indicador também nos indicadores do seletor de simbologia dinâmica do mapa.
6. IF o dispositivo do usuário não suportar eventos de hover (ex.: toque em dispositivo móvel), THEN THE Frontend SHALL exibir o Tooltip_Indicador ao tocar no ícone de informação correspondente.

---

### Requisito 15: Ranking de Municípios por Indicador

**User Story:** Como analista de dados educacionais, quero ver um ranking dos municípios ordenados por um indicador selecionado, para que eu possa identificar rapidamente quais municípios têm melhor ou pior desempenho em cada dimensão educacional.

#### Critérios de Aceitação

1. THE Frontend SHALL disponibilizar uma seção de Ranking acessível a partir da interface principal do Observatório, exibindo a lista de municípios ordenados pelo Indicador atualmente selecionado.
2. WHEN o usuário seleciona um Indicador no seletor de simbologia, THE Frontend SHALL atualizar o Ranking para refletir a ordenação por aquele indicador.
3. THE Frontend SHALL exibir o Ranking em ordem decrescente por padrão para indicadores de disponibilidade (ex.: `pct_com_internet`) e em ordem crescente para indicadores de carência (ex.: `pct_sem_acessibilidade`).
4. THE Frontend SHALL exibir no Ranking: posição, nome do município, valor do indicador e barra de progresso visual proporcional ao valor máximo do conjunto.
5. WHERE dados de bairro estiverem disponíveis para o município selecionado no filtro, THE Frontend SHALL exibir também um Ranking de bairros daquele município pelo indicador selecionado.
6. WHEN o usuário clica em um município no Ranking, THE Frontend SHALL aplicar o filtro de município correspondente e centralizar o mapa naquele município.
7. THE Frontend SHALL exibir o total de municípios ranqueados e o indicador de referência no cabeçalho da seção de Ranking.
8. IF o valor de um indicador não estiver disponível para um município, THEN THE Frontend SHALL posicionar aquele município ao final do Ranking com o valor exibido como "Sem dados".

---

### Requisito 16: Seção "Feito por Quem" na Landing Page

**User Story:** Como visitante da landing page do ODIN, quero conhecer a equipe e os projetos relacionados do LEMA/UFPB, para que eu possa avaliar a credibilidade do produto e descobrir outros trabalhos do laboratório.

#### Critérios de Aceitação

1. THE Frontend SHALL exibir na landing page uma seção "Feito por quem" com informações sobre o LEMA/UFPB, incluindo nome completo do laboratório, vínculo institucional com a UFPB e descrição resumida da missão do laboratório.
2. THE Frontend SHALL exibir na seção "Feito por quem" cards ou entradas para outros projetos do LEMA/UFPB relevantes, incluindo o ODS_Racial, com nome do projeto, descrição breve e link externo para acesso.
3. THE Frontend SHALL exibir na seção "Feito por quem" os nomes dos membros da equipe responsáveis pelo ODIN, organizados por papel (ex.: pesquisadores, desenvolvedores, orientadores).
4. WHEN o usuário clica no link de um projeto relacionado na seção "Feito por quem", THE Frontend SHALL abrir o link em uma nova aba do navegador.
5. THE Frontend SHALL exibir a seção "Feito por quem" com contraste de texto suficiente para atender ao nível AA das diretrizes WCAG 2.1.

---

### Requisito 17: Compartilhamento de Estado Atual via Link

**User Story:** Como usuário do Observatório, quero copiar um link que reproduz exatamente o estado atual da minha visualização, para que eu possa compartilhar com colegas ou retomar a análise posteriormente sem precisar reconfigurar os filtros e o mapa manualmente.

#### Critérios de Aceitação

1. THE Frontend SHALL exibir um botão "Compartilhar" acessível na interface principal do Observatório.
2. WHEN o usuário clica no botão "Compartilhar", THE Frontend SHALL gerar uma URL contendo o Estado_Compartilhavel completo na query string, incluindo: filtros aplicados (estado, município, bairro), Camada_Ativa, indicador selecionado, nível de zoom do mapa e coordenadas do centro do mapa (latitude e longitude).
3. WHEN o usuário clica no botão "Compartilhar", THE Frontend SHALL copiar a URL gerada para a área de transferência do sistema operacional e exibir uma confirmação visual de que o link foi copiado.
4. WHEN o Observatório é carregado com parâmetros de Estado_Compartilhavel na query string, THE Frontend SHALL restaurar exatamente o estado descrito pelos parâmetros, incluindo filtros, camada, indicador, zoom e posição do mapa.
5. IF um parâmetro da query string contiver valor inválido ou não reconhecido, THEN THE Frontend SHALL ignorar aquele parâmetro e carregar o Observatório com o valor padrão correspondente, sem exibir erro ao usuário.
6. THE Frontend SHALL manter a sincronização bidirecional entre o Estado_Compartilhavel e a query string da URL durante toda a sessão, de forma que o botão "Voltar" do navegador restaure estados anteriores da visualização.

---

### Requisito 18: Filtros por Indicadores Socioeconômicos

**User Story:** Como pesquisador de equidade educacional, quero colorir o mapa por indicadores socioeconômicos do IBGE Censo 2022 enquanto navego pelos dados educacionais, para que eu possa identificar visualmente correlações entre condições socioeconômicas e infraestrutura escolar nos territórios da Paraíba.

#### Critérios de Aceitação

1. THE Frontend SHALL disponibilizar no seletor de simbologia dinâmica uma seção de indicadores socioeconômicos separada dos indicadores educacionais, com os seguintes Indicador_Socioeconomico disponíveis para o MVP: `pct_preta_parda`, `pct_criancas_0_9`, `pct_agua_rede_geral`, `pct_esgoto_rede_geral`, `taxa_analfabetismo_15_mais` e `total_populacao`.
2. WHEN o usuário seleciona um Indicador_Socioeconomico no seletor de simbologia, THE Frontend SHALL colorir os polígonos ou pontos da Camada_Ativa usando uma escala de cores contínua proporcional ao valor daquele indicador socioeconômico.
3. THE Frontend SHALL exibir Tooltip_Indicador para cada Indicador_Socioeconomico, com definições: `pct_preta_parda` ("Percentual da população que se autodeclara preta ou parda — IBGE Censo 2022"), `pct_criancas_0_9` ("Percentual da população com idade entre 0 e 9 anos — IBGE Censo 2022"), `pct_agua_rede_geral` ("Percentual de domicílios com abastecimento de água por rede geral — IBGE Censo 2022"), `pct_esgoto_rede_geral` ("Percentual de domicílios com esgotamento sanitário por rede geral — IBGE Censo 2022"), `taxa_analfabetismo_15_mais` ("Taxa de analfabetismo da população com 15 anos ou mais — IBGE Censo 2022") e `total_populacao` ("Total de residentes no território — IBGE Censo 2022").
4. THE API SHALL expor os Indicador_Socioeconomico nas mesmas granularidades geográficas dos indicadores educacionais, usando as collections `municipio_socioeconomico`, `setor_socioeconomico` e `bairro_socioeconomico` com as mesmas chaves de join (`municipioIdIbge`, `cd_setor`).
5. WHEN a Camada_Ativa é `municipio` e um Indicador_Socioeconomico está selecionado, THE Frontend SHALL colorir os centróides dos municípios pelo valor daquele indicador socioeconômico.
6. WHEN a Camada_Ativa é `bairro` e um Indicador_Socioeconomico está selecionado, THE Frontend SHALL colorir os polígonos dos bairros pelo valor daquele indicador socioeconômico.
7. THE Frontend SHALL exibir na legenda do mapa o rótulo "Indicador Socioeconômico — IBGE Censo 2022" quando um Indicador_Socioeconomico estiver ativo, diferenciando visualmente da legenda de indicadores educacionais.
8. IF os dados socioeconômicos de uma entidade não estiverem disponíveis, THEN THE Frontend SHALL exibir aquela entidade com cor neutra (cinza) e incluir nota na legenda indicando ausência de dados.

---

### Requisito 19: Tutorial Interativo de Boas-Vindas

**User Story:** Como novo usuário do Observatório, quero ser guiado pelas funcionalidades principais na minha primeira visita, para que eu possa entender rapidamente como usar o mapa, os filtros e o painel de detalhes sem precisar explorar por conta própria.

#### Critérios de Aceitação

1. WHEN o Observatório é carregado pela primeira vez em um navegador sem registro de visita anterior no `localStorage`, THE Frontend SHALL exibir automaticamente o Tutorial após o carregamento completo da interface.
2. THE Tutorial SHALL apresentar as funcionalidades principais em etapas sequenciais, cobrindo no mínimo: navegação no mapa (zoom e pan), seleção de camada ativa, uso dos filtros em cascata, seleção de indicador para simbologia dinâmica e abertura do Painel_de_Detalhes.
3. WHEN o usuário avança para a próxima etapa do Tutorial, THE Frontend SHALL destacar visualmente o elemento de interface correspondente àquela etapa (ex.: realce com overlay ou seta indicativa).
4. THE Tutorial SHALL exibir em cada etapa: título da funcionalidade, descrição breve de como usar e indicação de progresso (ex.: "Passo 2 de 5").
5. WHEN o usuário clica em "Pular tutorial" ou conclui a última etapa, THE Frontend SHALL registrar no `localStorage` que o Tutorial já foi exibido e fechar o Tutorial.
6. THE Frontend SHALL exibir um botão de ajuda permanente na interface do Observatório que, quando clicado, reinicia o Tutorial independentemente do registro no `localStorage`.
7. IF o usuário fechar o Tutorial antes de concluir todas as etapas, THEN THE Frontend SHALL registrar no `localStorage` que o Tutorial já foi exibido, evitando reexibição automática em visitas futuras.
8. THE Tutorial SHALL ser acessível via teclado, permitindo navegação entre etapas com as teclas de seta e fechamento com a tecla Escape.

---

### Requisito 20: Ranking com Filtro por Porte Municipal

**User Story:** Como analista de dados educacionais, quero filtrar o ranking de municípios por porte populacional, para que eu possa comparar municípios em condições estruturais similares e evitar distorções causadas pela diferença de escala entre a capital e municípios pequenos do interior.

#### Critérios de Aceitação

1. THE Frontend SHALL disponibilizar na seção de Ranking um seletor de porte municipal com as opções: "Todos os municípios", "Pequeno (até 10.000 hab.)", "Médio (10.001 a 50.000 hab.)" e "Grande (acima de 50.000 hab.)".
2. WHEN o usuário seleciona um porte no seletor, THE Frontend SHALL filtrar o Ranking para exibir apenas os municípios daquele porte, mantendo a ordenação pelo indicador selecionado.
3. THE Frontend SHALL exibir no cabeçalho do Ranking o total de municípios exibidos após o filtro de porte (ex.: "56 municípios — Porte Pequeno").
4. WHEN o filtro de porte é alterado, THE Frontend SHALL atualizar a barra de progresso de cada município no Ranking proporcionalmente ao valor máximo do subconjunto filtrado, não ao valor máximo global.
5. THE API SHALL incluir o campo `total_populacao` nas `properties` dos endpoints geoespaciais de municípios (`GET /api/v1/geo/municipios`) para que o frontend possa calcular o porte localmente sem requisição adicional.
6. WHERE o campo `total_populacao` não estiver disponível para um município, THE Frontend SHALL incluir aquele município apenas na opção "Todos os municípios", sem classificá-lo por porte.
7. IF o subconjunto filtrado por porte não contiver nenhum município com dados para o indicador selecionado, THEN THE Frontend SHALL exibir a mensagem "Nenhum município deste porte possui dados para o indicador selecionado".

---

### Requisito 21: Painel de Contexto Socioeconômico no Perfil de Município

**User Story:** Como pesquisador de equidade educacional, quero ver os indicadores socioeconômicos do IBGE Censo 2022 lado a lado com os indicadores educacionais no perfil de um município, para que eu possa identificar desequilíbrios entre infraestrutura escolar e condições de vida da população sem precisar alternar entre fontes externas.

#### Critérios de Aceitação

1. THE Painel_de_Detalhes de município SHALL exibir uma seção "Contexto Socioeconômico — IBGE Censo 2022" com os seguintes indicadores: `total_populacao`, `taxa_analfabetismo_15_mais`, `pct_agua_rede_geral`, `pct_esgoto_rede_geral`, `pct_lixo_coletado`, `pct_preta_parda`, `pct_criancas_0_9` e `pct_idosos_60_mais`.
2. THE Painel_de_Detalhes SHALL exibir a seção socioeconômica visualmente separada da seção de indicadores educacionais, com rótulo de fonte ("IBGE Censo Demográfico 2022") e ano de referência.
3. THE Frontend SHALL exibir Tooltip_Indicador para cada indicador socioeconômico da seção, com as mesmas definições já especificadas no Requisito 18.
4. WHEN os dados socioeconômicos de um município não estiverem disponíveis na API, THE Painel_de_Detalhes SHALL exibir a seção com a mensagem "Dados socioeconômicos não disponíveis para este município" sem ocultar a seção de indicadores educacionais.
5. THE API SHALL expor os indicadores socioeconômicos no endpoint `GET /api/v1/municipios/{id}/resumo`, adicionando o bloco `socioeconomico` ao payload existente com os campos: `total_populacao`, `taxa_analfabetismo_15_mais`, `pct_agua_rede_geral`, `pct_esgoto_rede_geral`, `pct_lixo_coletado`, `pct_preta_parda`, `pct_criancas_0_9`, `pct_idosos_60_mais` e `media_moradores_por_domicilio`.

---

### Requisito 22: Flags de Qualidade de Dados no ETL

**User Story:** Como usuário do Observatório, quero ser informado quando estou visualizando dados de municípios com características atípicas documentadas, para que eu não interprete erroneamente indicadores que parecem erros mas refletem a realidade daquele território.

#### Critérios de Aceitação

1. THE ETL SHALL calcular e persistir um campo `flags_qualidade` (array de strings) em cada documento de município no MongoDB, contendo zero ou mais das seguintes flags: `"municipio_indigena"`, `"sem_agua_encanada"`, `"alta_emigracao_masculina"`.
2. THE ETL SHALL atribuir a flag `"municipio_indigena"` aos municípios de Marcação, Baía da Traição e Carrapateira, cujo `pct_preta_parda` é atipicamente baixo por terem população majoritariamente indígena — não por erro de dados.
3. THE ETL SHALL atribuir a flag `"sem_agua_encanada"` a todo município com `pct_agua_rede_geral` igual a zero, indicando que o abastecimento ocorre por cisterna ou carro-pipa e que o valor zero não representa dado ausente.
4. THE ETL SHALL atribuir a flag `"alta_emigracao_masculina"` a municípios com `pct_responsavel_feminino` acima de 65%, indicando fenômeno de emigração masculina para trabalho — padrão documentado no sertão semiárido.
5. THE API SHALL incluir o campo `flags_qualidade` no payload do endpoint `GET /api/v1/municipios/{id}/resumo`.
6. WHEN o Painel_de_Detalhes exibe um município com `flags_qualidade` não vazio, THE Frontend SHALL exibir um aviso contextual para cada flag presente, com as seguintes mensagens: `"municipio_indigena"` → "Este município possui território indígena. O percentual de população preta/parda é naturalmente baixo por refletir composição racial distinta."; `"sem_agua_encanada"` → "Este município não possui rede de abastecimento de água. O valor 0% indica abastecimento por cisterna ou carro-pipa, não ausência de dados."; `"alta_emigracao_masculina"` → "Este município apresenta alta proporção de domicílios chefiados por mulheres, associada a emigração masculina para trabalho — fenômeno comum no sertão semiárido."
7. IF um município não possuir nenhuma flag, THEN THE Frontend SHALL omitir o bloco de avisos contextuais no Painel_de_Detalhes, sem exibir mensagem vazia.

---

### Requisito 23: Exportação de Dados por Entidade

**User Story:** Como pesquisador ou analista externo, quero exportar os dados de indicadores educacionais e socioeconômicos de municípios ou bairros em formato aberto, para que eu possa realizar análises próprias sem depender exclusivamente da interface do Observatório.

#### Critérios de Aceitação

1. THE Frontend SHALL exibir um botão "Exportar dados" no Painel_de_Detalhes de município e de bairro.
2. WHEN o usuário clica em "Exportar dados" no perfil de um município, THE Frontend SHALL baixar um arquivo CSV contendo todos os indicadores educacionais e socioeconômicos daquele município, com cabeçalho em português e coluna de fonte para cada indicador.
3. THE Frontend SHALL nomear o arquivo exportado seguindo o padrão `odin_{entidade}_{nome_municipio}_{ano}.csv` (ex.: `odin_municipio_joao_pessoa_2024.csv`).
4. THE API SHALL expor o endpoint `GET /api/v1/municipios/{id}/exportar?formato=csv` retornando o arquivo CSV com `Content-Type: text/csv` e header `Content-Disposition` adequado para download.
5. WHERE o parâmetro `formato=parquet` for fornecido no endpoint de exportação, THE API SHALL retornar o arquivo no formato Apache Parquet com `Content-Type: application/octet-stream`.
6. THE API SHALL incluir no arquivo exportado uma linha de metadados no cabeçalho do CSV (comentário iniciado com `#`) indicando: data de geração, fontes dos dados (INEP Censo Escolar 2024, IBGE Censo Demográfico 2022) e URL do Observatório.
7. IF o identificador de município ou bairro não existir, THEN THE API SHALL retornar HTTP 404 com mensagem descritiva, sem gerar arquivo vazio.
8. THE Frontend SHALL exibir também um botão "Exportar todos os municípios" na seção de Ranking, que aciona o endpoint `GET /api/v1/municipios/exportar?formato=csv` retornando os indicadores de todos os 223 municípios da Paraíba em um único arquivo.

---

### Requisito 24: Endpoint de Resumo Estadual com Agregação Ponderada

**User Story:** Como desenvolvedor do frontend, quero um endpoint que retorne indicadores agregados para o estado da Paraíba com ponderação correta pela população, para que totalizadores e médias estaduais exibidos no Observatório reflitam a realidade e não sejam distorcidos pelo peso igual de municípios de tamanhos muito diferentes.

#### Critérios de Aceitação

1. THE API SHALL expor o endpoint `GET /api/v1/estados/{id}/resumo` retornando indicadores agregados do estado com os campos: `total_municipios`, `total_escolas`, `total_matriculas`, `total_populacao` e os indicadores socioeconômicos ponderados pela população.
2. THE API SHALL calcular a `taxa_analfabetismo_15_mais` estadual como média ponderada pela `total_populacao` de cada município — não como média simples — dado que a média simples superestima a taxa real em aproximadamente 6,5 pontos percentuais para a Paraíba.
3. THE API SHALL calcular os indicadores de saneamento (`pct_agua_rede_geral`, `pct_esgoto_rede_geral`, `pct_lixo_coletado`) estaduais como médias ponderadas pelo `total_domicilios` de cada município.
4. THE API SHALL incluir no payload do resumo estadual o campo `metodo_agregacao` com valor `"ponderado_populacao"` para indicadores demográficos e `"ponderado_domicilios"` para indicadores domiciliares, permitindo que o frontend exiba a metodologia ao usuário.
5. THE API SHALL retornar o endpoint de resumo estadual com tempo de resposta inferior a 500ms.
6. WHEN o Painel_de_Detalhes ou qualquer componente do Frontend exibir indicadores agregados para o estado da Paraíba, THE Frontend SHALL buscar esses valores exclusivamente do endpoint `GET /api/v1/estados/{id}/resumo`, sem calcular médias localmente a partir dos dados de municípios.
