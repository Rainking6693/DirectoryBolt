import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import AutoBoltMonitoringDashboard from '../../components/monitoring/AutoBoltMonitoringDashboard'
import ExtensionDemoAccess from '../../components/monitoring/ExtensionDemoAccess'
import DataFlowTransparency from '../../components/monitoring/DataFlowTransparency'
import ExtensionHealthMonitor from '../../components/monitoring/ExtensionHealthMonitor'

interface MonitoringOverview {
  system_status: 'operational' | 'degraded' | 'outage'
  active_extensions: number
  total_customers_processing: number
  queue_depth: number
  success_rate_24h: number
  average_processing_time: number
  critical_alerts: number
  last_updated: string
}

export default function MonitoringPage() {
  const [overview, setOverview] = useState<MonitoringOverview | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Check if user is already authorized
    const savedApiKey = sessionStorage.getItem('autobolt_monitoring_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
      validateApiKey(savedApiKey)
    }
  }, [])

  const validateApiKey = async (key: string) => {
    try {
      const response = await fetch('/api/autobolt/validate-access', {
        headers: {
          'X-API-Key': key
        }
      })
      
      if (response.ok) {
        setIsAuthorized(true)
        setAuthError('')
        sessionStorage.setItem('autobolt_monitoring_key', key)
        fetchOverview()
      } else {
        setIsAuthorized(false)
        setAuthError('Invalid API key')
      }
    } catch (error) {
      setIsAuthorized(false)
      setAuthError('Failed to validate API key')
    }
  }

  const handleAuth = () => {
    if (!apiKey.trim()) {
      setAuthError('API key is required')
      return
    }
    validateApiKey(apiKey)
  }

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/autobolt/monitoring-overview', {
        headers: {
          'X-API-Key': apiKey
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOverview(data.overview)
        }
      }
    } catch (error) {
      console.error('Failed to fetch monitoring overview:', error)
    }
  }

  const logout = () => {
    setIsAuthorized(false)
    setApiKey('')
    sessionStorage.removeItem('autobolt_monitoring_key')
    setOverview(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'outage': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">AutoBolt Monitoring Access</CardTitle>
            <p className="text-gray-600">Enter your monitoring API key to continue</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your AutoBolt monitoring API key"
              />
            </div>
            
            {authError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {authError}
              </div>
            )}
            
            <Button onClick={handleAuth} className="w-full">
              Access Monitoring Dashboard
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              Contact your administrator if you need access to the monitoring dashboard.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-900">DirectoryBolt</div>
              <Badge className="ml-3 bg-blue-600">Monitoring Dashboard</Badge>
            </div>
            <div className="flex items-center gap-4">
              {overview && (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(overview.system_status)}`}></div>
                  <span className="text-sm text-gray-600">
                    System {overview.system_status}
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="live-monitoring">Live Monitoring</TabsTrigger>
            <TabsTrigger value="demo-access">Demo Access</TabsTrigger>
            <TabsTrigger value="data-flow">Data Flow</TabsTrigger>
            <TabsTrigger value="health-monitor">Health Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AutoBolt Monitoring Overview</h1>
              <p className="text-gray-600">Complete transparency into your directory submission automation</p>
            </div>

            {overview && (
              <>
                {/* System Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(overview.system_status)}`}></div>
                        <div className="text-lg font-semibold capitalize">{overview.system_status}</div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">All systems operational</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Active Processing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {overview.total_customers_processing}
                      </div>
                      <p className="text-xs text-gray-500">Customers being processed</p>
                      <div className="text-sm text-gray-700 mt-1">
                        {overview.queue_depth} in queue
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(overview.success_rate_24h)}%
                      </div>
                      <p className="text-xs text-gray-500">Last 24 hours</p>
                      <div className="text-sm text-gray-700 mt-1">
                        Avg: {Math.round(overview.average_processing_time)}min
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Extensions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {overview.active_extensions}
                      </div>
                      <p className="text-xs text-gray-500">Active extensions</p>
                      {overview.critical_alerts > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          {overview.critical_alerts} critical alerts
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        onClick={() => setActiveTab('live-monitoring')}
                        className="h-20 flex flex-col gap-2"
                      >
                        <div className="text-2xl">📊</div>
                        <div className="text-sm">Live Queue</div>
                      </Button>
                      
                      <Button 
                        onClick={() => setActiveTab('demo-access')}
                        className="h-20 flex flex-col gap-2"
                        variant="outline"
                      >
                        <div className="text-2xl">🎬</div>
                        <div className="text-sm">Watch Extensions</div>
                      </Button>
                      
                      <Button 
                        onClick={() => setActiveTab('data-flow')}
                        className="h-20 flex flex-col gap-2"
                        variant="outline"
                      >
                        <div className="text-2xl">🔍</div>
                        <div className="text-sm">Data Tracking</div>
                      </Button>
                      
                      <Button 
                        onClick={() => setActiveTab('health-monitor')}
                        className="h-20 flex flex-col gap-2"
                        variant="outline"
                      >
                        <div className="text-2xl">❤️</div>
                        <div className="text-sm">Health Monitor</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* System Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>System Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                      <div>
                        <div className="text-gray-600">Last Updated</div>
                        <div className="font-medium">{formatTimestamp(overview.last_updated)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Queue Depth</div>
                        <div className="font-medium">{overview.queue_depth} customers</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Processing Speed</div>
                        <div className="font-medium">{Math.round(overview.average_processing_time)} min/customer</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Alerts</div>
                        <div className={`font-medium ${overview.critical_alerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {overview.critical_alerts} critical
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Feature Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>What You Can Monitor</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Real-time queue processing status</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Live Chrome extension activity with screenshots</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Customer data flow from extraction to submission</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Extension health and performance metrics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Error logs with detailed debugging information</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transparency Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Screenshot capture of every directory submission</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Form data mapping and transformation logs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Test mode for watching automation in action</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Session recordings and activity timelines</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Data quality analysis and validation results</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="live-monitoring">
            <AutoBoltMonitoringDashboard />
          </TabsContent>

          <TabsContent value="demo-access">
            <ExtensionDemoAccess />
          </TabsContent>

          <TabsContent value="data-flow">
            <DataFlowTransparency />
          </TabsContent>

          <TabsContent value="health-monitor">
            <ExtensionHealthMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}