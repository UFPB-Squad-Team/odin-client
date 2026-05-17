import type { ModuleDetailContribution } from "@/core/types/module";

export type DimensionContribution = {
  moduleId: string;
  moduleLabel: string;
  colorAccent: string;
  contribution: ModuleDetailContribution;
};

export type DimensionVisibility = Record<string, boolean>;
