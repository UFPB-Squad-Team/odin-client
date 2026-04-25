// Barrel de exportação do Core — ponto de entrada único para todo o código compartilhado.
// Módulos e Shell importam daqui quando precisam de tipos ou utilitários do Core.

export * from "./types/territory";
export * from "./types/shell";
export * from "./types/module";
export * from "./types/geospatial";
export * from "./registry/module-registry";
export * from "./registry/validate-module";
export * from "./geospatial/geospatial-api";
export * from "./geospatial/use-map-layers";
export * from "./filters/use-cascade-filters";
