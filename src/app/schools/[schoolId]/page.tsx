import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSchoolDetail } from "@/modules/educacao/services/education-api";

type SchoolPageProps = {
  params: Promise<{ schoolId: string }>;
};

function formatBoolean(value: boolean | undefined) {
  if (value === undefined) return "—";
  return value ? "Sim" : "Não";
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPct(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function formatHoras(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}h`;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 py-2 last:border-b-0 dark:border-zinc-800">
      <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
      <strong className="text-right text-sm text-zinc-900 dark:text-zinc-100">
        {value}
      </strong>
    </div>
  );
}

type EtapaIndicadores = {
  alunosPorTurma?: number | null;
  taxaAprovacao?: number | null;
  taxaReprovacao?: number | null;
  horasAulaDiarias?: number | null;
  tnr?: number | null;
};

export default async function SchoolPage({ params }: SchoolPageProps) {
  const { schoolId } = await params;
  const school = await fetchSchoolDetail(schoolId);

  if (!school) {
    notFound();
  }

  const totalAlunos = school.matriculas?.totalAlunos;
  const localizacao = school.localizacao?.coordinates;
  const endereco = school.endereco;
  const infraestrutura = school.infraestrutura;
  const matriculas = school.matriculas;

  const etapas: Array<[string, EtapaIndicadores | undefined]> = [
    ["Educação infantil", school.indicadores?.educacaoInfantil],
    ["Fund. anos iniciais", school.indicadores?.fundamentalAnosIniciais],
    ["Fund. anos finais", school.indicadores?.fundamentalAnosFinais],
    ["Ensino médio", school.indicadores?.ensinoMedio],
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.12),_transparent_40%),linear-gradient(180deg,_#fafafa,_#f4f7fb)] text-zinc-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.15),_transparent_40%),linear-gradient(180deg,_#020617,_#0f172a)] dark:text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">

        <header className="rounded-3xl border border-zinc-200/70 bg-white/85 p-5 shadow-lg shadow-cyan-500/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                Escola
              </p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
                {school.escola_nome}
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {school.municipio_nome} · {school.estado_sigla} · {school.dependencia_adm} · {school.tipo_localizacao}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/observatorio"
                className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Voltar ao mapa
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">

          <div className="grid auto-rows-min gap-4">

            <SectionCard title="Resumo">
              <FieldRow label="INEP" value={String(school.escola_id_inep)} />
              <FieldRow label="IBGE do município" value={school.municipio_id_ibge} />
              <FieldRow label="Total de alunos" value={formatNumber(totalAlunos)} />
              <FieldRow label="Ano referência" value={school.indicadores?.anoReferencia ?? "—"} />
            </SectionCard>

            {matriculas && (
              <SectionCard title="Matrículas por etapa">
                {matriculas.totalAlunos != null && matriculas.totalAlunos > 0 && (
                  <FieldRow label="Total (censo)" value={formatNumber(matriculas.totalAlunos)} />
                )}
                {matriculas.educacaoInfantil != null && matriculas.educacaoInfantil > 0 && (
                  <FieldRow label="Educação infantil" value={formatNumber(matriculas.educacaoInfantil)} />
                )}
                {matriculas.educacaoInfantilCreche != null && matriculas.educacaoInfantilCreche > 0 && (
                  <FieldRow label="Creche" value={formatNumber(matriculas.educacaoInfantilCreche)} />
                )}
                {matriculas.educacaoInfantilPreEscola != null && matriculas.educacaoInfantilPreEscola > 0 && (
                  <FieldRow label="Pré-escola" value={formatNumber(matriculas.educacaoInfantilPreEscola)} />
                )}
                {matriculas.fundamentalTotal != null && matriculas.fundamentalTotal > 0 && (
                  <FieldRow label="Fundamental (total)" value={formatNumber(matriculas.fundamentalTotal)} />
                )}
                {matriculas.fundamentalAnosIniciais != null && matriculas.fundamentalAnosIniciais > 0 && (
                  <FieldRow label="Fund. anos iniciais" value={formatNumber(matriculas.fundamentalAnosIniciais)} />
                )}
                {matriculas.fundamentalAnosFinais != null && matriculas.fundamentalAnosFinais > 0 && (
                  <FieldRow label="Fund. anos finais" value={formatNumber(matriculas.fundamentalAnosFinais)} />
                )}
                {matriculas.ensinoMedio != null && matriculas.ensinoMedio > 0 && (
                  <FieldRow label="Ensino médio" value={formatNumber(matriculas.ensinoMedio)} />
                )}
                {matriculas.eja != null && matriculas.eja > 0 && (
                  <FieldRow label="EJA" value={formatNumber(matriculas.eja)} />
                )}
              </SectionCard>
            )}

            <SectionCard title="Endereço">
              <FieldRow label="Bairro" value={endereco?.bairro ?? "—"} />
              <FieldRow label="Logradouro" value={endereco?.logradouro ?? "—"} />
              <FieldRow label="Número" value={endereco?.numero ?? "—"} />
              <FieldRow label="CEP" value={endereco?.cep ?? "—"} />
              <FieldRow label="Município" value={endereco?.municipio ?? school.municipio_nome} />
              <FieldRow label="UF" value={endereco?.uf ?? school.estado_sigla} />
            </SectionCard>

            <SectionCard title="Indicadores">
              {etapas.map(([label, etapa]) => (
                <div key={label} className="mb-3 last:mb-0">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {label}
                  </p>
                  <FieldRow label="Alunos/turma" value={formatNumber(etapa?.alunosPorTurma)} />
                  <FieldRow label="Aprovação" value={formatPct(etapa?.taxaAprovacao)} />
                  <FieldRow label="Reprovação" value={formatPct(etapa?.taxaReprovacao)} />
                  <FieldRow label="Horas/dia" value={formatHoras(etapa?.horasAulaDiarias)} />
                </div>
              ))}
            </SectionCard>

          </div>

          <div className="grid auto-rows-min gap-4">

            <SectionCard title="Infraestrutura — Espaços">
              <FieldRow label="Salas utilizadas" value={infraestrutura?.salas?.utilizadas ?? "—"} />
              <FieldRow label="Salas climatizadas" value={infraestrutura?.salas?.climatizadas ?? "—"} />
              <FieldRow label="Salas acessíveis" value={infraestrutura?.salas?.acessiveis ?? "—"} />
              <FieldRow label="Biblioteca" value={formatBoolean(infraestrutura?.possuiBiblioteca)} />
              <FieldRow label="Quadra de esportes" value={formatBoolean(infraestrutura?.possuiQuadraEsportes)} />
              <FieldRow label="Refeitório" value={formatBoolean(infraestrutura?.possuiRefeitorio)} />
              <FieldRow label="Pátio coberto" value={formatBoolean(infraestrutura?.possuiPatioCoberto)} />
              <FieldRow label="Lab. informática" value={formatBoolean(infraestrutura?.possuiLaboratorioInformatica)} />
              <FieldRow label="Lab. ciências" value={formatBoolean(infraestrutura?.possuiLaboratorioCiencias)} />
              <FieldRow label="Acessibilidade PCD" value={formatBoolean(infraestrutura?.possuiAcessibilidadePcd)} />
              <FieldRow label="Esgoto rede pública" value={formatBoolean(infraestrutura?.possuiEsgotoRedePublica)} />
              <FieldRow label="Coleta de lixo" value={formatBoolean(infraestrutura?.possuiColetaLixo)} />
            </SectionCard>

            <SectionCard title="Infraestrutura — Conectividade">
              <FieldRow label="Internet" value={formatBoolean(infraestrutura?.internet?.possuiInternet)} />
              <FieldRow label="Para alunos" value={formatBoolean(infraestrutura?.internet?.internetParaAlunos)} />
              <FieldRow label="Administrativa" value={formatBoolean(infraestrutura?.internet?.internetAdministrativa)} />
            </SectionCard>

            {infraestrutura?.equipamentos && (
              <SectionCard title="Infraestrutura — Equipamentos">
                <FieldRow label="Desktop (aluno)" value={formatBoolean(infraestrutura.equipamentos.desktopAluno)} />
                <FieldRow label="Notebook (aluno)" value={formatBoolean(infraestrutura.equipamentos.computadorPortatilAluno)} />
                <FieldRow label="Tablet (aluno)" value={formatBoolean(infraestrutura.equipamentos.tabletAluno)} />
                <FieldRow label="Multimídia" value={formatBoolean(infraestrutura.equipamentos.multimidia)} />
                <FieldRow label="Lousa digital" value={formatBoolean(infraestrutura.equipamentos.lousaDigital)} />
                <FieldRow label="Impressora" value={formatBoolean(infraestrutura.equipamentos.impressora)} />
              </SectionCard>
            )}

            <SectionCard title="Localização">
              <FieldRow label="Longitude" value={localizacao?.[0]?.toFixed(6) ?? "—"} />
              <FieldRow label="Latitude" value={localizacao?.[1]?.toFixed(6) ?? "—"} />
              <FieldRow label="Dependência" value={school.dependencia_adm} />
              <FieldRow label="Tipo" value={school.tipo_localizacao} />
            </SectionCard>

          </div>
        </section>
      </div>
    </main>
  );
}