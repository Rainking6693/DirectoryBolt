/**
 * Comprehensive Analysis Workflow Test Suite for DirectoryBolt
 * 
 * Tests the complete end-to-end analysis workflow:
 * 1. URL submission from homepage
 * 2. Analysis API processing with real data
 * 3. Metrics calculation and validation
 * 4. Results page display
 * 5. Multiple website type testing
 * 
 * Created: 2025-08-27
 * Purpose: Validate Shane's fixes to return real calculated data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_RESULTS_FILE = path.join(__dirname, 'workflow_test_results.json');

// Test websites representing different business types
const TEST_WEBSITES = [
  {
    category: 'Small Business - Local Restaurant',
    url: 'https://www.joesitalian.com',
    expectedFields: ['title', 'description', 'seoScore', 'visibility', 'potentialLeads'],
    minSeoScore: 20,
    maxSeoScore: 90
  },
  {
    category: 'E-commerce - Online Store',
    url: 'https://www.etsy.com/shop/handmadecrafts',
    expectedFields: ['title', 'description', 'seoScore', 'visibility', 'potentialLeads'],
    minSeoScore: 40,
    maxSeoScore: 95
  },
  {
    category: 'Service Business - Marketing Agency',
    url: 'https://www.hubspot.com',
    expectedFields: ['title', 'description', 'seoScore', 'visibility', 'potentialLeads'],
    minSeoScore: 60,
    maxSeoScore: 100
  },
  {
    category: 'Professional Services - Law Firm',
    url: 'https://www.findlaw.com',
    expectedFields: ['title', 'description', 'seoScore', 'visibility', 'potentialLeads'],
    minSeoScore: 50,
    maxSeoScore: 95
  },
  {
    category: 'Healthcare - Medical Practice',
    url: 'https://www.mayoclinic.org',
    expectedFields: ['title', 'description', 'seoScore', 'visibility', 'potentialLeads'],
    minSeoScore: 70,
    maxSeoScore: 100
  },
  {
    category: 'Technology - Software Company',
    url: 'https://www.github.com',
    expectedFields: ['title', 'description', 'seoScore', 'visibility', 'potentialLeads'],
    minSeoScore: 80,
    maxSeoScore: 100
  }
];

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  tests: [],
  issues: [],
  recommendations: []
};

// Utility functions
function logTest(category, name, status, details = {}) {
  const test = {
    category,
    name,
    status,
    timestamp: new Date().toISOString(),
    details
  };
  
  testResults.tests.push(test);
  testResults.summary.totalTests++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${category} - ${name}`);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    console.log(`❌ ${category} - ${name}`);
    if (details.error) console.log(`   Error: ${details.error}`);
  } else if (status === 'WARNING') {
    testResults.summary.warnings++;
    console.log(`⚠️  ${category} - ${name}`);
    if (details.warning) console.log(`   Warning: ${details.warning}`);
  }
  
  if (details.metrics) {
    console.log(`   Metrics: ${JSON.stringify(details.metrics, null, 2)}`);
  }
}

function addIssue(severity, title, description, recommendation = null) {
  testResults.issues.push({
    severity,
    title,
    description,
    timestamp: new Date().toISOString()
  });
  
  if (recommendation) {
    testResults.recommendations.push({
      issue: title,
      recommendation,
      priority: severity === 'critical' ? 'high' : severity === 'major' ? 'medium' : 'low'
    });
  }
}

// Test functions
async function testApiEndpoint() {
  console.log('\n📡 Testing Analysis API Endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    
    if (response.status === 200) {
      logTest('Infrastructure', 'API Health Check', 'PASS', {
        statusCode: response.status,
        responseTime: response.headers['x-response-time']
      });
    } else {
      logTest('Infrastructure', 'API Health Check', 'FAIL', {
        statusCode: response.status,
        error: 'Unexpected status code'
      });
    }
  } catch (error) {
    logTest('Infrastructure', 'API Health Check', 'FAIL', {
      error: error.message
    });
    addIssue('critical', 'API Endpoint Unavailable', 'The analysis API endpoint is not responding', 'Check server status and restart if necessary');
  }
}

async function testAnalysisWorkflow(website) {
  console.log(`\n🔍 Testing Analysis Workflow for ${website.category}...`);
  console.log(`   URL: ${website.url}`);
  
  try {
    const startTime = Date.now();
    
    // Submit analysis request
    const response = await axios.post(`${BASE_URL}/api/analyze`, {
      url: website.url,
      options: JSON.stringify({
        deep: false,
        includeCompetitors: false,
        checkDirectories: true
      })
    }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Test/1.0'
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    // Test 1: Response Status
    if (response.status === 200) {
      logTest(website.category, 'API Response Status', 'PASS', {
        statusCode: response.status,
        processingTime: `${processingTime}ms`
      });
    } else {
      logTest(website.category, 'API Response Status', 'FAIL', {
        statusCode: response.status,
        error: 'Unexpected status code'
      });
      return;
    }
    
    const data = response.data?.data;
    
    if (!data) {
      logTest(website.category, 'Response Data Structure', 'FAIL', {
        error: 'No data field in response'
      });
      return;
    }
    
    // Test 2: Required Fields Present
    const missingFields = [];
    for (const field of website.expectedFields) {
      if (data[field] === undefined || data[field] === null) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length === 0) {
      logTest(website.category, 'Required Fields Present', 'PASS', {
        fields: website.expectedFields
      });
    } else {
      logTest(website.category, 'Required Fields Present', 'FAIL', {
        error: `Missing fields: ${missingFields.join(', ')}`
      });
    }
    
    // Test 3: Real Data Validation (not placeholder)
    const dataQuality = validateDataQuality(data, website);
    if (dataQuality.isReal) {
      logTest(website.category, 'Real Data Extraction', 'PASS', {
        metrics: {
          title: data.title?.substring(0, 50) + '...',
          titleLength: data.title?.length,
          hasDescription: !!data.description && data.description !== 'No description found',
          seoScore: data.seoScore,
          visibility: data.visibility,
          potentialLeads: data.potentialLeads,
          directoryCount: data.directoryOpportunities?.length || 0
        }
      });
    } else {
      logTest(website.category, 'Real Data Extraction', 'WARNING', {
        warning: dataQuality.issues.join(', '),
        metrics: {
          title: data.title?.substring(0, 50),
          seoScore: data.seoScore,
          visibility: data.visibility
        }
      });
    }
    
    // Test 4: Metrics Calculation Validation
    const metricsValid = validateMetricsCalculation(data, website);
    if (metricsValid.valid) {
      logTest(website.category, 'Metrics Calculation', 'PASS', {
        metrics: {
          seoScore: data.seoScore,
          visibility: data.visibility,
          potentialLeads: data.potentialLeads,
          missedOpportunities: data.missedOpportunities,
          currentListings: data.currentListings
        }
      });
    } else {
      logTest(website.category, 'Metrics Calculation', 'FAIL', {
        error: metricsValid.issues.join(', '),
        metrics: {
          seoScore: data.seoScore,
          visibility: data.visibility,
          potentialLeads: data.potentialLeads
        }
      });
    }
    
    // Test 5: Directory Opportunities
    if (data.directoryOpportunities && Array.isArray(data.directoryOpportunities)) {
      const opportunityCount = data.directoryOpportunities.length;
      if (opportunityCount > 0) {
        logTest(website.category, 'Directory Opportunities', 'PASS', {
          count: opportunityCount,
          sample: data.directoryOpportunities.slice(0, 3).map(d => ({
            name: d.name,
            authority: d.authority,
            cost: d.cost
          }))
        });
      } else {
        logTest(website.category, 'Directory Opportunities', 'WARNING', {
          warning: 'No directory opportunities found'
        });
      }
    } else {
      logTest(website.category, 'Directory Opportunities', 'FAIL', {
        error: 'Directory opportunities field missing or invalid'
      });
    }
    
    // Test 6: Issues and Recommendations
    if (data.issues && Array.isArray(data.issues) && data.issues.length > 0) {
      logTest(website.category, 'Issues Generation', 'PASS', {
        count: data.issues.length,
        sample: data.issues.slice(0, 2).map(i => ({
          type: i.type,
          title: i.title
        }))
      });
    } else {
      logTest(website.category, 'Issues Generation', 'WARNING', {
        warning: 'No issues identified or issues field missing'
      });
    }
    
    if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
      logTest(website.category, 'Recommendations Generation', 'PASS', {
        count: data.recommendations.length,
        sample: data.recommendations.slice(0, 2).map(r => ({
          action: r.action?.substring(0, 50) + '...',
          effort: r.effort
        }))
      });
    } else {
      logTest(website.category, 'Recommendations Generation', 'WARNING', {
        warning: 'No recommendations generated or recommendations field missing'
      });
    }
    
  } catch (error) {
    logTest(website.category, 'Analysis Workflow', 'FAIL', {
      error: error.message,
      code: error.code,
      status: error.response?.status
    });
    
    if (error.code === 'ECONNREFUSED') {
      addIssue('critical', 'Server Connection Failed', `Cannot connect to server at ${BASE_URL}`, 'Ensure the Next.js development server is running');
    } else if (error.response?.status === 429) {
      addIssue('major', 'Rate Limit Exceeded', 'Too many requests to analysis API', 'Implement request throttling in tests');
    } else if (error.code === 'ENOTFOUND') {
      addIssue('critical', 'DNS Resolution Failed', `Cannot resolve hostname: ${website.url}`, 'Check internet connection and URL validity');
    }
  }
}

function validateDataQuality(data, website) {
  const issues = [];
  let isReal = true;
  
  // Check if title looks real
  if (!data.title || data.title === 'No title found' || data.title.length < 5) {
    issues.push('Title appears to be placeholder or missing');
    isReal = false;
  }
  
  // Check if description looks real
  if (!data.description || data.description === 'No description found' || data.description.length < 20) {
    issues.push('Description appears to be placeholder or missing');
  }
  
  // Check if SEO score is calculated (not a round number)
  if (data.seoScore !== undefined && (data.seoScore === 50 || data.seoScore === 0 || data.seoScore === 100)) {
    issues.push('SEO score appears to be a default value');
  }
  
  // Check if visibility score makes sense
  if (data.visibility !== undefined && (data.visibility < 0 || data.visibility > 100)) {
    issues.push('Visibility score is out of valid range');
    isReal = false;
  }
  
  // Check if potential leads is a reasonable number
  if (data.potentialLeads !== undefined && (data.potentialLeads < 0 || data.potentialLeads > 10000)) {
    issues.push('Potential leads number seems unrealistic');
  }
  
  return { isReal, issues };
}

function validateMetricsCalculation(data, website) {
  const issues = [];
  let valid = true;
  
  // SEO Score validation
  if (data.seoScore < 0 || data.seoScore > 100) {
    issues.push('SEO score out of range (0-100)');
    valid = false;
  }
  
  // Visibility validation
  if (data.visibility < 0 || data.visibility > 100) {
    issues.push('Visibility score out of range (0-100)');
    valid = false;
  }
  
  // Potential leads validation
  if (data.potentialLeads < 0) {
    issues.push('Potential leads cannot be negative');
    valid = false;
  }
  
  // Current listings validation
  if (data.currentListings < 0) {
    issues.push('Current listings count cannot be negative');
    valid = false;
  }
  
  // Missed opportunities validation
  if (data.missedOpportunities < 0) {
    issues.push('Missed opportunities count cannot be negative');
    valid = false;
  }
  
  // Cross-field validation
  if (data.directoryOpportunities && data.missedOpportunities !== undefined) {
    const expectedMissed = data.directoryOpportunities.filter(d => !d.listed).length;
    if (Math.abs(data.missedOpportunities - expectedMissed) > 5) {
      issues.push('Missed opportunities count inconsistent with directory data');
    }
  }
  
  return { valid, issues };
}

async function testResultsPageDisplay() {
  console.log('\n🎨 Testing Results Page Display...');
  
  try {
    // Test that results page exists and loads
    const response = await axios.get(`${BASE_URL}/results`, {
      headers: {
        'User-Agent': 'DirectoryBolt-Test/1.0'
      }
    });
    
    if (response.status === 200) {
      logTest('UI', 'Results Page Accessibility', 'PASS', {
        statusCode: response.status,
        contentLength: response.data.length
      });
      
      // Check for volt yellow theme indicators in HTML
      const html = response.data;
      const hasVoltYellow = html.includes('yellow') || 
                           html.includes('#FFFF00') || 
                           html.includes('bg-yellow') || 
                           html.includes('text-yellow');
      
      if (hasVoltYellow) {
        logTest('UI', 'Volt Yellow Theme Present', 'PASS', {
          themeIndicators: 'Found yellow color references in HTML'
        });
      } else {
        logTest('UI', 'Volt Yellow Theme Present', 'WARNING', {
          warning: 'Could not detect volt yellow theme in HTML'
        });
      }
    } else {
      logTest('UI', 'Results Page Accessibility', 'FAIL', {
        statusCode: response.status,
        error: 'Results page not accessible'
      });
    }
  } catch (error) {
    logTest('UI', 'Results Page Display', 'FAIL', {
      error: error.message
    });
  }
}

async function runPerformanceTests() {
  console.log('\n⚡ Running Performance Tests...');
  
  const performanceMetrics = {
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    timeouts: 0,
    successRate: 0
  };
  
  const testRuns = 3;
  const successfulRuns = [];
  
  for (let i = 0; i < testRuns; i++) {
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${BASE_URL}/api/analyze`, {
        url: 'https://www.example.com',
        options: JSON.stringify({ deep: false, checkDirectories: true })
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DirectoryBolt-Test/1.0'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        successfulRuns.push(responseTime);
        performanceMetrics.maxResponseTime = Math.max(performanceMetrics.maxResponseTime, responseTime);
        performanceMetrics.minResponseTime = Math.min(performanceMetrics.minResponseTime, responseTime);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        performanceMetrics.timeouts++;
      }
    }
  }
  
  if (successfulRuns.length > 0) {
    performanceMetrics.averageResponseTime = successfulRuns.reduce((a, b) => a + b, 0) / successfulRuns.length;
    performanceMetrics.successRate = (successfulRuns.length / testRuns) * 100;
    
    if (performanceMetrics.averageResponseTime < 15000) { // Under 15 seconds
      logTest('Performance', 'Average Response Time', 'PASS', {
        metrics: performanceMetrics
      });
    } else {
      logTest('Performance', 'Average Response Time', 'WARNING', {
        warning: 'Response time exceeds 15 seconds',
        metrics: performanceMetrics
      });
    }
  } else {
    logTest('Performance', 'Performance Test', 'FAIL', {
      error: 'No successful requests completed',
      metrics: performanceMetrics
    });
  }
}

function generateTestReport() {
  console.log('\n📊 Generating Test Report...');
  
  // Calculate success rate
  const successRate = testResults.summary.totalTests > 0 
    ? ((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1)
    : 0;
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 DIRECTORYBOLT ANALYSIS WORKFLOW TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`Passed: ${testResults.summary.passed} ✅`);
  console.log(`Failed: ${testResults.summary.failed} ❌`);
  console.log(`Warnings: ${testResults.summary.warnings} ⚠️`);
  console.log(`Success Rate: ${successRate}%`);
  console.log('='.repeat(60));
  
  if (testResults.issues.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    testResults.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
      console.log(`   ${issue.description}`);
    });
  }
  
  if (testResults.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    testResults.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
      console.log(`   ${rec.recommendation}`);
    });
  }
  
  // Save detailed results to file
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log(`\n📁 Detailed results saved to: ${TEST_RESULTS_FILE}`);
  
  return {
    summary: testResults.summary,
    successRate: parseFloat(successRate),
    issues: testResults.issues,
    recommendations: testResults.recommendations
  };
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive DirectoryBolt Analysis Workflow Tests');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Time: ${new Date().toLocaleString()}`);
  
  try {
    // Test 1: Infrastructure
    await testApiEndpoint();
    
    // Test 2: Analysis Workflow for Different Website Types
    for (const website of TEST_WEBSITES) {
      await testAnalysisWorkflow(website);
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test 3: Results Page Display
    await testResultsPageDisplay();
    
    // Test 4: Performance Tests
    await runPerformanceTests();
    
    // Generate final report
    const report = generateTestReport();
    
    console.log('\n✨ All tests completed!');
    
    // Return report for potential CI/CD integration
    return report;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    addIssue('critical', 'Test Execution Failed', error.message, 'Review test setup and environment configuration');
    
    const report = generateTestReport();
    return report;
  }
}

// Export for module use
module.exports = {
  runComprehensiveTests,
  TEST_WEBSITES,
  testResults
};

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests()
    .then(report => {
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}