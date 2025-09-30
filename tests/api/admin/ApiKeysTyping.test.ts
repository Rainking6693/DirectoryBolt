import { describe, it, expect } from '@jest/globals'

interface SecurityLogEntry {
  timestamp: string
  ipAddress: string
  action: string
  status: 'success' | 'failure'
}

describe('SecurityLogEntry typing', () => {
  it('accepts valid log entries', () => {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      action: 'api_key_created',
      status: 'success'
    }
    expect(entry.status).toBe('success')
  })

  // @ts-expect-error invalid status
  it('rejects invalid status values', () => {
    const badEntry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      action: 'api_key_created',
      status: 'partial'
    }
    expect(badEntry).toBeDefined()
  })
})

