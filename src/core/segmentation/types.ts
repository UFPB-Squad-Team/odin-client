/**
 * Tipos genéricos para o sistema de segmentação do ODIN.
 * Permite que cada módulo (educação, saúde, negócios, etc.)
 * registre suas próprias segmentações de forma desacoplada.
 */

/**
 * Uma categoria/segmento dentro de um módulo.
 * Exemplo (educação): "infantil", "fundamental", "medio"
 * Exemplo (saúde): "ubs", "hospital", "pronto-socorro"
 * Exemplo (negócios): "varejo", "servicos", "industria"
 */
export type SegmentId = string;

/**
 * Configuração de um segmento.
 */
export interface SegmentConfig {
  id: SegmentId;
  label: string;
  description: string;
  /** Quais chaves de métrica este segmento usa */
  availableMetrics: string[];
}

/**
 * Metadados de um módulo de segmentação.
 */
export interface SegmentationModule {
  /** ID único do módulo (ex: "educacao", "saude", "negocios") */
  id: string;
  /** Nome legível (ex: "Educação", "Saúde", "Negócios") */
  label: string;
  /** Descrição */
  description: string;
  /** Todos os segmentos disponíveis neste módulo */
  segments: Record<SegmentId, SegmentConfig>;
  /** Segmento padrão quando nenhum é selecionado */
  defaultSegment: SegmentId;
  /** Função para extrair segmentos disponíveis a partir dos geoProps de uma entidade */
  extractAvailableSegments: (geoProps: Record<string, unknown>) => SegmentId[];
}

/**
 * Resultado da extração de segmentos para uma entidade.
 */
export interface SegmentationResult {
  /** Módulo de segmentação ativo */
  module: SegmentationModule;
  /** IDs dos segmentos disponíveis para esta entidade */
  availableSegments: SegmentId[];
  /** Se tem múltiplos segmentos */
  hasMultiple: boolean;
  /** Segmento primário (primeiro disponível ou default) */
  primarySegment: SegmentId;
}