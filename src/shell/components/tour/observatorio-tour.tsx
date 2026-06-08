"use client";

import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";

let driverInstance: Driver | null = null;

function ensureSidebarOpen(): Promise<void> {
  const toggleButton = document.querySelector('button[aria-label*="Expandir"]');
  
  const isCollapsed = toggleButton?.getAttribute("aria-label")?.includes("Expandir");
  
  if (isCollapsed && toggleButton) {
    (toggleButton as HTMLButtonElement).click();
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
  return Promise.resolve();
}

function scrollToElement(element: Element): void {
  element.scrollIntoView({ behavior: "smooth", block: "center" });
}

function getThemeColors() {
  const isDark = document.documentElement.classList.contains("dark");
  return {
    overlayColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.7)",
    popoverClass: "odin-tour-popover"
  };
}

export function startObservatorioTour(): void {
  if (driverInstance) {
    driverInstance.destroy();
    driverInstance = null;
  }

  const { overlayColor, popoverClass } = getThemeColors();

  void ensureSidebarOpen().then(() => {
    driverInstance = driver({
      showProgress: true,
      animate: true,
      stageRadius: 12,
      overlayColor,
      popoverClass,
      nextBtnText: "Próximo",
      prevBtnText: "Anterior",
      doneBtnText: "Finalizar",
      steps: [
        { 
          element: "#tour-button", 
          popover: { 
            title: "🎓 Tour Guiado", 
            description: "Este botão está sempre aqui caso você queira refazer o tour a qualquer momento.", 
            side: "bottom" as const, 
            align: "start" as const
          },
          onHighlightStarted: () => {
            const element = document.querySelector("#tour-button");
            if (element) scrollToElement(element);
          }
        },
        { 
          element: "#observatorio-smart-search", 
          popover: { 
            title: "🔍 Busca Universal", 
            description: "Busque por municípios, bairros, escolas ou endereços. Digite '/' para focar rapidamente.", 
            side: "bottom" as const, 
            align: "start" as const
          },
          onHighlightStarted: () => {
            const element = document.querySelector("#observatorio-smart-search");
            if (element) scrollToElement(element);
          }
        },
        { 
          element: "#layer-selector", 
          popover: { 
            title: "🗺️ Camadas do Mapa", 
            description: "Alterne entre visualização por Município, Bairro ou Escola. Cada camada revela indicadores específicos.", 
            side: "bottom" as const
          },
          onHighlightStarted: () => {
            const element = document.querySelector("#layer-selector");
            if (element) scrollToElement(element);
          }
        },
        { 
          element: ".map-indicator-picker", 
          popover: { 
            title: "📊 Indicadores", 
            description: "Selecione diferentes indicadores de Educação e Socioeconômico. O mapa se colore automaticamente.", 
            side: "left" as const
          },
          onHighlightStarted: () => {
            const element = document.querySelector(".map-indicator-picker");
            if (element) scrollToElement(element);
          }
        },
        { 
          element: "#simplified-view-toggle", 
          popover: { 
            title: "👁️ Visão Simplificada", 
            description: "Ative para ver uma régua com faixas: Crítico, Atenção e Na Média.", 
            side: "left" as const
          },
          onHighlightStarted: () => {
            const element = document.querySelector("#simplified-view-toggle");
            if (element) scrollToElement(element);
          }
        },
        { 
          element: ".observatorio-sidebar", 
          popover: { 
            title: "📋 Filtros Territoriais", 
            description: "Filtre por estado e município para refinar sua análise. Use Ctrl+B para recolher/expandir.", 
            side: "right" as const, 
            align: "start" as const
          },
          onHighlightStarted: () => {
            const element = document.querySelector(".observatorio-sidebar");
            if (element) scrollToElement(element);
          }
        },
        { 
          element: ".theme-toggle", 
          popover: { 
            title: "🌓 Tema Claro/Escuro", 
            description: "Alterna entre modo claro e escuro para melhor visualização dos dados.", 
            side: "bottom" as const
          },
          onHighlightStarted: () => {
            const element = document.querySelector(".theme-toggle");
            if (element) scrollToElement(element);
          }
        }
      ]
    });

    driverInstance.drive();
  });
}

export function destroyObservatorioTour(): void {
  if (driverInstance) {
    driverInstance.destroy();
    driverInstance = null;
  }
}
