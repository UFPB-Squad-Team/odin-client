import { PageContainer } from "@/components/layout/page-container";

const DATA_SOURCES = [
  {
    category: "Educação",
    sources: ["INEP", "CENSO ESCOLAR", "IDEB"],
    description: "Indicadores de fluxo, proficiência e infraestrutura escolar."
  },
  {
    category: "Socioeconômico",
    sources: ["IBGE CENSO", "INSE"],
    description: "Dados demográficos, renda e vulnerabilidade social."
  }
] as const;

export function LandingSources() {
  return (
    <section className="py-14 sm:py-20 border-t border-zinc-200 dark:border-zinc-900">
      <PageContainer>
        <div className="mb-12 text-center flex flex-col items-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Fontes e Metodologia</h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-2xl text-balance">
            A transparência é o pilar do ODIN. Utilizamos bases de dados oficiais e
            metodologias validadas para garantir a precisão de cada indicador.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {DATA_SOURCES.map((item) => (
            <div 
              key={item.category}
              className="flex flex-col w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[400px] rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{item.category}</h3>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400 flex-grow">
                {item.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {item.sources.map((source) => (
                  <span 
                    key={source}
                    className="text-[10px] font-bold tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 rounded-md uppercase"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-zinc-100/50 p-4 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/50 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Nota: O ODIN realiza o tratamento e harmonização de bases distintas para permitir a
            análise integrada. Para detalhes técnicos, consulte os registros de cada módulo no observatório.
          </p>
        </div>
      </PageContainer>
    </section>
  );
}