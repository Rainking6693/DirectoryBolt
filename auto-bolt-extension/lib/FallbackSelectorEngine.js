class FallbackSelectorEngine {
  constructor() {
    this.fallbackStrategies = [];
    this.retryAttempts = 3;
    this.retryDelay = 500;
  }

  async findElementWithRetry(selectors, maxAttempts = this.retryAttempts) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const element = this.findElementWithFallback(selectors);
      if (element) {
        return element;
      }
      await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
    }
    return null;
  }

  findElementWithFallback(selectors) {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && this.isElementInteractable(element)) {
          return element;
        }
      } catch (error) {
        console.warn('FallbackSelectorEngine: invalid selector', selector, error);
      }
    }
    return this.findByXPath(selectors);
  }

  findByXPath(originalSelectors) {
    const xpathQueries = originalSelectors
      .map((selector) => this.cssToXPath(selector))
      .filter(Boolean);
    for (const xpath of xpathQueries) {
      try {
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue) {
          return result.singleNodeValue;
        }
      } catch (error) {
        console.warn('FallbackSelectorEngine: invalid XPath', xpath, error);
      }
    }
    return null;
  }

  cssToXPath(cssSelector) {
    try {
      if (cssSelector.includes('#')) {
        const id = cssSelector.split('#')[1].split(/[\s\[\.:]/)[0];
        return `//*[@id='${id}']`;
      }
      if (cssSelector.includes('[name=')) {
        const nameMatch = cssSelector.match(/\[name=['"]([^'"]*)['"]\]/);
        if (nameMatch) {
          return `//*[@name='${nameMatch[1]}']`;
        }
      }
      if (cssSelector.includes('input[type=')) {
        const typeMatch = cssSelector.match(/input\[type=['"]([^'"]*)['"]\]/);
        if (typeMatch) {
          return `//input[@type='${typeMatch[1]}']`;
        }
      }
    } catch (error) {
      console.warn('FallbackSelectorEngine: cssToXPath failed', error);
    }
    return null;
  }

  isElementInteractable(element) {
    if (!element) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      !element.disabled &&
      !element.readOnly
    );
  }
}

export default FallbackSelectorEngine;

if (typeof globalThis !== 'undefined' && !globalThis.FallbackSelectorEngine) {
  globalThis.FallbackSelectorEngine = FallbackSelectorEngine;
}
