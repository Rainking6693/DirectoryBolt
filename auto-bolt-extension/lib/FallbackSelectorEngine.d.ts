import type { ElementHandle, Page } from 'playwright'

export default class FallbackSelectorEngine {
  retryAttempts: number
  retryDelay: number

  constructor()
  findElementWithRetry(
    page: Page,
    selectors: string[],
    maxAttempts?: number,
  ): Promise<ElementHandle<HTMLElement | SVGElement> | null>
  findElementWithFallback(page: Page, selectors: string[]): Promise<ElementHandle<HTMLElement | SVGElement> | null>
  findByXPath(page: Page, selectors: string[]): Promise<ElementHandle<HTMLElement | SVGElement> | null>
  cssToXPath(selector: string): string | null
  isElementInteractable(element: ElementHandle<HTMLElement | SVGElement>): Promise<boolean>
}