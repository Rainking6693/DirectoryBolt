/**
 * Test Data Generator for Auto-Bolt Extension
 * Generates sample business data for testing form filling functionality
 */

// Sample business data that matches the extension's expected format
const testBusinessData = {
    fields: {
        // Company Information
        companyName: "TechFlow Solutions LLC",
        businessName: "TechFlow Solutions LLC", 
        company: "TechFlow Solutions LLC",
        organizationName: "TechFlow Solutions LLC",
        
        // Contact Information
        email: "contact@techflowsolutions.com",
        emailAddress: "contact@techflowsolutions.com",
        contactEmail: "contact@techflowsolutions.com",
        
        phone: "(555) 123-4567",
        phoneNumber: "(555) 123-4567",
        telephone: "(555) 123-4567",
        mobilePhone: "+1 (555) 987-6543",
        
        // Personal Information
        firstName: "John",
        lastName: "Smith",
        fullName: "John Smith",
        contactName: "John Smith",
        ownerName: "John Smith",
        
        // Address Information
        address: "123 Innovation Drive",
        streetAddress: "123 Innovation Drive",
        address1: "123 Innovation Drive",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        postalCode: "94105",
        country: "United States",
        
        // Business Details
        website: "https://www.techflowsolutions.com",
        taxId: "12-3456789",
        ein: "12-3456789",
        taxNumber: "12-3456789",
        licenseNumber: "BL-2024-SF-001",
        businessLicense: "BL-2024-SF-001"
    },
    metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0.0",
        purpose: "Debug testing for Auto-Bolt extension"
    }
};

// Function to inject test data into Chrome extension storage
function injectTestData() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ businessData: testBusinessData }, () => {
            console.log('🎯 Test business data injected into Chrome storage!');
            console.log('📊 Available fields:', Object.keys(testBusinessData.fields));
        });
    } else {
        console.log('❌ Chrome extension API not available');
        console.log('📋 Test data that would be injected:', testBusinessData);
    }
}

// Function to clear test data
function clearTestData() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove(['businessData'], () => {
            console.log('🧹 Test business data cleared from Chrome storage');
        });
    } else {
        console.log('❌ Chrome extension API not available');
    }
}

// Auto-inject on page load for testing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(injectTestData, 1000); // Delay to ensure extension is loaded
    });
} else {
    setTimeout(injectTestData, 1000);
}

// Make functions available globally for manual testing
window.autoBoltTestData = {
    inject: injectTestData,
    clear: clearTestData,
    data: testBusinessData
};

console.log('🤖 Auto-Bolt Test Data Generator loaded!');
console.log('💡 Use autoBoltTestData.inject() to inject test data');
console.log('🧹 Use autoBoltTestData.clear() to clear test data');
console.log('📊 Use autoBoltTestData.data to view test data');