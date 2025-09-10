/**
 * DEBUG EXACT CUSTOMER ID ISSUE
 * Ben says DIR-202597-recwsFS91NG2O90xi is the correct format
 * Let's see what's actually in the database
 */

async function debugExactCustomerID() {
    const apiToken = 'patO7NwJbVcR7fGRK.e382e0bc9ca16c36139b8a890b729909430792cc3fe0aecce6b18c617f789845';
    const baseId = 'appZDNMzebkaOkLXo';
    const tableName = 'Directory Bolt Import';
    const baseUrl = 'https://api.airtable.com/v0';
    
    const benCustomerId = 'DIR-202597-recwsFS91NG2O90xi';
    
    console.log('🔍 DEBUGGING CUSTOMER ID ISSUE');
    console.log('Ben\'s Customer ID:', benCustomerId);
    console.log('Length:', benCustomerId.length);
    console.log('Characters:', benCustomerId.split('').map((c, i) => `${i}: '${c}'`).join(', '));
    
    try {
        const url = `${baseUrl}/${baseId}/${encodeURIComponent(tableName)}`;
        
        console.log('🌐 Making API call to:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            console.error('❌ API Error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return;
        }

        const data = await response.json();
        console.log('📊 Total records retrieved:', data.records?.length || 0);
        
        if (!data.records || data.records.length === 0) {
            console.error('❌ NO RECORDS FOUND IN DATABASE');
            return;
        }
        
        // Log ALL customer IDs to see exact format
        console.log('\n🔍 ALL CUSTOMER IDs IN DATABASE:');
        data.records.forEach((record, index) => {
            const fields = record.fields || {};
            
            console.log(`\n--- Record ${index + 1} ---`);
            console.log('Airtable Record ID:', record.id);
            
            // Check all possible customer ID fields
            const customerIdFields = [
                'Customer ID',
                'CustomerID', 
                'customer_id',
                'ID',
                'Record ID',
                'Customer_ID',
                'CUSTOMER_ID'
            ];
            
            let foundCustomerId = false;
            customerIdFields.forEach(fieldName => {
                if (fields[fieldName]) {
                    const value = fields[fieldName];
                    console.log(`  ${fieldName}: "${value}"`);
                    console.log(`    Length: ${value.length}`);
                    console.log(`    Characters: ${value.split('').map((c, i) => `${i}:'${c}'`).join(', ')}`);
                    
                    // Check if this matches Ben's ID
                    if (value === benCustomerId) {
                        console.log(`    ✅ EXACT MATCH with Ben's ID!`);
                        foundCustomerId = true;
                    } else {
                        console.log(`    ❌ No match with Ben's ID`);
                        // Show character-by-character comparison
                        console.log(`    Comparison:`);
                        const maxLen = Math.max(value.length, benCustomerId.length);
                        for (let i = 0; i < maxLen; i++) {
                            const dbChar = value[i] || '(missing)';
                            const benChar = benCustomerId[i] || '(missing)';
                            const match = dbChar === benChar ? '✅' : '❌';
                            console.log(`      ${i}: DB='${dbChar}' vs Ben='${benChar}' ${match}`);
                        }
                    }
                }
            });
            
            // Also log business name for context
            const businessName = fields['Business Name'] || fields['Company Name'] || fields['Name'] || 'No business name';
            console.log(`  Business: "${businessName}"`);
            
            if (foundCustomerId) {
                console.log('🎯 THIS IS BEN\'S RECORD!');
            }
        });
        
        // Final test - try to find Ben's customer ID
        console.log('\n🎯 FINAL SEARCH TEST:');
        console.log('Searching for:', benCustomerId);
        
        const foundRecord = data.records.find(record => {
            const fields = record.fields || {};
            const customerIdFields = [
                'Customer ID',
                'CustomerID', 
                'customer_id',
                'ID',
                'Record ID',
                'Customer_ID',
                'CUSTOMER_ID'
            ];
            
            for (const fieldName of customerIdFields) {
                if (fields[fieldName] === benCustomerId) {
                    console.log(`✅ FOUND in field: ${fieldName}`);
                    return true;
                }
            }
            return false;
        });
        
        if (foundRecord) {
            console.log('✅ SUCCESS: Customer found in database!');
            console.log('Business:', foundRecord.fields['Business Name'] || foundRecord.fields['Company Name'] || foundRecord.fields['Name']);
        } else {
            console.log('❌ FAILURE: Customer NOT found in database');
            console.log('This means either:');
            console.log('1. The customer ID format is different');
            console.log('2. The customer ID is in a different field name');
            console.log('3. The customer ID is not in this table');
            console.log('4. There\'s a character encoding issue');
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the debug immediately
console.log('🚀 Starting customer ID debug...');
debugExactCustomerID();