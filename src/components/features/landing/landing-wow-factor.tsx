import { PageContainer } from "@/components/layout/page-container";

export function LandingWowFactor() {
  return (
    <section id="diferencial" className="py-14 sm:py-20">
      <PageContainer>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-500 dark:text-cyan-400">
            Arquitetura escalável
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Pensado para o Nordeste, construído para evoluir.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-zinc-300/90 bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/70 dark:border-zinc-800 dark:bg-zinc-900/70">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-500 dark:text-cyan-400">
              MVP
            </p>
            <p className="mt-2 font-bold">Paraíba</p>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              Dados educacionais estruturados, validados e atualizados.
            </p>
          </article>

          <article className="rounded-xl border border-zinc-300/90 bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/70 dark:border-zinc-800 dark:bg-zinc-900/70">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-500 dark:text-cyan-400">
              Escalabilidade
            </p>
            <p className="mt-2 font-bold">Outros estados</p>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              Arquitetura pronta para integrar PE, CE, RN, BA e demais estados.
            </p>
          </article>

          <article className="rounded-xl border border-zinc-300/90 bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/70 dark:border-zinc-800 dark:bg-zinc-900/70">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-500 dark:text-cyan-400">
              Múltiplos módulos
            </p>
            <p className="mt-2 font-bold">Além de Educação</p>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              Saúde, Segurança, Infraestrutura: plataforma agnóstica de dados.
            </p>
          </article>

          <article className="rounded-xl border border-zinc-300/90 bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/70 dark:border-zinc-800 dark:bg-zinc-900/70">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-500 dark:text-cyan-400">
              Granularidade
            </p>
            <p className="mt-2 font-bold">Bairro em foco</p>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              Análise territorial que revela desigualdades invisíveis em nível
              municipal.
            </p>
          </article>
        </div>
      </PageContainer>
    </section>
  );
}
