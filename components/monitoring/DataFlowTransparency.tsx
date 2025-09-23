import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ScrollArea } from '../ui/scroll-area'
import { Progress } from '../ui/progress'

interface CustomerDataFlow {
  customer_id: string
  customer_name: string
  extraction_status: 'pending' | 'extracting' | 'completed' | 'failed'
  extracted_data: ExtractedBusinessData
  directory_submissions: DirectorySubmissionFlow[]
  data_quality_score: number
  extraction_timestamp: string
  processing_notes: string[]
}

interface ExtractedBusinessData {
  website_url: string
  business_name: string
  description: string
  phone: string
  email: string
  address: string
  category: string
  hours: string
  social_media: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
  additional_fields: Record<string, any>
  confidence_scores: Record<string, number>
  extraction_method: 'ai_analysis' | 'website_scrape' | 'user_provided'
}

interface DirectorySubmissionFlow {
  submission_id: string
  directory_name: string
  directory_url: string
  status: 'pending' | 'mapping' | 'filling' | 'submitting' | 'verifying' | 'completed' | 'failed'
  mapped_fields: MappedField[]
  submission_attempts: SubmissionAttempt[]
  current_step: string
  estimated_completion: string
  data_transformations: DataTransformation[]
  validation_results: ValidationResult[]
}

interface MappedField {
  field_name: string
  directory_field: string
  source_data: any
  transformed_data: any
  confidence: number
  validation_status: 'valid' | 'warning' | 'error'
  transformation_applied?: string
}

interface SubmissionAttempt {
  attempt_id: string
  timestamp: string
  status: 'success' | 'failed' | 'pending'
  error_message?: string
  screenshots: string[]
  form_data_sent: Record<string, any>
  response_received?: Record<string, any>
  processing_time_ms: number
}

interface DataTransformation {
  field: string
  original_value: any
  transformed_value: any
  transformation_type: 'format' | 'validation' | 'enhancement' | 'mapping'
  reason: string
  confidence: number
}

interface ValidationResult {
  field: string
  status: 'pass' | 'warning' | 'fail'
  message: string
  suggested_fix?: string
}

export default function DataFlowTransparency() {
  const [customerFlows, setCustomerFlows] = useState<CustomerDataFlow[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'live' | 'archived'>('live')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCustomerFlows()
    const interval = setInterval(fetchCustomerFlows, 5000)
    return () => clearInterval(interval)
  }, [viewMode, searchQuery])

  const fetchCustomerFlows = async () => {
    try {
      const params = new URLSearchParams({
        mode: viewMode,
        search: searchQuery,
        limit: '50'
      })

      const response = await fetch(`/api/autobolt/data-flows?${params}`, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_AUTOBOLT_API_KEY || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCustomerFlows(data.flows || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch customer flows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportDataFlow = async (customerId: string) => {
    try {
      const response = await fetch(`/api/autobolt/export-data-flow/${customerId}`, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_AUTOBOLT_API_KEY || ''
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data-flow-${customerId}.json`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data flow:', error)
    }
  }

  const reprocessCustomerData = async (customerId: string) => {
    try {
      await fetch(`/api/autobolt/reprocess-data/${customerId}`, {
        method: 'POST',
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_AUTOBOLT_API_KEY || ''
        }
      })
      
      fetchCustomerFlows()
    } catch (error) {
      console.error('Failed to reprocess customer data:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'extracting': case 'mapping': case 'filling': case 'submitting': case 'verifying': 
        return 'bg-blue-500'
      case 'pending': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const selectedCustomerData = selectedCustomer 
    ? customerFlows.find(f => f.customer_id === selectedCustomer)
    : null

  const selectedSubmissionData = selectedSubmission && selectedCustomerData
    ? selectedCustomerData.directory_submissions.find(s => s.submission_id === selectedSubmission)
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading data flow information...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Flow Transparency</h1>
          <p className="text-gray-600 mt-1">Track how customer data flows through the AutoBolt system</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as 'live' | 'archived')}
            className="border rounded px-3 py-2"
          >
            <option value="live">Live Processing</option>
            <option value="archived">Completed Jobs</option>
          </select>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-2 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Customer Data Flows</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {customerFlows.length > 0 ? (
                    customerFlows.map((flow) => (
                      <div
                        key={flow.customer_id}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedCustomer === flow.customer_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCustomer(flow.customer_id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm">{flow.customer_name}</div>
                          <Badge className={getStatusColor(flow.extraction_status)}>
                            {flow.extraction_status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          Quality Score: <span className={getConfidenceColor(flow.data_quality_score)}>
                            {Math.round(flow.data_quality_score * 100)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {flow.directory_submissions.length} directories
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTimestamp(flow.extraction_timestamp)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <div className="text-2xl mb-2">📊</div>
                      <p className="text-sm">No data flows found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Flow Details */}
        <div className="lg:col-span-2">
          {selectedCustomerData ? (
            <Tabs defaultValue="data-extraction" className="w-full">
              <TabsList>
                <TabsTrigger value="data-extraction">Data Extraction</TabsTrigger>
                <TabsTrigger value="directory-mapping">Directory Mapping</TabsTrigger>
                <TabsTrigger value="submission-tracking">Submission Tracking</TabsTrigger>
                <TabsTrigger value="quality-analysis">Quality Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="data-extraction" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Extracted Business Data - {selectedCustomerData.customer_name}</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => exportDataFlow(selectedCustomerData.customer_id)}
                      >
                        Export Data
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => reprocessCustomerData(selectedCustomerData.customer_id)}
                      >
                        Reprocess
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Website URL</label>
                          <div className="text-sm">{selectedCustomerData.extracted_data.website_url}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Business Name</label>
                          <div className="text-sm">{selectedCustomerData.extracted_data.business_name}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Phone</label>
                          <div className="text-sm">{selectedCustomerData.extracted_data.phone}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <div className="text-sm">{selectedCustomerData.extracted_data.email}</div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Description</label>
                        <div className="text-sm bg-gray-50 p-3 rounded">
                          {selectedCustomerData.extracted_data.description}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <div className="text-sm">{selectedCustomerData.extracted_data.address}</div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Data Confidence Scores</label>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          {Object.entries(selectedCustomerData.extracted_data.confidence_scores).map(([field, score]) => (
                            <div key={field} className="text-center">
                              <div className={`text-lg font-semibold ${getConfidenceColor(score)}`}>
                                {Math.round(score * 100)}%
                              </div>
                              <div className="text-xs text-gray-500">{field}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedCustomerData.processing_notes.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Processing Notes</label>
                          <div className="space-y-1 mt-2">
                            {selectedCustomerData.processing_notes.map((note, index) => (
                              <div key={index} className="text-sm bg-yellow-50 p-2 rounded">
                                {note}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="directory-mapping" className="space-y-4">
                <div className="grid gap-4">
                  {selectedCustomerData.directory_submissions.map((submission) => (
                    <Card 
                      key={submission.submission_id}
                      className={`cursor-pointer transition-colors ${
                        selectedSubmission === submission.submission_id
                          ? 'border-blue-500 bg-blue-50'
                          : ''
                      }`}
                      onClick={() => setSelectedSubmission(submission.submission_id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{submission.directory_name}</CardTitle>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600">
                            Current Step: {submission.current_step}
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-2">Field Mappings</div>
                            <div className="space-y-2">
                              {submission.mapped_fields.slice(0, 3).map((field) => (
                                <div key={field.field_name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="text-sm">
                                    {field.field_name} → {field.directory_field}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={field.validation_status === 'valid' ? 'default' : 'destructive'}>
                                      {field.validation_status}
                                    </Badge>
                                    <span className={`text-xs ${getConfidenceColor(field.confidence)}`}>
                                      {Math.round(field.confidence * 100)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {submission.mapped_fields.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{submission.mapped_fields.length - 3} more fields
                                </div>
                              )}
                            </div>
                          </div>

                          {submission.estimated_completion && (
                            <div className="text-xs text-gray-500">
                              Est. completion: {formatTimestamp(submission.estimated_completion)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="submission-tracking" className="space-y-4">
                {selectedSubmissionData ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Details - {selectedSubmissionData.directory_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="text-sm font-medium mb-3">Submission Attempts</div>
                          <div className="space-y-3">
                            {selectedSubmissionData.submission_attempts.map((attempt) => (
                              <div 
                                key={attempt.attempt_id}
                                className={`p-4 border rounded ${
                                  attempt.status === 'success' ? 'border-green-200 bg-green-50' :
                                  attempt.status === 'failed' ? 'border-red-200 bg-red-50' :
                                  'border-yellow-200 bg-yellow-50'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={getStatusColor(attempt.status)}>
                                    {attempt.status}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {formatTimestamp(attempt.timestamp)}
                                  </span>
                                </div>
                                
                                {attempt.error_message && (
                                  <div className="text-sm text-red-600 mb-2">
                                    Error: {attempt.error_message}
                                  </div>
                                )}

                                <div className="text-sm text-gray-600 mb-2">
                                  Processing time: {attempt.processing_time_ms}ms
                                </div>

                                {attempt.screenshots.length > 0 && (
                                  <div className="flex gap-2">
                                    {attempt.screenshots.map((screenshot, index) => (
                                      <Button
                                        key={index}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(screenshot, '_blank')}
                                      >
                                        Screenshot {index + 1}
                                      </Button>
                                    ))}
                                  </div>
                                )}

                                <details className="mt-3">
                                  <summary className="text-xs text-blue-600 cursor-pointer">View Form Data</summary>
                                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                                    {JSON.stringify(attempt.form_data_sent, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium mb-3">Data Transformations</div>
                          <div className="space-y-2">
                            {selectedSubmissionData.data_transformations.map((transform, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{transform.field}</span>
                                  <Badge variant="outline">{transform.transformation_type}</Badge>
                                </div>
                                <div className="text-xs text-gray-600 mb-1">
                                  {transform.original_value} → {transform.transformed_value}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {transform.reason} (Confidence: {Math.round(transform.confidence * 100)}%)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="text-4xl mb-4">📋</div>
                      <h3 className="text-lg font-medium">Select a Directory</h3>
                      <p className="text-gray-600 mt-2">Choose a directory submission to view detailed tracking</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="quality-analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Quality Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {Math.round(selectedCustomerData.data_quality_score * 100)}%
                        </div>
                        <div className="text-lg font-medium">Overall Quality Score</div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-3">Field Validation Results</div>
                        <div className="space-y-2">
                          {selectedCustomerData.directory_submissions
                            .flatMap(s => s.validation_results)
                            .map((result, index) => (
                              <div 
                                key={index}
                                className={`p-3 border rounded ${
                                  result.status === 'pass' ? 'border-green-200 bg-green-50' :
                                  result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                                  'border-red-200 bg-red-50'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{result.field}</span>
                                  <Badge 
                                    className={
                                      result.status === 'pass' ? 'bg-green-500' :
                                      result.status === 'warning' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }
                                  >
                                    {result.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-700">{result.message}</div>
                                {result.suggested_fix && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    Suggestion: {result.suggested_fix}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-3">Data Completeness</div>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(selectedCustomerData.extracted_data.confidence_scores).map(([field, score]) => (
                            <div key={field}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{field}</span>
                                <span>{Math.round(score * 100)}%</span>
                              </div>
                              <Progress value={score * 100} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">👆</div>
                <h3 className="text-lg font-medium">Select a Customer</h3>
                <p className="text-gray-600 mt-2">Choose a customer to view their data flow details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}