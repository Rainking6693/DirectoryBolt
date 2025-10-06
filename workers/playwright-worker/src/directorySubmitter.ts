import { Page } from 'playwright'
import dynamicFormMapper from '../../../lib/services/dynamic-form-mapper'

export interface JobPayload {
  id: string
  customer_id: string
  business_name?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  description?: string
  category?: string
}

export interface SubmitResult {
  directoryName: string
  status: 'submitted' | 'failed'
  message?: string
  listingUrl?: string
  timestamp: string
}

function toBusinessRecord(job: JobPayload) {
  return {
    businessName: job.business_name || '',
    email: job.email || '',
    phone: job.phone || '',
    website: job.website || '',
    address: job.address || '',
    city: job.city || '',
    state: job.state || '',
    zip: job.zip || '',
    description: job.description || '',
    category: job.category || ''
  } as any
}

export async function submitWithMapper(page: Page, siteUrl: string, directoryName: string, job: JobPayload): Promise<SubmitResult> {
  const started = new Date().toISOString()
  try {
    await dynamicFormMapper.initialize()

    const businessData = toBusinessRecord(job)
    const mapping = await dynamicFormMapper.mapFormFields(siteUrl, businessData)

    if (!mapping.success || Object.keys(mapping.mappedFields).length === 0) {
      return { directoryName, status: 'failed', message: `No mappable fields for ${siteUrl}`, timestamp: started }
    }

    await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

    // Fill mapped fields
    for (const [field, selector] of Object.entries(mapping.mappedFields)) {
      const value = (businessData as any)[field]
      if (!value) continue
      try {
        await page.fill(selector, String(value), { timeout: 15000 })
      } catch {
        // ignore individual field failures
      }
    }

    // Click submit buttons heuristically
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Create")',
      'button:has-text("Add")'
    ]
    for (const sel of submitSelectors) {
      const el = await page.$(sel)
      if (el) { await el.click({ timeout: 10000 }).catch(() => {}) }
    }

    await page.waitForTimeout(2000)

    const html = (await page.content()).toLowerCase()
    const success = /success|thank you|received|submitted|confirmation/.test(html)
    const listingUrl = await page.url()

    return { directoryName, status: success ? 'submitted' : 'failed', message: success ? 'OK' : 'No success indicator', listingUrl, timestamp: started }
  } catch (e: any) {
    return { directoryName, status: 'failed', message: e?.message || 'Mapper submit error', timestamp: started }
  }
}
