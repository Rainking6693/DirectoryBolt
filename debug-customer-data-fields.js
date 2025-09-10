/**
 * DEBUG CUSTOMER DATA FIELDS
 * See exactly what data we're getting from Airtable for Ben's customer
 */

async function debugCustomerDataFields() {
    const apiToken = process.env.AIRTABLE_ACCESS_TOKEN; // SECURITY FIX: Moved to env var
    const baseId = process.env.AIRTABLE_BASE_ID || 'appZDNMzebkaOkLXo';
    const tableName = 'Directory Bolt Import';
    const baseUrl = 'https://api.airtable.com/v0';
    
    const benCustomerId = 'DIR-202597-recwsFS91NG2O90xi';
    
    console.log('🔍 DEBUGGING CUSTOMER DATA FIELDS');
    console.log('Looking for customer:', benCustomerId);
    
    try {
        const url = `${baseUrl}/${baseId}/${encodeURIComponent(tableName)}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('❌ API Error:', response.status, response.statusText);
            return;
        }

        const data = await response.json();
        console.log('📊 Total records:', data.records?.length || 0);
        
        // Find Ben's customer record
        const benRecord = data.records.find(record => {
            const fields = record.fields || {};
            return fields['customerID'] === benCustomerId;
        });
        
        if (!benRecord) {
            console.error('❌ Ben\'s customer record not found!');
            return;
        }
        
        console.log('✅ FOUND BEN\'S CUSTOMER RECORD:');
        console.log('Airtable Record ID:', benRecord.id);
        console.log('Created Time:', benRecord.createdTime);
        
        console.log('\n📋 ALL FIELDS IN BEN\'S RECORD:');
        const fields = benRecord.fields;
        Object.keys(fields).forEach(fieldName => {
            const value = fields[fieldName];
            console.log(`  "${fieldName}": "${value}"`);
        });
        
        console.log('\n🎯 WHAT THE EXTENSION SHOULD SHOW:');
        
        // Business Name
        const businessName = fields['Business Name'] || fields['Company Name'] || fields['Name'] || fields['business_name'] || fields['company'] || 'Unknown Business';
        console.log('Business Name should be:', businessName);
        
        // Package Type
        const packageType = fields['Package'] || fields['Package Type'] || fields['Plan'] || fields['package_type'] || fields['tier'] || 'Unknown Package';
        console.log('Package Type should be:', packageType);
        
        // Email
        const email = fields['Email'] || fields['Email Address'] || fields['email'] || 'No email';
        console.log('Email should be:', email);
        
        // Phone
        const phone = fields['Phone'] || fields['Phone Number'] || fields['phone'] || 'No phone';
        console.log('Phone should be:', phone);
        
        // Website
        const website = fields['Website'] || fields['URL'] || fields['website'] || fields['url'] || 'No website';
        console.log('Website should be:', website);
        
        console.log('\n❌ CURRENT EXTENSION PROBLEMS:');
        console.log('1. Extension is probably showing "Customer" instead of actual business name');
        console.log('2. Extension is probably showing "Professional" instead of actual package');
        console.log('3. Extension is showing placeholder data instead of real data');
        
        console.log('\n🔧 FIELDS TO FIX IN simple-customer-auth.js:');
        console.log('Need to update parseCustomer() method to use correct field names from above');
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Run the debug
debugCustomerDataFields();