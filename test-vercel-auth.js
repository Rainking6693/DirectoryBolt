// Test Vercel API authentication
import fetch from 'node-fetch';

async function testVercelAuth() {
    const token = 'vpETvjTsIUzOMbRaBaWoz03W';
    
    try {
        const response = await fetch('https://api.vercel.com/v6/deployments', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Vercel API Response Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Vercel API authentication successful!');
        } else {
            console.log('❌ Vercel API authentication failed');
        }
    } catch (error) {
        console.error('Error testing Vercel API:', error);
    }
}

testVercelAuth();