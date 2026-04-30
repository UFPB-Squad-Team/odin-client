import Link from "next/link";
import { InteractiveNetworkBackground } from "@/components/features/landing/interactive-network-background";
import { OdinLogoPlaceholder } from "@/components/features/landing/odin-logo-placeholder";
import { PageContainer } from "@/components/layout/page-container";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32" id="tour-logo">
      <InteractiveNetworkBackground />

      <PageContainer className="relative z-10 flex flex-col justify-center">
        <div className="max-w-4xl">
          <div className="mb-6">
            <OdinLogoPlaceholder size="lg" showLabel={false} />
          </div>

          <p className="mb-5 inline-flex rounded-full border border-cyan-300/70 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300">
            Plataforma territorial para o Nordeste
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl [text-wrap:balance]">
            Dados territoriais que transformam políticas públicas.
          </h1>
          <p className="mt-6 max-w-3xl text-base text-zinc-700 dark:text-zinc-300 sm:text-lg">
            O MVP começa na Paraíba com Educação, mas o ODIN já nasce para
            escalar para novos estados e novos módulos. Visualize território,
            compare contextos e priorize ação pública com clareza.
          </p>

          <div className="mt-8 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-3">
            <p>• MVP operacional: Paraíba</p>
            <p>• Escalável para o Nordeste</p>
            <p>• Plataforma multi-módulo</p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <span className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium sm:text-sm dark:border-zinc-700 dark:bg-zinc-900">
              🧭 Análise territorial
            </span>
            <span className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium sm:text-sm dark:border-zinc-700 dark:bg-zinc-900">
              📍 Múltiplas camadas de dados
            </span>
            <span className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium sm:text-sm dark:border-zinc-700 dark:bg-zinc-900">
              🤝 Escalável para a região
            </span>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/observatorio"
              aria-label="Abrir módulo observatório"
              className="rounded-lg bg-cyan-500 px-6 py-3.5 font-semibold text-zinc-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 active:scale-95"
            >
              Acessar Observatório
            </Link>
            <a
              href="#diferencial"
              aria-label="Ir para seção de diferencial do produto"
              className="rounded-lg border border-zinc-300 px-6 py-3.5 font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Conhecer mais
            </a>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
