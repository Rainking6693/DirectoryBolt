# User Agent Fix - Testing Instructions

This document provides comprehensive instructions for testing the userAgent fix in the `/api/analyze` endpoint after implementation.

## Overview

The userAgent fix ensures that:
1. User-Agent headers are properly extracted from incoming requests
2. The user agent is correctly passed to the OptimizedScraper
3. The scraper uses the appropriate user agent when making requests to target websites
4. Fallback to default user agent when none is provided
5. Proper handling of edge cases and malicious user agents

## Test Suite Structure

### 1. Main Test Files

- **`analyze-endpoint-comprehensive-test.js`** - Complete endpoint testing including userAgent scenarios
- **`user-agent-validation-test.js`** - Focused user agent specific testing  
- **`scraper-user-agent-integration-test.js`** - Integration testing between API and scraper

### 2. Test Categories

1. **Basic Functionality Tests**
   - HTTP method validation
   - Request structure validation
   - Response format validation

2. **User Agent Handling Tests**
   - Custom user agent acceptance
   - Missing user agent handling
   - User agent propagation to scraper
   - Bot detection bypass

3. **URL Input Validation Tests**
   - Valid URL formats (HTTP/HTTPS, with/without www, paths, queries)
   - International domain names
   - Invalid URLs and security attempts
   - Edge cases and malformed URLs

4. **Web Scraping Integration Tests**
   - Real website scraping with different user agents
   - HTTPS redirect handling
   - Content-type validation
   - Large website handling

5. **Error Scenario Tests**
   - Non-existent domains
   - Connection timeouts
   - HTTP error statuses
   - Network resilience

6. **Performance Tests**
   - Response time under normal load
   - Concurrent request handling
   - Memory efficiency

## Running the Tests

### Prerequisites

1. **Start the DirectoryBolt server locally**:
   ```bash
   cd /path/to/DirectoryBolt
   npm run dev
   # or
   npm start
   ```
   Server should be running on `http://localhost:3000`

2. **Install test dependencies** (if not already installed):
   ```bash
   npm install axios
   ```

### Running Individual Test Suites

#### 1. Comprehensive Endpoint Test
```bash
# Run all endpoint tests
node tests/analyze-endpoint-comprehensive-test.js

# With environment variables
TEST_BASE_URL=http://localhost:3000 REAL_REQUESTS=true node tests/analyze-endpoint-comprehensive-test.js

# Mock mode (for testing without server)
REAL_REQUESTS=false node tests/analyze-endpoint-comprehensive-test.js
```

#### 2. User Agent Specific Tests
```bash
# Run user agent focused tests
node tests/user-agent-validation-test.js

# With custom base URL
TEST_BASE_URL=http://localhost:3000 node tests/user-agent-validation-test.js
```

#### 3. Integration Tests
```bash
# Run scraper integration tests
node tests/scraper-user-agent-integration-test.js

# Verbose output
VERBOSE=true node tests/scraper-user-agent-integration-test.js
```

### Running All Tests Together

Use the test runner script:
```bash
node tests/run-user-agent-tests.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_BASE_URL` | `http://localhost:3000` | Base URL of the API server |
| `REAL_REQUESTS` | `true` | Whether to make real HTTP requests or use mocks |
| `VERBOSE` | `true` | Enable detailed test output |
| `TEST_TIMEOUT` | `30000` | Timeout for individual tests (ms) |

## Expected Test Results

### ✅ All Tests Passing (User Agent Fix Working)

When the user agent fix is working correctly, you should see:

```
📊 OVERALL RESULTS:
   Total Tests: 45
   ✅ Passed: 43
   ❌ Failed: 2
   💥 Errors: 0
   🎯 Success Rate: 95.6%

🔧 USER AGENT FIX ASSESSMENT:
   ✅ EXCELLENT: User Agent handling is working correctly
   🎉 The userAgent fix appears to be fully functional
```

### ❌ Tests Failing (User Agent Fix Needs Work)

If tests are failing, look for patterns:

```
📊 OVERALL RESULTS:
   Total Tests: 45
   ✅ Passed: 25
   ❌ Failed: 15
   💥 Errors: 5
   🎯 Success Rate: 55.6%

🚨 CRITICAL ISSUES:
   1. User Agent: Custom User-Agent passing
   2. Scraper UA: User-Agent passed to target website
```

## Manual Testing

### Quick Manual Tests

You can also test manually using curl or a REST client:

#### 1. Basic Request with Custom User Agent
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "User-Agent: DirectoryBolt-Test/1.0" \
  -d '{"url": "https://httpbin.org/user-agent"}'
```

#### 2. Request without User Agent
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "User-Agent:" \
  -d '{"url": "https://example.com"}'
```

#### 3. Request with Browser User Agent
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  -d '{"url": "https://example.com"}'
```

### Expected Response Format

#### Successful Response (202 Accepted)
```json
{
  "success": true,
  "analysisId": "req_1703567890_abc123",
  "status": "initiated",
  "progressEndpoint": "/api/analyze/progress?requestId=req_1703567890_abc123",
  "estimatedDuration": "30-120 seconds",
  "url": "https://example.com",
  "tier": "free"
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid URL format",
    "statusCode": 400
  },
  "requestId": "req_1703567890_xyz789"
}
```

## Debugging Failed Tests

### Common Issues and Solutions

#### 1. Connection Refused Errors
**Issue**: Tests fail with "ECONNREFUSED"
**Solution**: 
- Ensure the DirectoryBolt server is running
- Check the TEST_BASE_URL is correct
- Verify port 3000 is not blocked by firewall

#### 2. User Agent Not Being Passed
**Issue**: User agent tests fail, indicating UA not reaching scraper
**Potential causes**:
- Check `OptimizedScraper` configuration in `lib/services/optimized-scraper.ts`
- Verify user agent is extracted correctly in `pages/api/analyze.ts` line 104
- Confirm user agent is passed to scraper in line 356

#### 3. High Failure Rate on Real Websites
**Issue**: Tests pass with httpbin.org but fail with real websites
**Solutions**:
- Check network connectivity
- Verify DNS resolution
- Test with REAL_REQUESTS=false to isolate issues

#### 4. Timeout Issues
**Issue**: Tests timeout frequently
**Solutions**:
- Increase TEST_TIMEOUT environment variable
- Check if server is overloaded
- Test with simpler URLs first

### Debugging Steps

1. **Check server logs** while running tests
2. **Run tests with VERBOSE=true** for detailed output
3. **Test individual components**:
   ```bash
   # Test just basic functionality
   node -e "
   const test = require('./tests/analyze-endpoint-comprehensive-test.js');
   const suite = new test({realRequests: true});
   suite.testBasicEndpointFunctionality().then(() => console.log('Basic tests done'));
   "
   ```

## Test Result Interpretation

### Success Rate Guidelines

- **95-100%**: Excellent - User agent fix is working perfectly
- **85-94%**: Good - Minor issues that don't affect core functionality  
- **70-84%**: Warning - Some issues need attention
- **Below 70%**: Critical - Major problems with user agent handling

### Key Metrics to Watch

1. **User Agent category success rate** - Should be >90%
2. **Scraper integration success rate** - Should be >85%
3. **Basic functionality success rate** - Should be 100%
4. **Average response time** - Should be <2000ms for simple sites

## Production Verification

After tests pass locally, verify in production:

1. **Deploy the fix** to staging/production
2. **Monitor logs** for user agent related errors
3. **Test with real traffic** using the same test URLs
4. **Check analytics** for any changes in success rates

### Production Test Commands

```bash
# Test production endpoint
TEST_BASE_URL=https://your-production-domain.com node tests/user-agent-validation-test.js

# Quick production check
curl -X POST https://your-production-domain.com/api/analyze \
  -H "Content-Type: application/json" \
  -H "User-Agent: ProductionTest/1.0" \
  -d '{"url": "https://example.com"}'
```

## Continuous Integration

To integrate these tests into CI/CD:

```yaml
# Example GitHub Actions step
- name: Test User Agent Fix
  run: |
    npm start &
    sleep 10  # Wait for server to start
    node tests/run-user-agent-tests.js
  env:
    TEST_BASE_URL: http://localhost:3000
    REAL_REQUESTS: true
    VERBOSE: false
```

## Troubleshooting Guide

### Test Environment Issues

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Server not running | Start the DirectoryBolt server |
| `Test timeout` | Server overloaded | Increase timeout or restart server |
| `404 Not Found` | Wrong endpoint | Check server routes are properly set up |
| `Method not allowed` | Wrong HTTP method | Verify POST method is used |

### User Agent Specific Issues

| Symptom | Likely Cause | Fix Location |
|---------|--------------|-------------|
| All UA tests fail | User agent not extracted | `pages/api/analyze.ts` line 104 |
| UA not reaching scraper | Not passed to scraper config | `pages/api/analyze.ts` line 356 |
| Scraper not using UA | Scraper config issue | `lib/services/optimized-scraper.ts` line 404 |
| Custom UA ignored | Header processing issue | Check request header extraction |

## Support and Reporting

If tests consistently fail after following this guide:

1. **Collect test output** with VERBOSE=true
2. **Check server logs** during test execution  
3. **Document the specific failing tests**
4. **Include environment details** (OS, Node version, etc.)
5. **Report the issue** with all collected information

---

## Quick Reference

### Test Commands
```bash
# Run all tests
node tests/run-user-agent-tests.js

# Individual test suites  
node tests/analyze-endpoint-comprehensive-test.js
node tests/user-agent-validation-test.js
node tests/scraper-user-agent-integration-test.js

# With environment variables
TEST_BASE_URL=http://localhost:3000 REAL_REQUESTS=true VERBOSE=true node tests/analyze-endpoint-comprehensive-test.js
```

### Expected Success Rates
- Overall: >90%
- User Agent Tests: >90%  
- Basic Functionality: 100%
- Integration Tests: >85%