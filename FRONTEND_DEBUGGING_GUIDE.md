# Frontend Debugging Guide

This guide explains the comprehensive frontend debugging system that integrates with Shane's enhanced backend debugging tools for DirectoryBolt.

## Overview

The frontend debugging system provides:
- **Comprehensive API request/response logging**
- **Enhanced Stripe error handling and display**
- **Real-time debug dashboard**
- **Environment validation**
- **Client-side error recovery**
- **Developer debugging tools**

## Quick Start

### Enable Debug Mode

```javascript
// Method 1: URL Parameter
// Add ?debug=true to any URL
https://your-site.com/pricing?debug=true

// Method 2: Browser Console
apiDebugger.enableDebugMode(true)

// Method 3: Programmatically
import { useDebugMode } from '../lib/hooks/useDebugMode'
const { enableDebugMode } = useDebugMode()
enableDebugMode(true)
```

### View Debug Information

```javascript
// In browser console when debug mode is enabled:
apiDebugger.getSummary()           // View API call summary
apiDebugger.getDebugLogs()         // View all logged API calls  
apiDebugger.exportLogs()           // Export logs for support
apiDebugger.validateEnvironment()  // Check environment issues
```

## Components

### 1. StripeErrorDisplay

Enhanced error display component specifically for payment/Stripe errors.

```jsx
import { StripeErrorDisplay } from './ui/StripeErrorDisplay'

<StripeErrorDisplay
  error={stripeError}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
  showDebugInfo={debugMode}
  requestPayload={requestData}
  responseData={responseData}
  compact={false}
/>
```

**Features:**
- Displays specific Stripe error codes and types
- Shows configuration issues and environment problems
- Provides contextual recovery instructions
- Includes debug information panel
- Auto-generates support emails with error context

### 2. DebugDashboard

Comprehensive debugging dashboard for developers.

```jsx
import { DebugDashboard } from './ui/DebugDashboard'

<DebugDashboard 
  compact={false}
  autoHide={true}  // Hide in production unless debug=true
/>
```

**Features:**
- **Overview Tab**: API statistics, success rates, environment status
- **API Calls Tab**: Real-time request/response logging
- **Environment Tab**: Browser compatibility, protocol checks
- **Payments Tab**: Payment-specific environment validation

### 3. Enhanced CheckoutButton

The CheckoutButton component now includes comprehensive debugging.

```jsx
<CheckoutButton 
  plan="growth"
  showDebugInfo={true}  // Shows debug info in errors
  onSuccess={(data) => console.log('Success:', data)}
  onError={(error) => console.log('Error:', error)}
/>
```

**New Features:**
- Client-side validation before API calls
- Comprehensive request/response logging
- Enhanced error messages with specific details
- Debug panel showing request/response data
- Environment validation warnings

## Hooks

### useDebugMode

Provides debug mode state and utilities.

```jsx
import { useDebugMode } from '../lib/hooks/useDebugMode'

function MyComponent() {
  const {
    isDebugMode,
    toggleDebugMode,
    environmentValidation,
    apiLogs,
    clearApiLogs,
    exportDebugData,
    validatePaymentEnvironment
  } = useDebugMode()

  return (
    <div>
      <button onClick={toggleDebugMode}>
        {isDebugMode ? 'Disable' : 'Enable'} Debug
      </button>
      
      {environmentValidation.issues.length > 0 && (
        <div>Issues: {environmentValidation.issues.join(', ')}</div>
      )}
    </div>
  )
}
```

### useApiCall (Enhanced)

The useApiCall hook now provides enhanced error parsing and debugging.

```jsx
import { useCheckout } from '../lib/hooks/useApiCall'

function PaymentComponent() {
  const { createCheckoutSession, loading, error, data } = useCheckout()
  
  const handlePayment = async () => {
    const result = await createCheckoutSession('growth', {
      user_email: 'user@example.com',
      user_id: 'user_123'
    })
    
    // Result now includes debug information
    console.log('Request ID:', result._debug?.requestId)
  }
  
  // Error now includes enhanced Stripe-specific information
  if (error?.type === 'payment') {
    console.log('Stripe Code:', error.stripeCode)
    console.log('Configuration Issues:', error.configurationErrors)
  }
}
```

## Utilities

### ApiDebugger

Comprehensive API request/response logging utility.

```javascript
import { apiDebugger } from '../lib/utils/api-debugger'

// Start logging a request
const requestId = apiDebugger.startRequest('/api/checkout', 'POST', requestBody)

// End successful request
apiDebugger.endRequest(requestId, response, responseData)

// Log error
apiDebugger.logError(requestId, error)

// Get logs with filters
const logs = apiDebugger.getDebugLogs({
  url: '/api/checkout',
  hasError: true,
  since: new Date(Date.now() - 3600000) // Last hour
})
```

### Enhanced Error Parser

Parses backend error responses into frontend-friendly error objects.

```javascript
import { parseApiError } from '../lib/utils/enhanced-error-parser'

try {
  // API call
} catch (error) {
  const enhancedError = parseApiError(
    error, 
    requestId, 
    requestPayload, 
    responseData
  )
  
  // Enhanced error includes:
  // - Specific error codes and types
  // - Configuration issues
  // - Environment problems  
  // - Retry recommendations
  // - Support context
}
```

## Integration with Backend

### Error Response Format

The frontend expects enhanced error responses from Shane's backend:

```json
{
  "success": false,
  "error": {
    "message": "Stripe price ID not configured for plan: growth",
    "code": "STRIPE_CONFIG_MISSING",
    "type": "configuration",
    "statusCode": 503,
    "details": {
      "field": "stripe_price_id",
      "supportId": "support_123456",
      "stripeErrorCode": "price_not_found",
      "stripeErrorType": "invalid_request_error",
      "configurationIssues": [
        "Environment variable STRIPE_GROWTH_PRICE_ID is missing"
      ],
      "environmentValidation": {
        "has_stripe_key": false,
        "all_price_ids_set": false
      }
    }
  },
  "requestId": "req_123456789",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Request Logging

All API requests include enhanced logging:

```javascript
// Request logging includes:
- Full request URL and method
- Request headers and body
- Response status and headers  
- Response body (truncated if large)
- Request/response timing
- Error details with stack traces
- Request correlation IDs
```

## Error Types and Handling

### Stripe Errors

| Error Code | Display | Retry? | Action |
|------------|---------|---------|---------|
| `api_key_invalid` | Authentication Error | No | Contact support |
| `price_not_found` | Configuration Error | No | Try different plan |
| `rate_limit` | Too Many Requests | Yes | Wait 30 seconds |
| `card_declined` | Payment Declined | No | Try different card |
| `api_connection_error` | Connection Error | Yes | Check internet |

### Configuration Errors

| Error Code | Display | Action |
|------------|---------|---------|
| `STRIPE_CONFIG_MISSING` | Missing Configuration | Contact support |
| `STRIPE_PRODUCTION_CONFIG_ERROR` | Production Config Issue | Contact support |
| `STRIPE_AUTH_ERROR` | Authentication Failed | Contact support |

### Environment Issues

| Issue | Display | Action |
|-------|---------|---------|
| No HTTPS in production | Security Issue | Enable HTTPS |
| Debug mode in production | Security Warning | Disable debug |
| Missing browser features | Compatibility Issue | Update browser |

## Debugging Workflows

### 1. Payment Debugging

```javascript
// Enable debug mode
apiDebugger.enableDebugMode(true)

// Attempt payment
try {
  const result = await createCheckoutSession('growth', payload)
} catch (error) {
  // Error now includes:
  console.log('Request ID:', error.requestId)
  console.log('Stripe Code:', error.stripeCode)  
  console.log('Config Issues:', error.configurationErrors)
  console.log('Environment Issues:', error.environmentIssues)
  console.log('Retry Recommendations:', error.retryRecommendations)
}

// Export logs for support
apiDebugger.exportLogs()
```

### 2. Environment Validation

```javascript
const validation = apiDebugger.validateEnvironment()

if (!validation.isValid) {
  console.error('Environment Issues:', validation.issues)
  console.warn('Environment Warnings:', validation.warnings)
}

// Payment-specific validation
const paymentValidation = validatePaymentEnvironment()
if (!paymentValidation.isValid) {
  console.error('Payment Issues:', paymentValidation.issues)
}
```

### 3. Support Data Collection

```javascript
// Collect comprehensive debug data
const debugData = {
  logs: apiDebugger.exportLogs(),
  environment: apiDebugger.validateEnvironment(),
  summary: apiDebugger.getSummary(),
  paymentValidation: validatePaymentEnvironment(),
  userAgent: navigator.userAgent,
  url: window.location.href,
  timestamp: new Date().toISOString()
}

// Export for support ticket
console.log('Debug Data for Support:', debugData)
```

## Best Practices

### Development
- Always enable debug mode during development
- Use the debug dashboard to monitor API calls
- Test error scenarios to ensure proper error handling
- Validate environment configuration before deployment

### Production  
- Debug mode should be disabled by default
- Use URL parameter `?debug=true` for troubleshooting
- Monitor error logs for configuration issues
- Ensure HTTPS is enabled for payments

### Error Handling
- Always use StripeErrorDisplay for payment errors
- Provide specific retry recommendations
- Include request IDs in error messages
- Generate pre-filled support emails with context

### Performance
- Debug logging has minimal performance impact
- Logs are automatically trimmed to prevent memory leaks
- Large response bodies are truncated in logs
- Background logging doesn't block UI interactions

## Troubleshooting

### Common Issues

**Debug mode not working**
```javascript
// Check if debug mode is properly enabled
console.log('Debug mode:', apiDebugger.isDebugMode())

// Enable explicitly
apiDebugger.enableDebugMode(true)

// Check localStorage
console.log('Debug storage:', localStorage.getItem('directorybolt_debug'))
```

**Errors not showing enhanced information**
```javascript
// Ensure error is being parsed correctly
const error = parseApiError(originalError, requestId, payload, response)
console.log('Parsed error:', error)
```

**Missing API logs**
```javascript
// Check if requests are being logged
const logs = apiDebugger.getDebugLogs()
console.log('Total logs:', logs.length)

// Clear and retry
apiDebugger.clearLogs()
```

### Support Data Export

When contacting support, always include:

1. **Debug logs export**: `apiDebugger.exportLogs()`
2. **Environment validation**: `apiDebugger.validateEnvironment()`
3. **Payment validation**: `validatePaymentEnvironment()`
4. **Error details**: Full error object with request ID
5. **Browser information**: User agent and URL
6. **Reproduction steps**: What actions led to the error

This comprehensive debugging system ensures that both users and developers can quickly identify and resolve payment and API issues, with detailed information available for support when needed.