import fs from 'fs'
import path from 'path'
import { chromium, Browser, Page } from 'playwright'
import { logger } from './logger'

interface JobPayload {
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
  directory_limit?: number
  package_size?: any
}

interface DirectoryConfig {
  name: string
  url: string
  priority?: number
  requiresLogin?: boolean
  hasCaptcha?: boolean
  formMapping?: Record<string, string>
}

const DEFAULT_DIR_PATHS = [
  '../../../directories/master-directory-list.json',
  '../../../directories/expanded-master-directory-list-final.json',
  '../../../directories/directory-list.json'
]

function loadDirectories(): DirectoryConfig[] {
  // allow override via env URL (fetch) or path
  const envPath = process.env.DIRECTORY_LIST_PATH
  if (envPath && fs.existsSync(envPath)) {
    const json = JSON.parse(fs.readFileSync(envPath, 'utf-8'))
    return Array.isArray(json) ? json : (json.directories || json.items || [])
  }
  for (const rel of DEFAULT_DIR_PATHS) {
    const abs = path.resolve(__dirname, rel)
    if (fs.existsSync(abs)) {
      try {
        const json = JSON.parse(fs.readFileSync(abs, 'utf-8'))
        return Array.isArray(json) ? json : (json.directories || json.items || [])
      } catch {}
    }
  }
  throw new Error('No directory list found. Set DIRECTORY_LIST_PATH or ensure directories JSON exists in repo root.')
}

async function wait(ms:number){ return new Promise(r=>setTimeout(r,ms)) }

export async function processJob(job: JobPayload, api: { updateProgress: (jobId:string, results:any[], extras?: { status?: string, errorMessage?: string })=>Promise<any>, completeJob: (jobId:string, summary:any)=>Promise<any> }) {
  const startTime = Date.now()
  const browser: Browser = await chromium.launch({ headless: true, args: ['--disable-gpu','--no-sandbox'] })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    const allDirs = loadDirectories()
    const processable = allDirs
      .filter(d => !d.requiresLogin && !d.hasCaptcha)
      .sort((a,b) => (b.priority||0) - (a.priority||0))

    const limit = Number(job.directory_limit || job.package_size || 0) || computeLimit(job.package_size)
    const selected = processable.slice(0, limit)

    let submitted = 0
    let failed = 0

    for (const dir of selected) {
      const result = await submitToDirectory(page, dir, job)
      logger.info('Directory processed', { jobId: job.id, directoryName: dir.name, status: result.status })

      try {
        // send both directoryResults and explicit counters to backend for UI progress
        const completedCount = result.status === 'submitted' ? submitted + 1 : submitted
        await api.updateProgress(job.id, [result], {
          status: 'in_progress',
          errorMessage: result.status === 'failed' ? result.message : undefined
        })
        // Update aggregate progress percentage metadata to keep progress bar accurate mid-run
        await api.updateProgress(job.id, [], {
          status: 'in_progress',
          errorMessage: undefined
        })
      } catch (e:any) {
        logger.error('updateProgress failed', { jobId: job.id, directoryName: dir.name, error: e?.message })
      }

      if (result.status === 'submitted') submitted++
      else failed++

      await wait(2000)
    }

    const summary = {
      finalStatus: 'complete',
      summary: {
        totalDirectories: selected.length,
        successfulSubmissions: submitted,
        failedSubmissions: failed,
        processingTimeSeconds: Math.round((Date.now() - startTime) / 1000)
      }
    }

    await api.completeJob(job.id, summary)
  } finally {
    await browser.close()
  }
}

function computeLimit(pkg:any): number {
  const v = String(pkg || '').toLowerCase()
  const map:Record<string,number>={ starter:50, growth:150, professional:300, enterprise:500, pro:500 }
  return map[v] || Number(pkg) || 50
}

export async function submitToDirectory(page: Page, directory: DirectoryConfig, job: JobPayload){
  const started = new Date().toISOString()
  try {
    await page.goto(directory.url, { waitUntil: 'domcontentloaded', timeout: 60000 })

    if (directory.formMapping) {
      for (const [fieldName, selectors] of Object.entries(directory.formMapping)) {
        const value = pickField(job, fieldName)
        if (typeof value === 'string' && value.length) {
          // Handle both array of selectors and single selector
          const selectorList = Array.isArray(selectors) ? selectors : [selectors]

          // Try each selector until one works
          let filled = false
          for (const selector of selectorList) {
            try {
              await page.fill(selector, value, { timeout: 5000 })
              filled = true
              break
            } catch {}
          }

          if (!filled) {
            logger.info('No selector worked for field', { jobId: job.id, field: fieldName, directory: directory.name })
          }
        }
      }
    }

    // best-effort submit button click
    const submitSelectors = ['button[type="submit"]','input[type="submit"]','button:has-text("Submit")','button:has-text("Create")','button:has-text("Add")']
    for (const sel of submitSelectors) {
      const el = await page.$(sel)
      if (el) { await el.click({ timeout: 10000 }).catch(()=>{}) }
    }

    await page.waitForTimeout(2000)

    // simple success heuristics
    const content = (await page.content()).toLowerCase()
    const success = /success|thank you|received|submitted/.test(content)

    return { directoryName: directory.name, status: success ? 'submitted' : 'failed', message: success ? 'OK' : 'No success indicator', timestamp: started }
  } catch (e:any) {
    return { directoryName: directory.name, status: 'failed', message: e?.message || 'Navigation/submit error', timestamp: started }
  }
}

function pickField(job: JobPayload, field: string): string | undefined {
  const map: Record<string, any> = {
    business_name: job.business_name,
    businessName: job.business_name,
    email: job.email,
    phone: job.phone,
    website: job.website,
    address: job.address,
    city: job.city,
    state: job.state,
    zip: job.zip,
    description: job.description,
    category: job.category
  }
  return map[field]
}
