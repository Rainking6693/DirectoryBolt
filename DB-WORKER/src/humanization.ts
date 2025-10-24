import { Page } from 'playwright';

export interface DelayRange {
  min: number;
  max: number;
}

export const HUMANIZATION = {
  typingSpeed: { min: 50, max: 150 },
  delays: {
    afterPageLoad: { min: 2000, max: 4000 },
    betweenFields: { min: 500, max: 1500 },
    beforeSubmit: { min: 1000, max: 3000 }
  }
} as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function randomDelay(range: DelayRange): Promise<void> {
  const duration = Math.floor(Math.random() * (range.max - range.min) + range.min);
  await sleep(duration);
}

export async function humanClick(page: Page, selector: string): Promise<boolean> {
  const element = await page.$(selector);
  if (!element) return false;

  const box = await element.boundingBox();
  if (!box) return false;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  await randomDelay({ min: 100, max: 300 });
  await element.click({ delay: Math.floor(Math.random() * 120) });
  return true;
}

export async function humanType(page: Page, selector: string, text: string): Promise<boolean> {
  const clicked = await humanClick(page, selector);
  if (!clicked) return false;

  await randomDelay({ min: 200, max: 500 });

  for (const char of text) {
    await page.keyboard.type(char, { delay: Math.floor(Math.random() * (HUMANIZATION.typingSpeed.max - HUMANIZATION.typingSpeed.min) + HUMANIZATION.typingSpeed.min) });
  }

  return true;
}

let twoCaptchaSolver: any | null | undefined;

function getTwoCaptchaSolver(): any | null {
  if (twoCaptchaSolver !== undefined) {
    return twoCaptchaSolver;
  }

  if (!process.env.TWO_CAPTCHA_API_KEY) {
    twoCaptchaSolver = null;
    return twoCaptchaSolver;
  }

  try {
    // eslint-disable-next-line global-require
    const TwoCaptchaSolver = require('../gemini-worker/add-2captcha.js');
    twoCaptchaSolver = new TwoCaptchaSolver(process.env.TWO_CAPTCHA_API_KEY);
  } catch (error) {
    console.warn('Unable to initialise 2Captcha solver', error);
    twoCaptchaSolver = null;
  }

  return twoCaptchaSolver;
}

export async function solveCaptcha(page: Page): Promise<boolean> {
  const solver = getTwoCaptchaSolver();
  if (!solver) {
    return true;
  }

  const recaptchaFrame = await page.$('iframe[src*="recaptcha"]');
  if (!recaptchaFrame) {
    return true;
  }

  const siteKey = await page.evaluate(() => {
    const el = document.querySelector('.g-recaptcha') as HTMLElement | null;
    return el?.getAttribute('data-sitekey') || null;
  });

  if (!siteKey) {
    console.warn('Found reCAPTCHA frame but no sitekey attribute');
    return false;
  }

  try {
    const solution = await solver.solveRecaptchaV2(siteKey, page.url());
    if (!solution?.success) {
      throw new Error(solution?.error || 'Unknown 2Captcha error');
    }

    await page.evaluate((token: string) => {
      const textarea = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.value = token;
      } else {
        const newTextarea = document.createElement('textarea');
        newTextarea.id = 'g-recaptcha-response';
        newTextarea.style.display = 'none';
        newTextarea.value = token;
        document.body.appendChild(newTextarea);
      }
    }, solution.solution);

    return true;
  } catch (error) {
    console.error('2Captcha solve failed', error);
    return false;
  }
}