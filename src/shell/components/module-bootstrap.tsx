"use client";

// Bootstrap de módulos — executado apenas no cliente, uma única vez.
// Separado do page.tsx para evitar execução no servidor (SSR).

import { useEffect } from "react";
import { getModule, registerModule } from "@/core/registry/module-registry";
import { educacaoModule } from "@/modules/educacao";
import { socioeconomicoModule } from "@/modules/socioeconomico";

let bootstrapped = false;

export function ModuleBootstrap() {
  useEffect(() => {
    if (bootstrapped) return;
    bootstrapped = true;

    if (!getModule("educacao")) {
      registerModule(educacaoModule);
    }
    if (!getModule("socioeconomico")) {
      registerModule(socioeconomicoModule);
    }
  }, []);

  return null;
}
