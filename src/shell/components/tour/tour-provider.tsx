"use client";

import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";


let driverInstance: Driver | null = null;

export function startOdinTour() {
  if (driverInstance) {
    driverInstance.drive();
    return;
  }

  const isDark = document.documentElement.classList.contains("dark");

  driverInstance = driver({
    showProgress: true,
    animate: true,
    stageRadius: 8,
    overlayColor: isDark ? "#000" : "#222",
    popoverClass: "odin-tour-popover",
    nextBtnText: "Próximo",
    prevBtnText: "Anterior",
    doneBtnText: "Finalizar",
    steps: [
      { 
        element: "#tour-logo", 
        popover: { 
          title: "Bem-vindo ao ODIN", 
          description: "Sua nova central de inteligência territorial para o Nordeste.", 
          side: "bottom", 
          align: "start" 
        } 
      },
      { 
        element: "#tour-governanca", 
        popover: { 
          title: "Transparência", 
          description: "Acesso rápido às nossas políticas de uso e tratamento de dados.", 
          side: "bottom" 
        } 
      },
      { 
        element: "#tour-lema", 
        popover: { 
          title: "Ciência e Pesquisa", 
          description: "Desenvolvido pelo Laboratório LEMA da UFPB com foco em impacto social.", 
          side: "left" 
        } 
      },
      { 
        element: "#tour-fontes", 
        popover: { 
          title: "Fontes Oficiais", 
          description: "Cruzamos dados do INEP, IBGE e outras bases para gerar insights precisos.", 
          side: "top" 
        } 
      },
      { 
        element: "#tour-cta", 
        popover: { 
          title: "Tudo pronto?", 
          description: "Explore o módulo de Educação e veja a Paraíba em detalhes.", 
          side: "top" 
        } 
      },
      { 
        element: "#tour-entrar", 
        popover: { 
          title: "Começar Agora", 
          description: "Clique aqui para entrar direto no observatório interativo.", 
          side: "left" 
        } 
      }
    ]
  });

  driverInstance.drive();
}

export default function TourProvider() {
  return null;
}