require('dotenv').config();
const GeminiDirectorySubmitter = require('./gemini-directory-submitter');

async function testGeminiWorker() {
  console.log('🧪 Testing Gemini Computer Use Directory Submitter...\n');
  
  const submitter = new GeminiDirectorySubmitter();
  
  try {
    await submitter.initialize();
    
    // Test business data
    const testBusiness = {
      business_name: "Test Business",
      email: "test@example.com",
      phone: "555-123-4567",
      website: "https://testbusiness.com",
      address: "123 Test Street",
      city: "Test City",
      state: "TS",
      zip: "12345"
    };
    
    // Test with a simple directory with an actual form
    // Using a demo contact form for testing (change to actual directory URL in production)
    const testDirectory = "https://www.yelp.com/biz_add";
    
    console.log('🎯 Testing submission to:', testDirectory);
    console.log('📋 Business data:', testBusiness);
    
    const result = await submitter.submitToDirectory(testDirectory, testBusiness);
    
    console.log('\n📊 Result:');
    console.log('Status:', result.status);
    console.log('Message:', result.message);
    console.log('Screenshot saved:', result.screenshot ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await submitter.cleanup();
  }
}

// Run the test
testGeminiWorker();
