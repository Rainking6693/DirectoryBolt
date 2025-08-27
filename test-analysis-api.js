/**
 * Test script to verify the analysis API is working correctly
 * and returning real calculated data instead of placeholders
 */

const fetch = require('node-fetch');

// Test configuration
const TEST_URL = 'https://example.com'; // Simple test URL
const API_BASE = 'http://localhost:3000'; // Adjust if different

async function testAnalysisAPI() {
  console.log('🧪 Testing DirectoryBolt Analysis API...\n');

  try {
    // Test the analysis endpoint
    console.log(`📋 Testing analysis for: ${TEST_URL}`);
    
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Test/1.0'
      },
      body: JSON.stringify({
        url: TEST_URL,
        options: JSON.stringify({
          deep: true,
          includeCompetitors: false,
          checkDirectories: true
        })
      })
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ API Response Structure:', {
      success: result.success,
      hasData: !!result.data,
      hasMetadata: !!result.metadata
    });

    if (result.success && result.data) {
      const data = result.data;
      
      console.log('\n📈 Analysis Results:');
      console.log(`   🌐 URL: ${data.url || 'N/A'}`);
      console.log(`   📝 Title: ${data.title || 'N/A'}`);
      console.log(`   👁️ Visibility Score: ${data.visibility || 0}%`);
      console.log(`   🚀 SEO Score: ${data.seoScore || 0}%`);
      console.log(`   📊 Current Listings: ${data.currentListings || 0}`);
      console.log(`   🎯 Missed Opportunities: ${data.missedOpportunities || 0}`);
      console.log(`   👥 Potential Leads: ${data.potentialLeads || 0}`);
      console.log(`   📁 Directory Opportunities: ${data.directoryOpportunities?.length || 0}`);

      // Verify we have real data (not empty placeholders)
      const checks = {
        'Visibility Score > 0': (data.visibility || 0) > 0,
        'SEO Score > 0': (data.seoScore || 0) > 0,
        'Has directory opportunities': (data.directoryOpportunities?.length || 0) > 0,
        'Potential leads > 0': (data.potentialLeads || 0) > 0,
        'Has website title': !!(data.title && data.title !== 'Unknown Website'),
        'Has recommendations': (data.recommendations?.length || 0) > 0
      };

      console.log('\n🔍 Data Quality Checks:');
      let passedChecks = 0;
      const totalChecks = Object.keys(checks).length;

      for (const [check, passed] of Object.entries(checks)) {
        const status = passed ? '✅' : '❌';
        console.log(`   ${status} ${check}`);
        if (passed) passedChecks++;
      }

      console.log(`\n📊 Overall Quality: ${passedChecks}/${totalChecks} checks passed`);

      // Show sample directory opportunities
      if (data.directoryOpportunities?.length > 0) {
        console.log('\n🎯 Sample Directory Opportunities:');
        data.directoryOpportunities.slice(0, 3).forEach((dir, index) => {
          console.log(`   ${index + 1}. ${dir.name}`);
          console.log(`      Authority: ${dir.authority}/100`);
          console.log(`      Traffic: ${dir.estimatedTraffic?.toLocaleString() || 'N/A'}`);
          console.log(`      Difficulty: ${dir.submissionDifficulty || 'N/A'}`);
          console.log(`      Cost: ${dir.cost === 0 ? 'FREE' : `$${dir.cost}`}`);
        });
      }

      // Show sample recommendations
      if (data.recommendations?.length > 0) {
        console.log('\n💡 Sample Recommendations:');
        data.recommendations.slice(0, 2).forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.action || 'N/A'}`);
          console.log(`      Impact: ${rec.impact || 'N/A'}`);
          console.log(`      Effort: ${rec.effort || 'N/A'}`);
        });
      }

      if (passedChecks >= totalChecks * 0.8) {
        console.log('\n🎉 SUCCESS: Analysis API is working correctly with real data!');
      } else {
        console.log('\n⚠️  WARNING: Some data quality checks failed. Results may contain placeholders.');
      }

    } else if (result.data && result.data.status === 'initiated') {
      console.log('\n⏳ Analysis initiated with progress tracking');
      console.log(`   Analysis ID: ${result.data.analysisId}`);
      console.log(`   Progress URL: ${result.data.progressEndpoint}`);
      console.log('\n💡 The API is using asynchronous processing. Check the progress endpoint for results.');
    } else {
      console.log('\n❌ No analysis data returned');
      console.log('Full response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the DirectoryBolt server is running:');
      console.log('   npm run dev');
    }
  }
}

// Run the test
if (require.main === module) {
  testAnalysisAPI();
}

module.exports = { testAnalysisAPI };