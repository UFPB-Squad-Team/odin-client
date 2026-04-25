"use client";

// Sidebar com abas dinâmicas geradas pelo ModuleRegistry.
// O Shell não importa nenhum módulo diretamente — lê via listModules().
// Adicionar um novo módulo = registrá-lo no bootstrap. A aba aparece automaticamente.

import { useState } from "react";
import { listModules } from "@/core/registry/module-registry";
import type { ShellContextType } from "@/core/types/shell";

type ModuleTabSidebarProps = {
  shellContext: ShellContextType;
  activeIndicatorId: string | null;
  onIndicatorChange: (indicatorId: string | null) => void;
  collapsed?: boolean;
};

function getModuleInitials(label: string): string {
  return label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ModuleTabSidebar({
  shellContext,
  activeIndicatorId,
  onIndicatorChange,
  collapsed = false,
}: ModuleTabSidebarProps) {
  const modules = listModules();
  const { activeModuleId, setActiveModule } = shellContext;

  // Se nenhum módulo estiver ativo, usa o primeiro disponível
  const resolvedActiveId = activeModuleId ?? modules[0]?.id ?? null;
  const activeModule = modules.find((m) => m.id === resolvedActiveId);

  // Estado local para controlar qual aba está visualmente selecionada
  const [localActiveId, setLocalActiveId] = useState<string | null>(resolvedActiveId);

  function handleTabClick(moduleId: string) {
    setLocalActiveId(moduleId);
    setActiveModule(moduleId);
    // Limpa o indicador ao trocar de módulo
    onIndicatorChange(null);
  }

  const currentId = localActiveId ?? resolvedActiveId;
  const currentModule = modules.find((m) => m.id === currentId) ?? activeModule;

  if (modules.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
        Nenhum módulo registrado.
      </div>
    );
  }

  // Modo colapsado — exibe apenas ícones/iniciais
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        {modules.map((mod) => {
          const isActive = mod.id === currentId;
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => handleTabClick(mod.id)}
              title={mod.label}
              aria-label={mod.label}
              aria-pressed={isActive}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {Icon ? (
                <Icon className="h-4 w-4" />
              ) : (
                getModuleInitials(mod.label)
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Modo expandido — abas completas + painel do módulo ativo
  return (
    <div className="flex flex-col h-full">
      {/* Abas */}
      <div
        className="flex shrink-0 border-b border-border overflow-x-auto"
        role="tablist"
        aria-label="Módulos do Observatório"
      >
        {modules.map((mod) => {
          const isActive = mod.id === currentId;
          return (
            <button
              key={mod.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(mod.id)}
              className={[
                "flex-1 min-w-0 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              ].join(" ")}
            >
              {mod.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo — apenas o SidebarPanel do módulo ativo */}
      <div className="flex-1 overflow-y-auto" role="tabpanel">
        {currentModule ? (
          <currentModule.SidebarPanel
            shellContext={shellContext}
            activeIndicatorId={activeIndicatorId}
            onIndicatorChange={onIndicatorChange}
          />
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            Selecione um módulo para ver os indicadores.
          </div>
        )}
      </div>
    </div>
  );
}
