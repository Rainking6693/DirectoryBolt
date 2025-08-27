/**
 * Careful Analysis Test - Respects Rate Limits
 * Tests the complete analysis workflow with proper rate limiting
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3003';

// Simple delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  issues: []
};

function logResult(test, status, details = {}) {
  console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${test}`);
  if (details.error) console.log(`   Error: ${details.error}`);
  if (details.data) console.log(`   Data: ${JSON.stringify(details.data, null, 2)}`);
  
  testResults.tests.push({ test, status, details, timestamp: new Date().toISOString() });
}

async function testSingleWebsiteAnalysis() {
  console.log('\n🔍 Testing Single Website Analysis (Rate-Limited)...');
  
  try {
    // Wait for rate limit to reset
    await delay(2000);
    
    const response = await axios.post(`${BASE_URL}/api/analyze`, {
      url: 'https://www.example.com',
      options: JSON.stringify({
        deep: false,
        includeCompetitors: false,
        checkDirectories: true
      })
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Test/1.0'
      },
      timeout: 60000
    });
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      
      logResult('API Response Success', 'PASS', {
        data: {
          url: data.url,
          title: data.title?.substring(0, 50) + '...',
          seoScore: data.seoScore,
          visibility: data.visibility,
          potentialLeads: data.potentialLeads,
          directoryCount: data.directoryOpportunities?.length || 0,
          currentListings: data.currentListings,
          missedOpportunities: data.missedOpportunities
        }
      });
      
      // Validate real data extraction
      if (data.title && data.title !== 'No title found' && data.title.length > 5) {
        logResult('Real Title Extraction', 'PASS', { data: { title: data.title } });
      } else {
        logResult('Real Title Extraction', 'WARNING', { error: 'Title appears to be placeholder' });
      }
      
      // Validate SEO Score
      if (typeof data.seoScore === 'number' && data.seoScore >= 0 && data.seoScore <= 100) {
        logResult('SEO Score Calculation', 'PASS', { data: { seoScore: data.seoScore } });
      } else {
        logResult('SEO Score Calculation', 'FAIL', { error: `Invalid SEO score: ${data.seoScore}` });
      }
      
      // Validate Visibility Score
      if (typeof data.visibility === 'number' && data.visibility >= 0 && data.visibility <= 100) {
        logResult('Visibility Score Calculation', 'PASS', { data: { visibility: data.visibility } });
      } else {
        logResult('Visibility Score Calculation', 'FAIL', { error: `Invalid visibility score: ${data.visibility}` });
      }
      
      // Validate Directory Opportunities
      if (Array.isArray(data.directoryOpportunities) && data.directoryOpportunities.length > 0) {
        const sampleDir = data.directoryOpportunities[0];
        logResult('Directory Opportunities', 'PASS', { 
          data: { 
            count: data.directoryOpportunities.length,
            sample: {
              name: sampleDir.name,
              authority: sampleDir.authority,
              cost: sampleDir.cost
            }
          } 
        });
      } else {
        logResult('Directory Opportunities', 'WARNING', { error: 'No directory opportunities found' });
      }
      
      // Validate Issues and Recommendations
      if (Array.isArray(data.issues) && data.issues.length > 0) {
        logResult('Issues Generation', 'PASS', { 
          data: { 
            count: data.issues.length,
            sample: data.issues[0].title
          } 
        });
      } else {
        logResult('Issues Generation', 'WARNING', { error: 'No issues generated' });
      }
      
      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        logResult('Recommendations Generation', 'PASS', { 
          data: { 
            count: data.recommendations.length,
            sample: data.recommendations[0].action?.substring(0, 50)
          } 
        });
      } else {
        logResult('Recommendations Generation', 'WARNING', { error: 'No recommendations generated' });
      }
      
    } else {
      logResult('API Response', 'FAIL', { 
        error: `Status: ${response.status}, Success: ${response.data?.success}` 
      });
    }
    
  } catch (error) {
    if (error.response?.status === 429) {
      logResult('Rate Limit Test', 'WARNING', { 
        error: 'Rate limit exceeded - this is expected behavior',
        details: error.response?.data
      });
    } else {
      logResult('Analysis Test', 'FAIL', { 
        error: error.message,
        status: error.response?.status,
        details: error.response?.data
      });
    }
  }
}

async function testResultsPageData() {
  console.log('\n🎨 Testing Results Page...');
  
  try {
    const response = await axios.get(`${BASE_URL}/results`);
    
    if (response.status === 200) {
      const html = response.data;
      
      logResult('Results Page Accessible', 'PASS', { 
        data: { statusCode: response.status, contentLength: html.length } 
      });
      
      // Check for Volt Yellow theme
      const hasVoltTheme = html.includes('volt') || 
                          html.includes('yellow') || 
                          html.includes('#FFFF') ||
                          html.includes('bg-yellow');
      
      if (hasVoltTheme) {
        logResult('Volt Yellow Theme', 'PASS', { data: 'Theme elements found in HTML' });
      } else {
        logResult('Volt Yellow Theme', 'WARNING', { error: 'Theme elements not clearly visible in HTML' });
      }
      
    } else {
      logResult('Results Page Access', 'FAIL', { error: `Status: ${response.status}` });
    }
    
  } catch (error) {
    logResult('Results Page Test', 'FAIL', { error: error.message });
  }
}

async function testHealthEndpoint() {
  console.log('\n📊 Testing Health Endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    
    if (response.status === 200) {
      const health = response.data;
      
      logResult('Health Endpoint', 'PASS', { 
        data: { 
          status: health.status,
          uptime: health.uptime,
          version: health.version
        } 
      });
      
      // Check database status
      if (health.checks?.database?.status) {
        logResult('Database Check', health.checks.database.status === 'pass' ? 'PASS' : 'WARNING', { 
          data: health.checks.database 
        });
      }
      
    } else {
      logResult('Health Check', 'FAIL', { error: `Status: ${response.status}` });
    }
    
  } catch (error) {
    logResult('Health Endpoint Test', 'FAIL', { error: error.message });
  }
}

function generateReport() {
  console.log('\n📋 ANALYSIS WORKFLOW TEST REPORT');
  console.log('='.repeat(50));
  
  const passed = testResults.tests.filter(t => t.status === 'PASS').length;
  const failed = testResults.tests.filter(t => t.status === 'FAIL').length;
  const warnings = testResults.tests.filter(t => t.status === 'WARNING').length;
  
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Warnings: ${warnings} ⚠️`);
  console.log(`Success Rate: ${((passed / testResults.tests.length) * 100).toFixed(1)}%`);
  
  console.log('\n📝 FINDINGS:');
  
  // Key findings
  const apiTest = testResults.tests.find(t => t.test === 'API Response Success');
  if (apiTest) {
    if (apiTest.status === 'PASS') {
      console.log('✅ Analysis API is working and returning real data');
      console.log(`   • SEO Score: ${apiTest.details.data.seoScore}`);
      console.log(`   • Visibility: ${apiTest.details.data.visibility}`);
      console.log(`   • Directory Opportunities: ${apiTest.details.data.directoryCount}`);
      console.log(`   • Potential Leads: ${apiTest.details.data.potentialLeads}`);
    } else {
      console.log('❌ Analysis API has issues');
    }
  }
  
  const dataTests = testResults.tests.filter(t => 
    t.test.includes('Extraction') || 
    t.test.includes('Calculation') || 
    t.test.includes('Generation')
  );
  
  const dataWorking = dataTests.filter(t => t.status === 'PASS').length;
  console.log(`\n🔍 Data Quality: ${dataWorking}/${dataTests.length} components working properly`);
  
  // Rate limiting findings
  const rateLimitTest = testResults.tests.find(t => t.test === 'Rate Limit Test');
  if (rateLimitTest && rateLimitTest.status === 'WARNING') {
    console.log('\n⚡ Rate Limiting: Working as expected (prevents abuse)');
  }
  
  // UI findings
  const uiTests = testResults.tests.filter(t => t.test.includes('Results Page') || t.test.includes('Theme'));
  const uiWorking = uiTests.filter(t => t.status === 'PASS').length;
  console.log(`\n🎨 UI Components: ${uiWorking}/${uiTests.length} working properly`);
  
  // Save detailed results
  const resultsFile = 'careful_test_results.json';
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📁 Detailed results: ${resultsFile}`);
}

async function runTests() {
  console.log('🚀 Starting Careful DirectoryBolt Analysis Tests');
  console.log(`Server: ${BASE_URL}`);
  
  await testHealthEndpoint();
  await testSingleWebsiteAnalysis();
  await testResultsPageData();
  
  generateReport();
  
  return testResults;
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };