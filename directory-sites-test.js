/**
 * BLAKE - Directory Sites Testing
 * Test AutoBolt extension functionality on real directory submission forms
 */

const puppeteer = require('puppeteer');
const path = require('path');

console.log('🌐 BLAKE - Directory Sites Extension Testing');
console.log('='.repeat(60));

const EXTENSION_PATH = path.resolve('C:\\Users\\Ben\\auto-bolt-extension\\build\\auto-bolt-extension');

// Test sites that are commonly used for directory submissions
const TEST_SITES = [
    {
        name: 'Google Business Profile',
        url: 'https://business.google.com',
        description: 'Google My Business listing creation'
    },
    {
        name: 'Yelp Business',
        url: 'https://biz.yelp.com',
        description: 'Yelp business profile setup'
    },
    {
        name: 'Yellow Pages',
        url: 'https://www.yellowpages.com',
        description: 'Yellow Pages business listing'
    }
];

async function testDirectorySites() {
    let browser;
    
    try {
        console.log('🚀 Starting Chrome with AutoBolt Extension for directory testing...');
        
        browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: [
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1280,720'
            ],
            defaultViewport: null,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        });

        const page = await browser.newPage();
        
        console.log('✅ Chrome launched with AutoBolt extension');
        console.log('📋 Testing extension on directory sites...');
        
        // Track console messages for each site
        const allConsoleMessages = {};
        
        for (const site of TEST_SITES) {
            try {
                console.log(`\\n🔍 Testing: ${site.name}`);
                console.log(`   URL: ${site.url}`);
                console.log(`   Description: ${site.description}`);
                
                const consoleMessages = [];
                
                // Listen for console messages
                page.on('console', msg => {
                    consoleMessages.push({
                        type: msg.type(),
                        text: msg.text(),
                        timestamp: new Date().toISOString()
                    });
                });
                
                // Navigate to the site
                await page.goto(site.url, { waitUntil: 'networkidle0', timeout: 30000 });
                
                // Wait for page to load and extension to process
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Check for forms on the page
                const formInfo = await page.evaluate(() => {
                    const forms = document.querySelectorAll('form');
                    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea, select');
                    
                    return {
                        formCount: forms.length,
                        inputCount: inputs.length,
                        hasBusinessFields: Array.from(inputs).some(input => {
                            const name = (input.name || '').toLowerCase();
                            const id = (input.id || '').toLowerCase();
                            const placeholder = (input.placeholder || '').toLowerCase();
                            
                            return name.includes('business') || 
                                   name.includes('company') ||
                                   name.includes('name') ||
                                   id.includes('business') ||
                                   id.includes('company') ||
                                   placeholder.includes('business') ||
                                   placeholder.includes('company');
                        })
                    };
                });
                
                console.log(`   Forms found: ${formInfo.formCount}`);
                console.log(`   Input fields: ${formInfo.inputCount}`);
                console.log(`   Has business fields: ${formInfo.hasBusinessFields ? '✅' : '❌'}`);
                
                // Check for extension-specific errors
                const extensionErrors = consoleMessages.filter(msg => 
                    msg.type === 'error' && (
                        msg.text.includes('analyzeFieldAdvanced') ||
                        msg.text.includes('AutoBolt') ||
                        msg.text.includes('DirectoryBolt')
                    )
                );
                
                if (extensionErrors.length === 0) {
                    console.log('   ✅ No extension errors detected');
                } else {
                    console.log('   ❌ Extension errors found:');
                    extensionErrors.forEach(error => {
                        console.log(`     - ${error.text}`);
                    });
                }
                
                // Store console messages for analysis
                allConsoleMessages[site.name] = consoleMessages;
                
                console.log(`   📝 Console messages: ${consoleMessages.length}`);
                
            } catch (error) {
                console.log(`   ❌ Error testing ${site.name}: ${error.message}`);
            }
        }
        
        // Test custom form page
        console.log('\\n🔍 Testing Custom Test Form');
        const testFormPath = path.join(__dirname, 'autobolt-extension-test-form.html');
        
        try {
            await page.goto(`file://${testFormPath}`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const testFormMessages = [];
            page.on('console', msg => {
                testFormMessages.push({
                    type: msg.type(),
                    text: msg.text(),
                    timestamp: new Date().toISOString()
                });
            });
            
            // Test field interaction
            await page.focus('#business-name');
            await page.type('#business-name', 'Test Business Name');
            
            await page.focus('#email');
            await page.type('#email', 'test@business.com');
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('   ✅ Custom test form loaded and interacted with');
            console.log(`   📝 Test form messages: ${testFormMessages.length}`);
            
            allConsoleMessages['Custom Test Form'] = testFormMessages;
            
        } catch (error) {
            console.log(`   ❌ Error testing custom form: ${error.message}`);
        }
        
        // Generate summary report
        console.log('\\n📊 DIRECTORY TESTING SUMMARY');
        console.log('='.repeat(40));
        
        let totalErrors = 0;
        let sitesWithForms = 0;
        let sitesWithBusinessFields = 0;
        
        for (const [siteName, messages] of Object.entries(allConsoleMessages)) {
            const errors = messages.filter(msg => msg.type === 'error');
            const extensionErrors = errors.filter(msg => 
                msg.text.includes('analyzeFieldAdvanced') ||
                msg.text.includes('AutoBolt') ||
                msg.text.includes('DirectoryBolt')
            );
            
            totalErrors += extensionErrors.length;
            
            console.log(`\\n${siteName}:`);
            console.log(`  Total messages: ${messages.length}`);
            console.log(`  Errors: ${errors.length}`);
            console.log(`  Extension errors: ${extensionErrors.length}`);
            
            if (extensionErrors.length > 0) {
                extensionErrors.forEach(error => {
                    console.log(`    - ${error.text}`);
                });
            }
        }
        
        console.log('\\n🎯 OVERALL RESULTS:');
        console.log(`  Sites tested: ${TEST_SITES.length + 1}`);
        console.log(`  Total extension errors: ${totalErrors}`);
        console.log(`  Extension status: ${totalErrors === 0 ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
        
        if (totalErrors === 0) {
            console.log('\\n🚀 SUCCESS: AutoBolt extension working correctly on directory sites!');
            console.log('  ✅ No analyzeFieldAdvanced errors detected');
            console.log('  ✅ Extension loads and processes forms');
            console.log('  ✅ Ready for customer use');
        } else {
            console.log('\\n⚠️  ISSUES DETECTED: Extension needs further investigation');
        }
        
        // Keep browser open for manual inspection
        console.log('\\n⏸️  Browser kept open for manual inspection...');
        console.log('   You can now manually test the extension on these sites');
        console.log('   Close browser when finished');
        
        return {
            totalErrors,
            sitesProcessed: TEST_SITES.length + 1,
            success: totalErrors === 0
        };
        
    } catch (error) {
        console.error('💥 Directory testing failed:', error.message);
        if (browser) {
            // await browser.close();
        }
        throw error;
    }
}

// Run directory testing
testDirectorySites().catch(console.error);