const STORAGE_KEY = 'autoboltCustomerValidation';
const DEFAULT_PACKAGE = 'starter';
const DEFAULT_LIMIT = 50;

const dom = {
  form: document.getElementById('customer-form'),
  input: document.getElementById('customer-id'),
  button: document.getElementById('validate-btn'),
  status: document.getElementById('status'),
  resultCard: document.getElementById('customer-result'),
  resultPackage: document.getElementById('result-package'),
  resultLimit: document.getElementById('result-limit'),
};

const state = {
  engineClass: null,
  engineInstance: null,
  lastResult: null,
  isLoading: false,
};

function setStatus(message, variant = 'info') {
  if (!dom.status) return;

  const variants = ['info', 'success', 'error'];
  dom.status.classList.remove('status--hidden');
  variants.forEach((name) => dom.status.classList.remove(`status--${name}`));
  dom.status.classList.add(`status--${variant}`);
  dom.status.textContent = message;
}

function clearStatus() {
  if (!dom.status) return;
  dom.status.classList.add('status--hidden');
  dom.status.textContent = '';
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  if (!dom.button) return;

  dom.button.disabled = isLoading;
  dom.button.textContent = isLoading ? 'Validating...' : 'Check Package';
}

function showResult(packageName, directoryLimit) {
  if (!dom.resultCard) return;
  dom.resultPackage.textContent = formatPackage(packageName);
  dom.resultLimit.textContent = formatLimit(directoryLimit);
  dom.resultCard.style.display = 'block';
}

function hideResult() {
  if (!dom.resultCard) return;
  dom.resultCard.style.display = 'none';
  dom.resultPackage.textContent = '-';
  dom.resultLimit.textContent = '-';
}

function formatPackage(value) {
  if (!value || typeof value !== 'string') {
    return formatPackage(DEFAULT_PACKAGE);
  }
  return value.replace(/^[a-z]/, (char) => char.toUpperCase());
}

function formatLimit(limit) {
  const numeric = Number(limit);
  if (Number.isFinite(numeric)) {
    return `${numeric}`;
  }
  return `${DEFAULT_LIMIT}`;
}

async function ensureEngineClass() {
  if (state.engineClass) {
    return state.engineClass;
  }
  try {
    const module = await import(chrome.runtime.getURL('lib/PackageTierEngine.js'));
    state.engineClass = module.default;
    return state.engineClass;
  } catch (error) {
    console.error('Popup: failed to load PackageTierEngine module', error);
    throw new Error('Validation engine unavailable.');
  }
}

async function runValidation(customerId) {
  const EngineClass = await ensureEngineClass();
  const { engine, result } = await EngineClass.init(customerId, { engine: state.engineInstance });
  state.engineInstance = engine;
  state.lastResult = result;
  return result;
}

function readFromStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (items) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(items[key]);
    });
  });
}

function writeToStorage(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

async function restoreFromStorage() {
  try {
    const saved = await readFromStorage(STORAGE_KEY);
    if (!saved || typeof saved !== 'object') {
      return;
    }
    if (saved.customerId && dom.input) {
      dom.input.value = saved.customerId;
    }
    if (saved.package && saved.directoryLimit) {
      showResult(saved.package, saved.directoryLimit);
      setStatus(`Last verified ${new Date(saved.timestamp || Date.now()).toLocaleString()}`, 'info');
    }
  } catch (error) {
    console.warn('Popup: unable to restore previous validation', error);
  }
}

async function persistResult(result) {
  const payload = {
    ...result,
    timestamp: Date.now(),
  };
  try {
    await writeToStorage(STORAGE_KEY, payload);
  } catch (error) {
    console.warn('Popup: failed to store validation result', error);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const rawId = dom.input?.value?.trim() || '';
  if (!rawId) {
    hideResult();
    setStatus('Please enter your Customer ID.', 'error');
    return;
  }

  setLoading(true);
  setStatus('Validating customer...', 'info');

  try {
    const result = await runValidation(rawId);
    await persistResult(result);

    showResult(result.package, result.directoryLimit);

    if (result.ok) {
      setStatus('Customer verified successfully.', 'success');
    } else {
      setStatus(result.message || 'Validation failed. Please try again later.', 'error');
    }
  } catch (error) {
    console.error('Popup: validation failed', error);
    hideResult();
    setStatus('Validation failed. Please try again later.', 'error');
  } finally {
    setLoading(false);
  }
}

function bindEvents() {
  if (dom.form) {
    dom.form.addEventListener('submit', handleSubmit);
  }
}

async function init() {
  bindEvents();
  await restoreFromStorage();
}

init();
