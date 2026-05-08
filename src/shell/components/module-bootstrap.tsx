"use client";

// Bootstrap de módulos — executado apenas no cliente, uma única vez.
// Separado do page.tsx para evitar execução no servidor (SSR).

import { useEffect } from "react";
import { getModule, registerModule } from "@/core/registry/module-registry";

let bootstrapped = false;

export function ModuleBootstrap() {
  useEffect(() => {
    if (bootstrapped) return;
    bootstrapped = true;

    void (async () => {
      if (!getModule("educacao")) {
        const { educacaoModule } = await import("@/modules/educacao");
        registerModule(educacaoModule);
      }
      if (!getModule("socioeconomico")) {
        const { socioeconomicoModule } = await import("@/modules/socioeconomico");
        registerModule(socioeconomicoModule);
      }
    })();
  }, []);

  return null;
}
