// ModuleRegistry — singleton que mantém os módulos registrados.
// O Shell acessa módulos exclusivamente via este registry.
// Módulos se registram no bootstrap (src/app/observatorio/page.tsx), fora do ciclo de render.

import type { ModuleContract } from "@/core/types/module";

const registry = new Map<string, ModuleContract>();

/**
 * Registra um módulo no registry.
 * Lança erro se um módulo com o mesmo id já estiver registrado.
 * Deve ser chamado fora do ciclo de render React, no bootstrap da aplicação.
 */
export function registerModule(module: ModuleContract): void {
  if (registry.has(module.id)) {
    throw new Error(
      `[ModuleRegistry] Módulo com id "${module.id}" já está registrado. ` +
        `IDs de módulo devem ser únicos. Use getModule("${module.id}") para verificar antes de registrar.`,
    );
  }
  registry.set(module.id, module);
}

/**
 * Retorna o módulo com o id informado, ou undefined se não encontrado.
 */
export function getModule(id: string): ModuleContract | undefined {
  return registry.get(id);
}

/**
 * Retorna todos os módulos registrados, na ordem em que foram registrados.
 */
export function listModules(): ModuleContract[] {
  return Array.from(registry.values());
}

/**
 * Limpa todos os módulos registrados.
 * APENAS para uso em testes — lança erro em produção.
 */
export function clearRegistry(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "[ModuleRegistry] clearRegistry() só pode ser chamado em ambiente de teste (NODE_ENV=test).",
    );
  }
  registry.clear();
}
