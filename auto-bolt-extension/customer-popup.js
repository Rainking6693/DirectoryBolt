import PackageTierEngine from './lib/PackageTierEngine.js';

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('customerIdInput');
  const button = document.getElementById('validateBtn');
  const result = document.getElementById('result');

  if (!input || !button || !result) {
    console.warn('Customer popup: required elements not found');
    return;
  }

  button.addEventListener('click', async () => {
    const rawValue = (input.value || '').trim();

    if (!/^DIR-\d{8}-\d{6}$/i.test(rawValue)) {
      result.textContent = 'Customer ID must look like: DIR-YYYYMMDD-XXXXXX';
      return;
    }

    result.textContent = 'Validating...';

    const engine = new PackageTierEngine(rawValue);
    await engine.init();

    const tier = engine.getPackageTier();
    const limit = engine.getDirectoryLimit();
    const data = engine.lastResponse || {};

    if (!data.ok) {
      result.textContent = data.message || 'Validation failed. Please try again later.';
      return;
    }

    const name = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();

    result.textContent = `Name: ${name || '(unknown)'} | Business: ${data.businessName || '(none)'} | Package: ${tier} | Limit: ${limit}`;
  });
});
