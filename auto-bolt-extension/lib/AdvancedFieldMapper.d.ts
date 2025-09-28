import type { ElementHandle } from 'playwright'

export interface FieldPattern {
  semanticScore: number
  contextScore: number
  positionScore: number
  confidence: number
}

export interface FieldMetadata {
  name: string
  id: string
  placeholder: string
  type: string
  className: string
  element: ElementHandle<HTMLElement | SVGElement>
}

export interface FieldMappingResult {
  identifier: string
  confidence: number
  suggestedField: string | null
  value: string | undefined
}

export default class AdvancedFieldMapper {
  confidenceThreshold: number
  private readonly mappingCache: Map<string, FieldPattern>
  private readonly learningData: Map<string, unknown>

  constructor()
  reset(): void
  analyzeFieldPatterns(element: ElementHandle<HTMLElement | SVGElement>): Promise<FieldPattern>
  mapToBusinessField(
    element: ElementHandle<HTMLElement | SVGElement>,
    businessData: Record<string, unknown>,
  ): Promise<FieldMappingResult>
  extractFieldMetadata(element: ElementHandle<HTMLElement | SVGElement>): Promise<FieldMetadata>
  generateCacheKey(element: ElementHandle<HTMLElement | SVGElement>): string
  calculateSemanticScore(element: ElementHandle<HTMLElement | SVGElement>): Promise<number>
  calculateContextScore(element: ElementHandle<HTMLElement | SVGElement>): Promise<number>
  calculatePositionScore(element: ElementHandle<HTMLElement | SVGElement>): Promise<number>
  matchesPattern(metadata: FieldMetadata, patterns: string[]): boolean
  determineSuggestedField(metadata: FieldMetadata, pattern: FieldPattern): string | null
  getBusinessValue(fieldType: string | null, businessData: Record<string, unknown>): string
}