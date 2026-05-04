"use client";

export async function startOdinTour() {
  const { driver } = await import("driver.js");
  
  await import("driver.js/dist/driver.css");
  
  const isDark = document.documentElement.classList.contains("dark");

  const driverObj = driver({
    showProgress: true,
    nextBtnText: "Próximo",
    prevBtnText: "Anterior",
    doneBtnText: "Finalizar",
    stageRadius: 8,
    overlayColor: isDark ? "#000" : "#222",
    popoverClass: "odin-tour-popover",
    steps: [
      { 
        element: "#tour-logo", 
        popover: { 
          title: "Bem-vindo ao ODIN", 
          description: "Sua plataforma de indicadores socioeconômicos e educacionais da Paraíba.", 
          side: "bottom", 
          align: "start" 
        } 
      },
      { 
        element: "#tour-governanca", 
        popover: { 
          title: "Transparência", 
          description: "Entenda como tratamos os dados e nossa política de governança.", 
          side: "bottom" 
        } 
      },
      { 
        element: "#tour-entrar", 
        popover: { 
          title: "Explorar Dados", 
          description: "Acesse o observatório completo com mapas interativos e filtros avançados.", 
          side: "left" 
        } 
      }
    ]
  });

  driverObj.drive();
}

export default function TourProvider() {
  return null;
}