import Link from "next/link";
import { OdinLogoPlaceholder } from "@/components/features/landing/odin-logo-placeholder";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PageContainer } from "@/components/layout/page-container";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-zinc-50/85 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <PageContainer className="flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Link
          href="/"
          aria-label="Página inicial do ODIN"
          className="group inline-flex items-center gap-3"
        >
          <span className="transition group-hover:opacity-90">
            <OdinLogoPlaceholder size="md" />
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-2 sm:gap-3"
        >
          <a
            href="#governanca"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:text-zinc-200 dark:hover:bg-zinc-900 md:inline-flex"
          >
            Governança
          </a>
          <Link
            href="/observatorio"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <span className="sm:hidden">Entrar</span>
            <span className="hidden sm:inline">Acessar Observatório</span>
          </Link>
          <ThemeToggle />
        </nav>
      </PageContainer>
    </header>
  );
}
