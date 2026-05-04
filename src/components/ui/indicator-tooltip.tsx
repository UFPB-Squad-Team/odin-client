"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function IndicatorTooltip({ 
  children, 
  description 
}: { 
  children: React.ReactNode; 
  description: string; 
}) {
  if (!description) return <>{children}</>;

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help group">
            {children}
            <Info className="h-3 w-3 text-muted-foreground/50 group-hover:text-cyan-500 transition-colors" />
          </span>
        </TooltipPrimitive.Trigger>
        
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            align="center"
            sideOffset={5}
            className={cn(
              "z-[9999] overflow-hidden rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-950 shadow-md animate-in fade-in-0 zoom-in-95 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 max-w-[240px] leading-relaxed"
            )}
          >
            {description}
            <TooltipPrimitive.Arrow className="fill-white dark:fill-zinc-950" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}