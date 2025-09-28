/**
 * @jest-environment jsdom
 */

const React = require('react')
const { render, screen, waitFor, fireEvent, act } = require('@testing-library/react')
const AutoBoltQueueMonitor = require('../../../components/staff-dashboard/AutoBoltQueueMonitor').default

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const createJsonResponse = (payload, ok = true, status = 200) => ({
  ok,
  status,
  json: jest.fn(async () => payload),
  text: jest.fn(async () => JSON.stringify(payload)),
})

describe('AutoBoltQueueMonitor', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'

    class FakeEventSource {
      constructor(url) {
        this.url = url
        this.onmessage = null
        this.onerror = null
      }
      close() {}
    }

    global.EventSource = FakeEventSource
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('renders queue stats and worker status after successful fetch', async () => {
    const queueResponse = {
      success: true,
      data: {
        queueItems: [
          {
            id: 'job-123',
            customerId: 'DIR-20250914-000001',
            businessName: 'Acme Inc',
            email: 'owner@example.com',
            packageSize: 50,
            priorityLevel: 1,
            status: 'in_progress',
            createdAt: '2025-09-25T12:00:00.000Z',
            startedAt: '2025-09-25T12:10:00.000Z',
            completedAt: null,
            errorMessage: null,
            directoriesTotal: 50,
            directoriesCompleted: 10,
            directoriesFailed: 2,
            progressPercentage: 20,
          },
        ],
        stats: {
          total_jobs: 1,
          total_queued: 0,
          total_processing: 1,
          total_completed: 0,
          total_failed: 0,
          total_directories: 50,
          completed_directories: 10,
          failed_directories: 2,
          success_rate: 80,
        },
      },
    }

    const workerResponse = {
      success: true,
      data: {
        workers: [
          {
            worker_id: 'worker-001',
            status: 'processing',
            last_heartbeat: new Date().toISOString(),
            current_job_id: 'job-123',
            jobs_processed: 5,
            jobs_failed: 0,
            proxy_enabled: true,
            captcha_credits: 250,
            error_message: undefined,
            uptime_seconds: 3600,
          },
        ],
        system_status: 'online',
        total_workers: 1,
        active_workers: 1,
        processing_workers: 1,
        queue_status: {
          pending_jobs: 0,
          active_jobs: 1,
          failed_jobs: 0,
        },
        last_updated: new Date().toISOString(),
      },
    }

    const fetchMock = jest.fn((input) => {
      const url = typeof input === 'string' ? input : input.toString()

      if (url.includes('/api/staff/auth-check')) {
        return Promise.resolve(createJsonResponse({ isAuthenticated: true }))
      }

      if (url.includes('/api/staff/autobolt-queue')) {
        return Promise.resolve(createJsonResponse(queueResponse))
      }

      if (url.includes('/api/autobolt-status')) {
        return Promise.resolve(createJsonResponse(workerResponse))
      }

      if (url.includes('/api/staff/autobolt-extensions')) {
        return Promise.resolve(createJsonResponse({ success: true, data: [] }))
      }

      return Promise.resolve(createJsonResponse({ success: true }))
    })

    global.fetch = fetchMock

    await act(async () => {
      render(React.createElement(AutoBoltQueueMonitor))
    })

    await waitFor(() => {
      expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0)
    })

    expect(screen.getByText('1 backend workers')).toBeInTheDocument()
    expect(screen.getByText(/Worker worker-001/)).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('retries failed jobs and calls the retry endpoint with job ids', async () => {
    const initialQueue = {
      success: true,
      data: {
        queueItems: [
          {
            id: 'job-999',
            customerId: 'DIR-20250914-999999',
            businessName: 'Beta LLC',
            email: 'beta@example.com',
            packageSize: 50,
            priorityLevel: 2,
            status: 'failed',
            createdAt: '2025-09-24T09:00:00.000Z',
            startedAt: '2025-09-24T09:05:00.000Z',
            completedAt: null,
            errorMessage: 'Timeout',
            directoriesTotal: 50,
            directoriesCompleted: 30,
            directoriesFailed: 20,
            progressPercentage: 60,
          },
        ],
        stats: {
          total_jobs: 1,
          total_queued: 0,
          total_processing: 0,
          total_completed: 0,
          total_failed: 1,
          total_directories: 50,
          completed_directories: 30,
          failed_directories: 20,
          success_rate: 60,
        },
      },
    }

    const refreshedQueue = {
      success: true,
      data: {
        queueItems: [
          {
            ...initialQueue.data.queueItems[0],
            status: 'pending',
            errorMessage: null,
          },
        ],
        stats: {
          total_jobs: 1,
          total_queued: 1,
          total_processing: 0,
          total_completed: 0,
          total_failed: 0,
          total_directories: 50,
          completed_directories: 30,
          failed_directories: 20,
          success_rate: 60,
        },
      },
    }

    const queueResponses = [initialQueue, refreshedQueue]

    const fetchMock = jest.fn((input, init) => {
      const url = typeof input === 'string' ? input : input.toString()

      if (url.includes('/api/staff/auth-check')) {
        return Promise.resolve(createJsonResponse({ isAuthenticated: true }))
      }

      if (url.includes('/api/staff/autobolt-queue')) {
        const payload = queueResponses.shift() || refreshedQueue
        return Promise.resolve(createJsonResponse(payload))
      }

      if (url.includes('/api/autobolt-status')) {
        return Promise.resolve(createJsonResponse({
          success: true,
          data: {
            workers: [],
            system_status: 'offline',
            total_workers: 0,
            active_workers: 0,
            processing_workers: 0,
            queue_status: { pending_jobs: 0, active_jobs: 0, failed_jobs: 0 },
            last_updated: new Date().toISOString(),
          },
        }))
      }

      if (url.includes('/api/staff/autobolt-extensions')) {
        return Promise.resolve(createJsonResponse({ success: true, data: [] }))
      }

      if (url.includes('/api/autobolt/jobs/retry')) {
        expect(init && init.method).toBe('POST')
        expect(init && init.body).toBe(JSON.stringify({ jobIds: ['job-999'] }))
        return Promise.resolve(createJsonResponse({
          success: true,
          data: {
            retriedJobsCount: 1,
            failedToRetryCount: 0,
            jobIds: ['job-999'],
            retryTimestamp: new Date().toISOString(),
          },
          message: 'ok',
        }))
      }

      return Promise.resolve(createJsonResponse({ success: true }))
    })

    global.fetch = fetchMock

    await act(async () => {
      render(React.createElement(AutoBoltQueueMonitor))
    })

    const retryButton = await screen.findByText(/Retry 1 Failed Jobs/i)

    await act(async () => {
      fireEvent.click(retryButton)
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/api/autobolt/jobs/retry',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
