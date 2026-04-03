import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";

export function LandingCta() {
  return (
    <section className="py-16">
      <PageContainer>
        <div className="rounded-2xl border border-cyan-300/70 bg-cyan-50 p-6 dark:border-cyan-900/50 dark:bg-cyan-950/30 sm:p-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Pronto para explorar o ODIN em nível de detalhe real?
          </h2>
          <p className="mt-3 max-w-3xl text-zinc-700 dark:text-zinc-300">
            Comece com o módulo de Educação na Paraíba e acompanhe a evolução da
            plataforma para novos estados e novos módulos analíticos.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/observatorio"
              aria-label="Acessar observatório"
              className="inline-flex rounded-lg bg-cyan-500 px-5 py-3 font-medium text-zinc-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70"
            >
              Acessar Observatório
            </Link>
            <a
              href="#diferencial"
              aria-label="Abrir seção de visão de produto"
              className="inline-flex rounded-lg border border-cyan-500/40 px-5 py-3 font-medium text-zinc-900 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:text-zinc-100 dark:hover:bg-cyan-900/30"
            >
              Ver visão de produto
            </a>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
