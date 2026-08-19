import { LandingBentoFeatures } from "@/components/features/landing/landing-bento-features";
import { LandingCta } from "@/components/features/landing/landing-cta";
import { LandingFooter } from "@/components/features/landing/landing-footer";
import { LandingGovernance } from "@/components/features/landing/landing-governance";
import { LandingGranularityNav } from "@/components/features/landing/landing-granularity-nav";
import { LandingHero } from "@/components/features/landing/landing-hero";
import { LandingNavbar } from "@/components/features/landing/landing-navbar";
import { LandingWowFactor } from "@/components/features/landing/landing-wow-factor";
import { LandingSources } from "@/components/features/landing/landing-sources";
import { MimirButton } from "@/components/features/mimir/mimir-button";

export function LandingPage() {
  return (
    <main
      id="conteudo-principal"
      className="relative min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100"
    >
      <LandingNavbar />
      <LandingHero />
      <LandingWowFactor />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <LandingGranularityNav />
      </div>

      <div id="diferencial" className="scroll-mt-24">
        <LandingBentoFeatures />
      </div>

      <div id="governanca" className="scroll-mt-24">
        <LandingGovernance />
      </div>

      <LandingSources />

      <LandingCta />
      <LandingFooter />

      <MimirButton />
    </main>
  );
}
