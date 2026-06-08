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
  simplifiedView: boolean;
  radiusMode?: boolean;
  darkMapStyle?: boolean;
  onSimplifiedViewChange: (value: boolean) => void;
  onSelect: (moduleId: string, indicatorId: string | null) => void;
};
