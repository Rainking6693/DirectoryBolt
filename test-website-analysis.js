// Quick test script to verify website analysis functionality
async function testWebsiteAnalysis() {
    // Use dynamic import for node-fetch or global fetch if available
    let fetch;
    try {
        if (typeof globalThis.fetch === 'undefined') {
            const nodeFetch = await import('node-fetch');
            fetch = nodeFetch.default;
        } else {
            fetch = globalThis.fetch;
        }
    } catch (error) {
        console.log('⚠️ Note: Using basic HTTP capabilities (may need node-fetch)');
        fetch = require('https').get; // Fallback but won't work the same
    }
    console.log('🔍 Testing Website Analysis API...');
    
    const testUrl = 'https://example.com';
    const apiUrl = 'http://localhost:3006/api/analyze';
    
    try {
        console.log(`📡 Making request to: ${apiUrl}`);
        console.log(`🌐 Testing URL: ${testUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: testUrl,
                options: JSON.stringify({
                    deep: false,
                    includeCompetitors: false,
                    checkDirectories: true
                })
            })
        });
        
        console.log(`📊 Response status: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ SUCCESS! Website analysis is working!');
            console.log('\n📈 Analysis Results:');
            console.log(`- Title: ${data.data?.title || 'N/A'}`);
            console.log(`- Description: ${data.data?.description || 'N/A'}`);
            console.log(`- SEO Score: ${data.data?.seoScore || 'N/A'}`);
            console.log(`- Current Listings: ${data.data?.currentListings || 'N/A'}`);
            console.log(`- Missed Opportunities: ${data.data?.missedOpportunities || 'N/A'}`);
            console.log(`- Potential Leads: ${data.data?.potentialLeads || 'N/A'}`);
            console.log(`- Visibility Score: ${data.data?.visibility || 'N/A'}%`);
            
            if (data.data?.issues?.length > 0) {
                console.log('\n🚨 Issues Found:');
                data.data.issues.forEach((issue, index) => {
                    console.log(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.title}`);
                    console.log(`   Impact: ${issue.impact}`);
                });
            }
            
            if (data.data?.recommendations?.length > 0) {
                console.log('\n💡 Recommendations:');
                data.data.recommendations.forEach((rec, index) => {
                    console.log(`${index + 1}. ${rec.action} (${rec.effort} effort)`);
                    console.log(`   Impact: ${rec.impact}`);
                });
            }
            
            if (data.data?.directoryOpportunities?.length > 0) {
                console.log('\n🎯 Directory Opportunities:');
                data.data.directoryOpportunities.slice(0, 5).forEach((dir, index) => {
                    console.log(`${index + 1}. ${dir.name} (Authority: ${dir.authority})`);
                    console.log(`   Traffic: ${dir.estimatedTraffic}, Difficulty: ${dir.submissionDifficulty}`);
                });
            }
            
        } else {
            console.log('❌ FAILED! Website analysis returned an error:');
            console.log(JSON.stringify(data, null, 2));
        }
        
    } catch (error) {
        console.log('💥 ERROR! Failed to test website analysis:');
        console.error(error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the Next.js development server is running:');
            console.log('   npm run dev');
        }
    }
}

// Run the test
console.log('🚀 Starting Website Analysis Test...\n');
testWebsiteAnalysis()
    .then(() => {
        console.log('\n✨ Test completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test failed:', error);
        process.exit(1);
    });