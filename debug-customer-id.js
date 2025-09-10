/**
 * DEBUG CUSTOMER ID ISSUE
 * Check what's actually in the Airtable database
 */

async function debugCustomerID() {
    const apiToken = process.env.AIRTABLE_ACCESS_TOKEN; // SECURITY FIX: Moved to env var
    const baseId = process.env.AIRTABLE_BASE_ID || 'appZDNMzebkaOkLXo';
    const tableName = 'Directory Bolt Import';
    const baseUrl = 'https://api.airtable.com/v0';
    
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
            console.error('API Error:', response.status, response.statusText);
            return;
        }

        const data = await response.json();
        console.log('Total records:', data.records?.length || 0);
        
        // Log all customer IDs to see exact format
        data.records.forEach((record, index) => {
            const fields = record.fields || {};
            const customerIdFields = [
                'Customer ID',
                'CustomerID', 
                'customer_id',
                'ID',
                'Record ID'
            ];
            
            console.log(`Record ${index + 1}:`);
            customerIdFields.forEach(fieldName => {
                if (fields[fieldName]) {
                    console.log(`  ${fieldName}: "${fields[fieldName]}"`);
                }
            });
            
            // Also log business name for context
            const businessName = fields['Business Name'] || fields['Company Name'] || fields['Name'];
            if (businessName) {
                console.log(`  Business: "${businessName}"`);
            }
            console.log('---');
        });
        
        // Test both versions of Ben's customer ID
        const testIds = [
            'DIR-202597-recwsFS91NG2O90xi',  // Our test version
            'DIR-202597-recws-FS91NG2O90xi'  // Ben's actual version
        ];
        
        testIds.forEach(testId => {
            console.log(`\nTesting ID: "${testId}"`);
            const found = data.records.find(record => {
                const fields = record.fields || {};
                const customerIdFields = [
                    'Customer ID',
                    'CustomerID', 
                    'customer_id',
                    'ID',
                    'Record ID'
                ];
                
                for (const fieldName of customerIdFields) {
                    if (fields[fieldName] === testId) {
                        return true;
                    }
                }
                return false;
            });
            
            if (found) {
                console.log(`✅ FOUND: ${testId}`);
                console.log('Business:', found.fields['Business Name'] || found.fields['Company Name'] || found.fields['Name']);
            } else {
                console.log(`❌ NOT FOUND: ${testId}`);
            }
        });
        
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

// Run the debug
debugCustomerID();