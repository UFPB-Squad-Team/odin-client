import { PageContainer } from "@/components/layout/page-container";

const FEATURES = [
  {
    icon: "map",
    title: "Mapa interativo do território",
    description:
      "Visualize dados sobre o mapa. Filtre por região, compare indicadores, identifique padrões territoriais.",
  },
  {
    icon: "filter",
    title: "Navegação hierárquica",
    description:
      "Explore do Estado até o bairro. Análise progressiva com mudança de contexto automática.",
  },
  {
    icon: "panel",
    title: "Painéis de contexto",
    description:
      "Clique no mapa e acesse um resumo completo com indicadores, histórico e comparações.",
  },
  {
    icon: "database",
    title: "Dados públicos, sem jargão",
    description:
      "Convertemos bases governamentais em informação clara. Sem siglas. Sem complexidade desnecessária.",
  },
] as const;

function FeatureIcon({ icon }: { icon: (typeof FEATURES)[number]["icon"] }) {
  if (icon === "map") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5Z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </svg>
    );
  }

  if (icon === "filter") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "panel") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M10 4v16" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <ellipse cx="12" cy="6" rx="6" ry="2.5" />
      <path d="M6 6v6.5C6 13.9 8.7 15 12 15s6-1.1 6-2.5V6" />
      <path d="M6 12.5V18c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5.5" />
    </svg>
  );
}

export function LandingBentoFeatures() {
  return (
    <section className="py-14 sm:py-20">
      <PageContainer>
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-500 dark:text-cyan-400">
            Capacidades do produto
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Visualização, análise e contexto em uma única experiência.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-zinc-300/90 bg-white p-6 transition hover:-translate-y-0.5 hover:border-cyan-400/70 dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <div className="inline-flex rounded-lg border border-cyan-300/70 bg-cyan-50 p-2 text-cyan-600 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-400">
                <FeatureIcon icon={feature.icon} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
