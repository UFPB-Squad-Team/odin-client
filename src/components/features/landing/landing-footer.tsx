import { PageContainer } from "@/components/layout/page-container";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
      <PageContainer className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} ODIN · LEMA/UFPB</p>
        <p>Educação e Socioeconômico · 9 estados do Nordeste.</p>
      </PageContainer>
    </footer>
  );
}
