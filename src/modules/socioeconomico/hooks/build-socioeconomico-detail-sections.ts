import type { MapEntity } from "@/core/types/shell";
import type { ModuleDetailContribution, DetailSection } from "@/core/types/module";

function formatPct(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `${num.toFixed(1)}%`;
}

function formatNum(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num.toLocaleString("pt-BR");
}

export function buildSocioeconomicoDetailSections(
  entity: MapEntity,
): ModuleDetailContribution | null {
  if (entity.kind === "escola") return null;

  const geoProps = (entity.data as unknown as Record<string, unknown>).geoProps as
    | Record<string, unknown>
    | undefined;
  const socio = geoProps?.socioeconomico as Record<string, unknown> | undefined;
  if (!socio) return null;

  const populacao = socio.populacao as Record<string, unknown> | undefined;
  const saneamento = socio.saneamento as Record<string, unknown> | undefined;
  const raca = socio.raca as Record<string, unknown> | undefined;
  const estruturaEtaria = socio.estruturaEtaria as Record<string, unknown> | undefined;
  const educacaoPopulacao = socio.educacaoPopulacao as Record<string, unknown> | undefined;
  const familia = socio.familia as Record<string, unknown> | undefined;
  const mortalidade = socio.mortalidade as Record<string, unknown> | undefined;
  const habitacao = socio.habitacao as Record<string, unknown> | undefined;
  const genero = socio.genero as Record<string, unknown> | undefined;

  const metrics = [
    ...(populacao?.total != null ? [{ label: "População", value: formatNum(populacao.total), description: "População residente total" }] : []),
    ...(educacaoPopulacao?.taxaAnalfabetismo15Mais != null ? [{ label: "Analfabetismo 15+", value: formatPct(educacaoPopulacao.taxaAnalfabetismo15Mais), description: "Taxa de analfabetismo — 15 anos ou mais" }] : []),
  ];

  const sections: DetailSection[] = [];

  // Saneamento
  const saneamentoRows = [
    ...(saneamento?.pctAguaRedeGeral != null ? [{ label: "Água rede geral", value: formatPct(saneamento.pctAguaRedeGeral), description: "Domicílios com água por rede geral" }] : []),
    ...(saneamento?.pctEsgotoRedeGeral != null ? [{ label: "Esgoto rede geral", value: formatPct(saneamento.pctEsgotoRedeGeral), description: "Domicílios com esgoto por rede geral" }] : []),
    ...(saneamento?.pctLixoColetado != null ? [{ label: "Lixo coletado", value: formatPct(saneamento.pctLixoColetado), description: "Domicílios com coleta de lixo" }] : []),
    ...(saneamento?.pctAguaNaoEncanada != null ? [{ label: "Sem água encanada", value: formatPct(saneamento.pctAguaNaoEncanada), description: "Domicílios sem água encanada" }] : []),
    ...(saneamento?.pctAguaInadequada != null ? [{ label: "Água inadequada", value: formatPct(saneamento.pctAguaInadequada), description: "Domicílios com abastecimento inadequado" }] : []),
    ...(saneamento?.pctEsgotoInadequado != null ? [{ label: "Esgoto inadequado", value: formatPct(saneamento.pctEsgotoInadequado), description: "Domicílios com esgoto inadequado" }] : []),
    ...(saneamento?.pctLixoInadequado != null ? [{ label: "Lixo inadequado", value: formatPct(saneamento.pctLixoInadequado), description: "Domicílios com destinação inadequada de lixo" }] : []),
    ...(saneamento?.pctDomSemBanheiro != null ? [{ label: "Sem banheiro", value: formatPct(saneamento.pctDomSemBanheiro), description: "Domicílios sem banheiro" }] : []),
  ];
  if (saneamentoRows.length > 0) {
    sections.push({ title: "Saneamento básico", source: "IBGE Censo 2022", rows: saneamentoRows });
  }

  // Gênero
  const generoRows = [
    ...(genero?.pctPopMasculina != null ? [{ label: "Pop. masculina", value: formatPct(genero.pctPopMasculina), description: "Percentual do sexo masculino" }] : []),
    ...(genero?.pctPopFeminina != null ? [{ label: "Pop. feminina", value: formatPct(genero.pctPopFeminina), description: "Percentual do sexo feminino" }] : []),
  ];
  if (generoRows.length > 0) {
    sections.push({ title: "Gênero", source: "IBGE Censo 2022", rows: generoRows, defaultOpen: false });
  }

  // Perfil demográfico
  const demografiaRows = [
    ...(raca?.pctPretaParda != null ? [{ label: "Pop. preta/parda", value: formatPct(raca.pctPretaParda), description: "Percentual preta ou parda" }] : []),
    ...(raca?.pctBranca != null ? [{ label: "Pop. branca", value: formatPct(raca.pctBranca), description: "Percentual branca" }] : []),
    ...(raca?.pctIndigena != null ? [{ label: "Pop. indígena", value: formatPct(raca.pctIndigena), description: "Percentual indígena" }] : []),
    ...(estruturaEtaria?.pctCriancas0a9 != null ? [{ label: "Crianças 0–9", value: formatPct(estruturaEtaria.pctCriancas0a9), description: "Percentual 0 a 9 anos" }] : []),
    ...(estruturaEtaria?.pctJovens15a29 != null ? [{ label: "Jovens 15–29", value: formatPct(estruturaEtaria.pctJovens15a29), description: "Percentual 15 a 29 anos" }] : []),
    ...(estruturaEtaria?.pctAdultos30a59 != null ? [{ label: "Adultos 30–59", value: formatPct(estruturaEtaria.pctAdultos30a59), description: "Percentual 30 a 59 anos" }] : []),
    ...(estruturaEtaria?.pctIdosos60Mais != null ? [{ label: "Idosos 60+", value: formatPct(estruturaEtaria.pctIdosos60Mais), description: "Percentual 60 anos ou mais" }] : []),
    ...(estruturaEtaria?.razaoDependencia != null ? [{ label: "Razão de dependência", value: formatPct(estruturaEtaria.razaoDependencia), description: "Razão entre pop. dependente e pop. em idade ativa" }] : []),
    ...(populacao?.totalDomicilios != null ? [{ label: "Total de domicílios", value: formatNum(populacao.totalDomicilios), description: "Domicílios recenseados" }] : []),
    ...(familia?.pctResponsavelFeminino != null ? [{ label: "Chefes femininas", value: formatPct(familia.pctResponsavelFeminino), description: "Domicílios com responsável feminino" }] : []),
  ];
  if (demografiaRows.length > 0) {
    sections.push({ title: "Perfil demográfico", source: "IBGE Censo 2022", rows: demografiaRows, defaultOpen: false });
  }

  // Habitação
  const habitacaoRows = [
    ...(habitacao?.pctDomImprovisado != null ? [{ label: "Dom. improvisados", value: formatPct(habitacao.pctDomImprovisado), description: "Domicílios em estruturas improvisadas" }] : []),
    ...(habitacao?.pctDomSuperlotado != null ? [{ label: "Dom. superlotados", value: formatPct(habitacao.pctDomSuperlotado), description: "Mais de 3 moradores por dormitório" }] : []),
    ...(habitacao?.pctDomUnipessoal != null ? [{ label: "Dom. unipessoais", value: formatPct(habitacao.pctDomUnipessoal), description: "Domicílios com 1 morador" }] : []),
    ...(habitacao?.pctDomTipoCasa != null ? [{ label: "Tipo casa", value: formatPct(habitacao.pctDomTipoCasa), description: "Domicílios tipo casa" }] : []),
    ...(habitacao?.pctDomTipoApto != null ? [{ label: "Tipo apartamento", value: formatPct(habitacao.pctDomTipoApto), description: "Domicílios tipo apartamento" }] : []),
    ...(habitacao?.pctDomDegradado != null ? [{ label: "Degradado/inacabado", value: formatPct(habitacao.pctDomDegradado), description: "Domicílios degradados" }] : []),
  ];
  if (habitacaoRows.length > 0) {
    sections.push({ title: "Habitação", source: "IBGE Censo 2022", rows: habitacaoRows, defaultOpen: false });
  }

  // Mortalidade
  const mortalidadeRows = [
    ...(mortalidade?.totalObitosDomicilios != null ? [{ label: "Óbitos registrados", value: formatNum(mortalidade.totalObitosDomicilios), description: "Óbitos em domicílios recenseados" }] : []),
    ...(mortalidade?.obitosInfantis0a4 != null ? [{ label: "Óbitos infantis (0–4)", value: formatNum(mortalidade.obitosInfantis0a4), description: "Óbitos de crianças 0 a 4 anos" }] : []),
  ];
  if (mortalidadeRows.length > 0) {
    sections.push({ title: "Mortalidade", source: "IBGE Censo 2022", rows: mortalidadeRows, defaultOpen: false });
  }

  if (metrics.length === 0 && sections.length === 0) return null;

  return { metrics, sections };
}
