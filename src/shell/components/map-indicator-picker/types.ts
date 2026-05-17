import type { ModuleIndicator } from "@/core/types/module";

export type IndicatorGroup = {
  moduleId: string;
  moduleLabel: string;
  colorAccent: string;
  indicators: ModuleIndicator[];
};

export type MapIndicatorPickerProps = {
  groups: IndicatorGroup[];
  activeModuleId: string | null;
  activeIndicatorId: string | null;
  onSelect: (moduleId: string, indicatorId: string | null) => void;
};
