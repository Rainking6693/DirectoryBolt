import type { HandlerEvent } from '@netlify/functions'
import { handler as jobsNextHandler } from '../../backend/functions/jobs-next'
import { handler as jobsUpdateHandler } from '../../backend/functions/jobs-update'
import { handler as jobsCompleteHandler } from '../../backend/functions/jobs-complete'
import { handler as jobsRetryHandler } from '../../backend/functions/jobs-retry'
import { handler as autoboltStatusHandler } from '../../backend/functions/autobolt-status'
import { handler as healthzHandler } from '../../backend/functions/healthz'

type SupabaseQuery = {
  select: jest.Mock<SupabaseQuery, [string?]>
  update: jest.Mock<SupabaseQuery, [unknown]>
  insert: jest.Mock<SupabaseQuery, [unknown]>
  eq: jest.Mock<SupabaseQuery, [string, unknown]>
  gte: jest.Mock<SupabaseQuery, [string, unknown]>
  order: jest.Mock<SupabaseQuery, [string, { ascending: boolean }]>
  in: jest.Mock<SupabaseQuery, [string, unknown[]]>
  limit: jest.Mock<Promise<{ data: unknown[]; error: null }>, [number]>
  single: jest.Mock<Promise<{ data: unknown | null; error: null }>, []>
}

const createQueryMock = (): SupabaseQuery => {
  const query = {
    select: jest.fn(() => query) as SupabaseQuery['select'],
    update: jest.fn(() => query) as SupabaseQuery['update'],
    insert: jest.fn(() => query) as SupabaseQuery['insert'],
    eq: jest.fn(() => query) as SupabaseQuery['eq'],
    gte: jest.fn(() => query) as SupabaseQuery['gte'],
    order: jest.fn(() => query) as SupabaseQuery['order'],
    in: jest.fn(() => query) as SupabaseQuery['in'],
    limit: jest.fn(async () => ({ data: [], error: null })) as SupabaseQuery['limit'],
    single: jest.fn(async () => ({ data: null, error: null })) as SupabaseQuery['single'],
  }

  return query as SupabaseQuery
}

jest.mock('../../backend/functions/_supabaseClient.js', () => {
  const supabase = {
    from: jest.fn(() => createQueryMock()),
  }

  return {
    supabase,
    handleSupabaseError: jest.fn(() => ({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false }),
    })),
    handleSuccess: jest.fn((data: unknown) => ({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data }),
    })),
    validateWorkerAuth: jest.fn(() => ({ isValid: true, workerId: 'worker-123' })),
    getCorsHeaders: jest.fn(() => ({})),
    testConnection: jest.fn(async () => ({ connected: true })),
  }
})

const { validateWorkerAuth } = jest.requireMock('../../backend/functions/_supabaseClient.js') as {
  validateWorkerAuth: jest.Mock
}

const createEvent = (overrides: Partial<HandlerEvent>): HandlerEvent => ({
  headers: {},
  body: '',
  httpMethod: 'GET',
  isBase64Encoded: false,
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  path: '/',
  rawQuery: '',
  rawUrl: 'http://localhost/',
  remoteAddress: '127.0.0.1',
  ...overrides,
})

describe('AutoBolt orchestrator handlers', () => {
  beforeAll(() => {
    process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-key'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('jobs-next rejects non-POST methods', async () => {
    const response = await jobsNextHandler(createEvent({ httpMethod: 'GET' }), {} as any)
    expect(response.statusCode).toBe(405)
  })

  it('jobs-update requires job identifiers', async () => {
    const response = await jobsUpdateHandler(createEvent({ httpMethod: 'POST' }), {} as any)
    expect(response.statusCode).toBe(400)
  })

  it('jobs-complete requires a job identifier', async () => {
    const response = await jobsCompleteHandler(createEvent({ httpMethod: 'POST' }), {} as any)
    expect(response.statusCode).toBe(400)
  })

  it('jobs-retry requires queueId or retryAll flag', async () => {
    const response = await jobsRetryHandler(createEvent({ httpMethod: 'POST' }), {} as any)
    expect(response.statusCode).toBe(400)
  })

  it('autobolt-status rejects unsupported methods', async () => {
    const response = await autoboltStatusHandler(createEvent({ httpMethod: 'POST' }), {} as any)
    expect(response.statusCode).toBe(405)
  })

  it('healthz reports healthy status when dependencies succeed', async () => {
    const response = await healthzHandler(createEvent({ httpMethod: 'GET' }), {} as any)
    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.body)
    expect(payload.status).toBe('healthy')
  })

  it('jobs-update respects worker authentication failures', async () => {
    validateWorkerAuth.mockReturnValueOnce({
      isValid: false,
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Unauthorized' }),
    })

    const response = await jobsUpdateHandler(createEvent({ httpMethod: 'POST', body: '{}' }), {} as any)
    expect(response.statusCode).toBe(401)
  })
})
