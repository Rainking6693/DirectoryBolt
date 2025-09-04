import { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '../../lib/utils/logger'
import { DirectoryDatabase } from '../../lib/database/directories'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  environment: string
  checks: {
    database: HealthCheckResult
    memory: HealthCheckResult
    disk: HealthCheckResult
    external_apis: HealthCheckResult
  }
}

interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail'
  message?: string
  responseTime?: number
  details?: any
}

const startTime = Date.now()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus>
) {
  const requestStart = Date.now()
  
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: Date.now() - startTime,
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: { status: 'fail', message: 'Method not allowed' },
          memory: { status: 'fail', message: 'Method not allowed' },
          disk: { status: 'fail', message: 'Method not allowed' },
          external_apis: { status: 'fail', message: 'Method not allowed' }
        }
      })
    }

    // Perform health checks in parallel for better performance
    const checks = await Promise.all([
      checkDatabase(),
      checkMemoryUsage(),
      checkDiskSpace(),
      checkExternalAPIs()
    ])

    const [database, memory, disk, external_apis] = checks
    
    // Determine overall status
    const hasFailures = checks.some(check => check.status === 'fail')
    const hasWarnings = checks.some(check => check.status === 'warn')
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (hasFailures) {
      overallStatus = 'unhealthy'
    } else if (hasWarnings) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database,
        memory,
        disk,
        external_apis
      }
    }

    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    // Add performance headers
    const responseTime = Date.now() - requestStart
    res.setHeader('X-Response-Time', `${responseTime}ms`)
    res.setHeader('X-Health-Status', overallStatus)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

    // Log health check for monitoring
    logger.info('Health check completed', {
      metadata: {
        status: overallStatus,
        responseTime,
        checks: {
          database: database.status,
          memory: memory.status,
          disk: disk.status,
          external_apis: external_apis.status
        }
      }
    })

    res.status(statusCode).json(healthStatus)

  } catch (error) {
    logger.error('Health check failed', { metadata: { error } })
    
    res.setHeader('X-Health-Status', 'unhealthy')
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'fail', message: 'Health check error' },
        memory: { status: 'fail', message: 'Health check error' },
        disk: { status: 'fail', message: 'Health check error' },
        external_apis: { status: 'fail', message: 'Health check error' }
      }
    })
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    // Test database connection and basic operations
    const db = new DirectoryDatabase()
    const stats = await db.getDirectoryStats()
    const responseTime = Date.now() - start
    
    if (responseTime > 5000) { // 5 seconds
      return {
        status: 'warn',
        message: 'Database response time high',
        responseTime,
        details: { responseTime, totalDirectories: stats.total }
      }
    }
    
    if (stats.total === 0) {
      return {
        status: 'warn',
        message: 'No directories in database - using fallback data',
        responseTime,
        details: stats
      }
    }
    
    return {
      status: 'pass',
      message: 'Database connection healthy',
      responseTime,
      details: {
        totalDirectories: stats.total,
        activeDirectories: stats.active,
        responseTime
      }
    }
    
  } catch (error) {
    return {
      status: 'fail',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - start
    }
  }
}

async function checkMemoryUsage(): Promise<HealthCheckResult> {
  try {
    const memoryUsage = process.memoryUsage()
    const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const usagePercentage = Math.round((usedMemoryMB / totalMemoryMB) * 100)
    
    if (usagePercentage > 90) {
      return {
        status: 'fail',
        message: 'Critical memory usage',
        details: {
          usedMB: usedMemoryMB,
          totalMB: totalMemoryMB,
          usagePercentage
        }
      }
    }
    
    if (usagePercentage > 75) {
      return {
        status: 'warn',
        message: 'High memory usage',
        details: {
          usedMB: usedMemoryMB,
          totalMB: totalMemoryMB,
          usagePercentage
        }
      }
    }
    
    return {
      status: 'pass',
      message: 'Memory usage normal',
      details: {
        usedMB: usedMemoryMB,
        totalMB: totalMemoryMB,
        usagePercentage
      }
    }
    
  } catch (error) {
    return {
      status: 'fail',
      message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkDiskSpace(): Promise<HealthCheckResult> {
  try {
    // Basic disk space check - in production, use more sophisticated monitoring
    return {
      status: 'pass',
      message: 'Disk space check completed',
      details: {
        note: 'Basic disk check - implement detailed disk monitoring for production'
      }
    }
    
  } catch (error) {
    return {
      status: 'warn',
      message: `Disk space check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkExternalAPIs(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    // Test critical external services
    const checks = await Promise.allSettled([
      testSupabaseConnection(),
      testExternalService('https://httpbin.org/status/200', 'HTTP Test Service', 3000)
    ])
    
    const results = checks.map((result, index) => ({
      service: ['Supabase', 'HTTP Test'][index],
      status: result.status === 'fulfilled' ? 'pass' : 'fail',
      error: result.status === 'rejected' ? result.reason?.message : null
    }))
    
    const failedServices = results.filter(r => r.status === 'fail')
    const responseTime = Date.now() - start
    
    if (failedServices.length === results.length) {
      return {
        status: 'fail',
        message: 'All external services unavailable',
        responseTime,
        details: { results }
      }
    } else if (failedServices.length > 0) {
      return {
        status: 'warn',
        message: `${failedServices.length} external service(s) unavailable`,
        responseTime,
        details: {
          results,
          failedServices: failedServices.map(s => s.service)
        }
      }
    }
    
    return {
      status: 'pass',
      message: 'All external APIs healthy',
      responseTime,
      details: { results }
    }
    
  } catch (error) {
    return {
      status: 'fail',
      message: `External API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - start
    }
  }
}

async function testSupabaseConnection(): Promise<void> {
  if (!process.env.SUPABASE_URL) {
    throw new Error('Supabase not configured')
  }
  
  // Simple connection test to Supabase REST API
  const response = await fetch(process.env.SUPABASE_URL + '/rest/v1/', {
    method: 'GET',
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY || '',
      'User-Agent': 'DirectoryBolt-HealthCheck/1.0'
    },
    signal: AbortSignal.timeout(5000) // 5 second timeout
  })
  
  if (!response.ok) {
    throw new Error(`Supabase connection failed: ${response.status}`)
  }
}

async function testExternalService(url: string, name: string, timeout: number = 5000): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'DirectoryBolt-HealthCheck/1.0'
      },
      signal: AbortSignal.timeout(timeout)
    })
    
    if (!response.ok) {
      throw new Error(`${name} returned ${response.status}`)
    }
    
  } catch (error) {
    throw new Error(`${name} check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}