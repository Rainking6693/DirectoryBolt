// Playwright helper: reCAPTCHA detection + 2Captcha solving + token injection
// Usage in Playwright worker code:
//   const { ensureRecaptchaSolved } = require('./utils/playwright-captcha-integration')
//   await ensureRecaptchaSolved(page)

const { solveCaptcha } = require('./captchaSolver')

/**
 * Ensure reCAPTCHA is solved on the current page if present.
 * Supports v2 (g-recaptcha-response textarea) injection.
 * Returns true if a captcha was detected and solved, false if none found.
 */
async function ensureRecaptchaSolved(page, opts = {}) {
  const apiKey = process.env.CAPTCHA_API_KEY || process.env.TWOCAPTCHA_API_KEY || process.env['2CAPTCHA_API_KEY']
  const pollingMs = opts.pollingIntervalMs || 10000
  const timeoutMs = opts.timeoutMs || 180000

  // Detect reCAPTCHA iframe or container
  const hasRecaptcha = await page.locator('iframe[src*="recaptcha"], .g-recaptcha').first().isVisible().catch(() => false)
  if (!hasRecaptcha) return false

  if (!apiKey) throw new Error('CAPTCHA present but no CAPTCHA_API_KEY/TWOCAPTCHA_API_KEY configured')

  // Attempt to extract sitekey
  const siteKey = await page.evaluate(() => {
    const el = document.querySelector('div.g-recaptcha[data-sitekey]')
    if (el) return el.getAttribute('data-sitekey')
    // Some sites render via JS config; try common global
    const m = document.body.innerHTML.match(/data-sitekey=\"([^"]+)\"/)
    return m ? m[1] : null
  })

  if (!siteKey) throw new Error('Unable to locate reCAPTCHA sitekey on page')

  const url = page.url()
  const token = await solveCaptcha({ apiKey, siteKey, url, pollingIntervalMs: pollingMs, timeoutMs })

  // Inject token (v2 compatible)
  await page.evaluate((t) => {
    let ta = document.getElementById('g-recaptcha-response')
    if (!ta) {
      ta = document.createElement('textarea')
      ta.id = 'g-recaptcha-response'
      ta.name = 'g-recaptcha-response'
      ta.style.display = 'none'
      document.body.appendChild(ta)
    }
    ta.value = t
  }, token)

  return true
}

module.exports = {
  ensureRecaptchaSolved,
}
