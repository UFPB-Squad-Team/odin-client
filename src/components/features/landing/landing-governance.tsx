import { PageContainer } from "@/components/layout/page-container";

const GOVERNANCE_POINTS = [
  "Fontes públicas e rastreáveis",
  "Atualização periódica e versionamento",
  "Critérios transparentes de integração",
  "Compromisso com privacidade e ética",
] as const;

export function LandingGovernance() {
  return (
    <section id="governanca" className="py-14 sm:py-20">
      <PageContainer>
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-300/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-7">
            <p id="tour-governanca" className="text-xs uppercase tracking-[0.16em] text-cyan-500 dark:text-cyan-400">
              Governança de dados
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Confiabilidade para decisão pública.
            </h2>
            <p className="mt-3 text-zinc-700 dark:text-zinc-300">
              O ODIN segue uma base de governança para garantir qualidade,
              consistência e transparência no uso dos dados territoriais.
            </p>

            <ul className="mt-5 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              {GOVERNANCE_POINTS.map((point) => (
                <li
                  key={point}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/70"
                >
                  • {point}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-cyan-300/70 bg-cyan-50 p-6 dark:border-cyan-900/50 dark:bg-cyan-950/30 sm:p-7">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
              Feito por quem
            </p>
            <h3 id="tour-lema" className="mt-2 text-2xl font-semibold sm:text-3xl">
              Laboratório LEMA · UFPB
            </h3>
            <p className="mt-3 text-zinc-700 dark:text-zinc-300">
              Plataforma concebida e desenvolvida pelo Laboratório de Estudos e
              Modelagem Aplicada (LEMA), da Universidade Federal da Paraíba, com
              foco em dados públicos, ciência aplicada e impacto social.
            </p>
            <p className="mt-5 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Pesquisa, engenharia e produto integrados para apoiar gestão,
              planejamento e transparência no Nordeste.
            </p>
          </article>
        </div>
      </PageContainer>
    </section>
  );
}
