import axios, { AxiosInstance } from 'axios'
import { logger } from './logger'

const baseURL = (process.env.AUTOBOLT_API_BASE || process.env.NETLIFY_FUNCTIONS_URL || '').replace(/\/$/, '')
const token = process.env.AUTOBOLT_API_KEY || process.env.WORKER_AUTH_TOKEN || ''

function client(): AxiosInstance {
  const headers: Record<string, string> = { 'X-API-Key': token }
  if (process.env.WORKER_ID) headers['X-Worker-ID'] = process.env.WORKER_ID!
  const inst = axios.create({ baseURL, timeout: 30000, headers })
  inst.interceptors.request.use((cfg) => {
    logger.info('API request', { url: `${cfg.baseURL}${cfg.url}`, method: cfg.method })
    return cfg
  })
  inst.interceptors.response.use((res) => res, (err) => {
    logger.error('API error', { message: err?.message, url: err?.config?.url, status: err?.response?.status })
    return Promise.reject(err)
  })
  return inst
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: any
  for (let i=0;i<attempts;i++) {
    try { return await fn() } catch (e:any) {
      lastErr = e
      const wait = Math.pow(2, i) * 500
      await new Promise(r => setTimeout(r, wait))
    }
  }
  throw lastErr
}

export async function getNextJob(): Promise<{ success: boolean, data: any | null, message?: string }> {
  return withRetry(async () => {
    const res = await client().get('/api/jobs/next')
    return res.data
  })
}

export async function updateProgress(jobId: string, directoryResults: any[], extras?: { status?: string, errorMessage?: string }) {
  return withRetry(async () => {
    const res = await client().post('/api/jobs/update', { jobId, directoryResults, ...(extras || {}) })
    return res.data
  })
}

export async function completeJob(jobId: string, summary: { finalStatus?: string, summary?: any, errorMessage?: string }) {
  return withRetry(async () => {
    const res = await client().post('/api/jobs/complete', { jobId, ...summary })
    return res.data
  })
}
