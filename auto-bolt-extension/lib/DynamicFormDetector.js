class DynamicFormDetector {
  constructor() {
    this.detectionStrategies = ['standard', 'spa', 'component'];
    this.contentScript = null;
    this.observedElements = new WeakSet();
  }

  initialize(contentScript) {
    this.contentScript = contentScript || null;
  }

  detectAdvancedForms() {
    const forms = new Set();

    this.#collectStandardForms(forms);
    this.#collectSpaContainers(forms);
    this.#collectComponentForms(forms);

    return Array.from(forms);
  }

  #collectStandardForms(collection) {
    document.querySelectorAll('form').forEach((form) => {
      collection.add(form);
    });
  }

  #collectSpaContainers(collection) {
    const candidates = document.querySelectorAll([
      'div[role="form"]',
      'section[data-form]',
      '.form-container',
      '.form-wrapper',
      '[data-testid*="form"]',
      '[class*="form"]',
    ].join(','));

    candidates.forEach((container) => {
      if (this.observedElements.has(container)) {
        collection.add(container);
        return;
      }

      const inputs = container.querySelectorAll('input, select, textarea, [contenteditable="true"]');
      const buttons = container.querySelectorAll('button, [role="button"], input[type="submit"]');

      if (inputs.length >= 2 && buttons.length >= 1) {
        collection.add(container);
        this.observedElements.add(container);
      }
    });
  }

  #collectComponentForms(collection) {
    const selectors = [
      '[data-react-form]',
      '[data-vue-form]',
      '[data-angular-form]',
      '[class*="Form"]',
      '[class*="form-component"]',
    ];

    selectors.forEach((selector) => {
      try {
        document.querySelectorAll(selector).forEach((element) => {
          collection.add(element);
        });
      } catch (error) {
        console.warn('DynamicFormDetector: invalid selector', selector, error);
      }
    });
  }
}

export default DynamicFormDetector;

if (typeof globalThis !== 'undefined') {
  globalThis.DynamicFormDetector = DynamicFormDetector;
}
