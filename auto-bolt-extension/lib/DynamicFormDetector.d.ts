import type { ElementHandle, Page } from 'playwright'

export default class DynamicFormDetector {
  readonly detectionStrategies: string[]
  private readonly observedElements: WeakSet<ElementHandle<HTMLElement | SVGElement>>

  constructor()
  detectAdvancedForms(page: Page): Promise<ElementHandle<HTMLElement | SVGElement>[]>
  collectStandardForms(page: Page, collection: Set<ElementHandle<HTMLElement | SVGElement>>): Promise<void>
  collectSpaContainers(page: Page, collection: Set<ElementHandle<HTMLElement | SVGElement>>): Promise<void>
  collectComponentForms(page: Page, collection: Set<ElementHandle<HTMLElement | SVGElement>>): Promise<void>
}