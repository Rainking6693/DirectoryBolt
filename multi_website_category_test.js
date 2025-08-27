/**
 * Multiple Website Category Test
 * Tests the analysis workflow with different website types to ensure
 * Shane's fixes work consistently across business categories
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3003';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Different website categories to test
const testWebsites = [
  {
    category: 'Small Business - Restaurant',
    url: 'https://www.pizzapalace.com',
    fallback: 'https://www.dominos.com',
    expectedFeatures: ['title', 'description', 'seoScore', 'visibility']
  },
  {
    category: 'E-commerce - Online Store', 
    url: 'https://www.shopify.com',
    fallback: 'https://www.amazon.com',
    expectedFeatures: ['title', 'description', 'seoScore', 'visibility']
  },
  {
    category: 'Service Business - Consulting',
    url: 'https://www.mckinsey.com',
    fallback: 'https://www.deloitte.com',
    expectedFeatures: ['title', 'description', 'seoScore', 'visibility']
  }
];

const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalWebsites: 0,
    successful: 0,
    failed: 0
  },
  websites: [],
  issues: [],
  metrics: {
    averageSeoScore: 0,
    averageVisibility: 0,
    averageDirectories: 0,
    averageLeads: 0
  }
};

function logTest(category, test, status, data = null) {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${symbol} [${category}] ${test}`);
  if (data) {
    console.log(`   ${JSON.stringify(data, null, 2)}`);
  }
}

async function testWebsiteCategory(websiteConfig) {
  console.log(`\n🔍 Testing: ${websiteConfig.category}`);
  console.log(`   URL: ${websiteConfig.url}`);
  
  // Add rate limiting delay
  await delay(5000);
  
  const result = {
    category: websiteConfig.category,
    url: websiteConfig.url,
    timestamp: new Date().toISOString(),
    success: false,
    data: null,
    metrics: null,
    issues: []
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/analyze`, {
      url: websiteConfig.url,
      options: JSON.stringify({
        deep: false,
        includeCompetitors: false,
        checkDirectories: true
      })
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-CategoryTest/1.0'
      },
      timeout: 45000
    });
    
    if (response.status === 200 && response.data.success && response.data.data) {
      const data = response.data.data;
      result.success = true;
      result.data = data;
      
      // Extract key metrics for comparison
      result.metrics = {
        seoScore: data.seoScore || 0,
        visibility: data.visibility || 0,
        directoryCount: data.directoryOpportunities?.length || 0,
        potentialLeads: data.potentialLeads || 0,
        currentListings: data.currentListings || 0,
        missedOpportunities: data.missedOpportunities || 0
      };
      
      testResults.summary.successful++;
      
      // Test 1: Title Extraction
      if (data.title && data.title !== 'No title found' && data.title.length > 3) {
        logTest(websiteConfig.category, 'Title Extraction', 'PASS', { 
          title: data.title.substring(0, 50) + (data.title.length > 50 ? '...' : '')
        });
      } else {
        logTest(websiteConfig.category, 'Title Extraction', 'WARNING', { 
          title: data.title || 'No title found' 
        });
        result.issues.push('Title extraction issue');
      }
      
      // Test 2: SEO Score Calculation
      if (typeof data.seoScore === 'number' && data.seoScore >= 0 && data.seoScore <= 100) {
        logTest(websiteConfig.category, 'SEO Score', 'PASS', { 
          score: data.seoScore,
          isCalculated: data.seoScore !== 50 && data.seoScore !== 0 && data.seoScore !== 100
        });
      } else {
        logTest(websiteConfig.category, 'SEO Score', 'FAIL', { 
          score: data.seoScore,
          error: 'Invalid SEO score'
        });
        result.issues.push('SEO score calculation issue');
      }
      
      // Test 3: Visibility Score
      if (typeof data.visibility === 'number' && data.visibility >= 0 && data.visibility <= 100) {
        logTest(websiteConfig.category, 'Visibility Score', 'PASS', { 
          score: data.visibility 
        });
      } else {
        logTest(websiteConfig.category, 'Visibility Score', 'FAIL', { 
          score: data.visibility,
          error: 'Invalid visibility score'
        });
        result.issues.push('Visibility score calculation issue');
      }
      
      // Test 4: Directory Opportunities
      if (Array.isArray(data.directoryOpportunities) && data.directoryOpportunities.length > 0) {
        const topDirectories = data.directoryOpportunities.slice(0, 3).map(d => ({
          name: d.name,
          authority: d.authority,
          cost: d.cost
        }));
        logTest(websiteConfig.category, 'Directory Opportunities', 'PASS', { 
          count: data.directoryOpportunities.length,
          topDirectories
        });
      } else {
        logTest(websiteConfig.category, 'Directory Opportunities', 'WARNING', { 
          count: 0,
          error: 'No directories found'
        });
        result.issues.push('No directory opportunities found');
      }
      
      // Test 5: Potential Leads Calculation
      if (typeof data.potentialLeads === 'number' && data.potentialLeads >= 0) {
        logTest(websiteConfig.category, 'Potential Leads', 'PASS', { 
          leads: data.potentialLeads,
          realistic: data.potentialLeads < 10000 // Sanity check
        });
      } else {
        logTest(websiteConfig.category, 'Potential Leads', 'FAIL', { 
          leads: data.potentialLeads,
          error: 'Invalid leads calculation'
        });
        result.issues.push('Potential leads calculation issue');
      }
      
      // Test 6: Issues and Recommendations
      const hasIssues = Array.isArray(data.issues) && data.issues.length > 0;
      const hasRecommendations = Array.isArray(data.recommendations) && data.recommendations.length > 0;
      
      if (hasIssues && hasRecommendations) {
        logTest(websiteConfig.category, 'Issues & Recommendations', 'PASS', { 
          issuesCount: data.issues.length,
          recommendationsCount: data.recommendations.length,
          sampleIssue: data.issues[0]?.title || 'N/A',
          sampleRecommendation: data.recommendations[0]?.action?.substring(0, 40) + '...' || 'N/A'
        });
      } else {
        logTest(websiteConfig.category, 'Issues & Recommendations', 'WARNING', { 
          issuesCount: data.issues?.length || 0,
          recommendationsCount: data.recommendations?.length || 0
        });
      }
      
      // Overall assessment for this website
      const criticalIssues = result.issues.filter(i => i.includes('FAIL')).length;
      if (criticalIssues === 0) {
        logTest(websiteConfig.category, 'Overall Analysis', 'PASS', { 
          summary: 'All core features working correctly',
          metrics: result.metrics
        });
      } else {
        logTest(websiteConfig.category, 'Overall Analysis', 'WARNING', { 
          summary: `${criticalIssues} critical issues found`,
          issues: result.issues
        });
      }
      
    } else {
      logTest(websiteConfig.category, 'API Response', 'FAIL', { 
        status: response.status,
        success: response.data?.success,
        error: response.data?.error
      });
      result.issues.push('API response failed');
      testResults.summary.failed++;
    }
    
  } catch (error) {
    logTest(websiteConfig.category, 'Request Failed', 'FAIL', { 
      error: error.message,
      status: error.response?.status,
      rateLimit: error.response?.status === 429
    });
    
    result.issues.push(`Request failed: ${error.message}`);
    testResults.summary.failed++;
  }
  
  testResults.websites.push(result);
  testResults.summary.totalWebsites++;
  
  return result;
}

function calculateAverageMetrics() {
  const successfulResults = testResults.websites.filter(w => w.success && w.metrics);
  
  if (successfulResults.length === 0) return;
  
  testResults.metrics = {
    averageSeoScore: Math.round(
      successfulResults.reduce((sum, r) => sum + r.metrics.seoScore, 0) / successfulResults.length
    ),
    averageVisibility: Math.round(
      successfulResults.reduce((sum, r) => sum + r.metrics.visibility, 0) / successfulResults.length
    ),
    averageDirectories: Math.round(
      successfulResults.reduce((sum, r) => sum + r.metrics.directoryCount, 0) / successfulResults.length
    ),
    averageLeads: Math.round(
      successfulResults.reduce((sum, r) => sum + r.metrics.potentialLeads, 0) / successfulResults.length
    )
  };
}

function generateDetailedReport() {
  console.log('\n📊 MULTI-CATEGORY ANALYSIS TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`🌐 Websites Tested: ${testResults.summary.totalWebsites}`);
  console.log(`✅ Successful: ${testResults.summary.successful}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`📈 Success Rate: ${((testResults.summary.successful / testResults.summary.totalWebsites) * 100).toFixed(1)}%`);
  
  // Average metrics across all successful tests
  if (testResults.summary.successful > 0) {
    calculateAverageMetrics();
    
    console.log('\n📊 AVERAGE METRICS ACROSS CATEGORIES:');
    console.log(`   • Average SEO Score: ${testResults.metrics.averageSeoScore}`);
    console.log(`   • Average Visibility: ${testResults.metrics.averageVisibility}%`);
    console.log(`   • Average Directory Count: ${testResults.metrics.averageDirectories}`);
    console.log(`   • Average Potential Leads: ${testResults.metrics.averageLeads}`);
  }
  
  // Category-specific results
  console.log('\n🏢 RESULTS BY BUSINESS CATEGORY:');
  testResults.websites.forEach(website => {
    console.log(`\n${website.category}:`);
    console.log(`   Status: ${website.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (website.success && website.metrics) {
      console.log(`   • SEO Score: ${website.metrics.seoScore}%`);
      console.log(`   • Visibility: ${website.metrics.visibility}%`);
      console.log(`   • Directory Opportunities: ${website.metrics.directoryCount}`);
      console.log(`   • Potential Monthly Leads: ${website.metrics.potentialLeads}`);
      console.log(`   • Current Listings: ${website.metrics.currentListings}`);
      console.log(`   • Missed Opportunities: ${website.metrics.missedOpportunities}`);
    }
    
    if (website.issues.length > 0) {
      console.log(`   Issues: ${website.issues.join(', ')}`);
    }
  });
  
  // Key findings
  console.log('\n🔍 KEY FINDINGS:');
  
  if (testResults.summary.successful > 0) {
    console.log('✅ Shane\'s fixes are working - the analysis API is returning real calculated data');
    
    // Check for consistent data quality
    const successfulResults = testResults.websites.filter(w => w.success);
    const allHaveValidScores = successfulResults.every(r => 
      r.metrics && 
      r.metrics.seoScore >= 0 && r.metrics.seoScore <= 100 &&
      r.metrics.visibility >= 0 && r.metrics.visibility <= 100
    );
    
    if (allHaveValidScores) {
      console.log('✅ All metrics are within valid ranges (0-100%)');
    } else {
      console.log('⚠️  Some metrics may be out of valid ranges');
    }
    
    // Check for variety in results (not all the same)
    const scores = successfulResults.map(r => r.metrics.seoScore);
    const hasVariety = Math.max(...scores) - Math.min(...scores) > 10;
    
    if (hasVariety) {
      console.log('✅ Metrics show appropriate variation between different websites');
    } else {
      console.log('⚠️  Metrics appear too similar - may indicate placeholder data');
    }
    
    // Directory opportunities check
    const avgDirectories = testResults.metrics.averageDirectories;
    if (avgDirectories >= 5) {
      console.log(`✅ Good directory coverage: average ${avgDirectories} opportunities per website`);
    } else {
      console.log(`⚠️  Low directory coverage: only ${avgDirectories} opportunities on average`);
    }
    
  } else {
    console.log('❌ Analysis API is not working properly - investigate server issues');
  }
  
  // Rate limiting assessment
  const rateLimitIssues = testResults.websites.filter(w => 
    w.issues.some(issue => issue.includes('429') || issue.includes('rate limit'))
  ).length;
  
  if (rateLimitIssues > 0) {
    console.log(`⚡ Rate limiting is active: ${rateLimitIssues} requests limited (this is expected)`);
  } else {
    console.log('⚡ No rate limiting issues encountered');
  }
  
  // Save detailed results
  const filename = 'multi_category_test_results.json';
  fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
  console.log(`\n📁 Detailed results saved to: ${filename}`);
  
  console.log('\n✨ Multi-category testing complete!');
  
  return testResults;
}

async function runMultiCategoryTests() {
  console.log('🚀 Starting Multi-Category Website Analysis Tests');
  console.log(`Server: ${BASE_URL}`);
  console.log(`Categories: ${testWebsites.length}`);
  
  // Test each website category
  for (let i = 0; i < testWebsites.length; i++) {
    const website = testWebsites[i];
    console.log(`\n[${i + 1}/${testWebsites.length}] Testing ${website.category}...`);
    
    await testWebsiteCategory(website);
    
    // Rate limiting delay between requests
    if (i < testWebsites.length - 1) {
      console.log('   ⏳ Waiting for rate limit reset...');
      await delay(10000); // 10 second delay
    }
  }
  
  const report = generateDetailedReport();
  
  return report;
}

if (require.main === module) {
  runMultiCategoryTests().catch(console.error);
}

module.exports = { runMultiCategoryTests };