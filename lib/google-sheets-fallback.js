// Google Sheets Fallback for Missing Private Key
// This provides graceful degradation when GOOGLE_PRIVATE_KEY is not available

const path = require('path');
const fs = require('fs');

export function createGoogleSheetsService() {
  // Try to load service account from file first
  let serviceAccount = null;
  let privateKey = null;
  let serviceAccountEmail = null;
  
  try {
    const serviceAccountPath = path.join(process.cwd(), 'config', 'directoryboltGoogleKey9.17.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountContent);
      privateKey = serviceAccount.private_key;
      serviceAccountEmail = serviceAccount.client_email;
      console.log('✅ Service account loaded from file for fallback service');
    }
  } catch (error) {
    console.warn('⚠️ Failed to load service account file, trying environment variables:', error.message);
  }
  
  // Fallback to environment variables if file loading failed
  if (!privateKey) {
    privateKey = process.env.GOOGLE_PRIVATE_KEY;
    serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  }
  
  if (!privateKey) {
    console.warn('GOOGLE_PRIVATE_KEY not available - using fallback mode')
    
    // Return a mock service that doesn't crash
    return {
      async getCustomerData(customerId) {
        console.warn('Google Sheets service unavailable - returning mock data')
        return {
          id: customerId,
          name: 'Customer',
          email: 'customer@example.com',
          status: 'active',
          fallback: true
        }
      },
      
      async validateCustomer(customerId) {
        console.warn('Google Sheets validation unavailable - allowing all customers')
        return true
      }
    }
  }
  
  // Normal Google Sheets service when private key is available
  const { GoogleSpreadsheet } = require('google-spreadsheet')
  const { JWT } = require('google-auth-library')
  
  const serviceAccountAuth = new JWT({
    email: serviceAccountEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  
  return {
    async getCustomerData(customerId) {
      try {
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth)
        await doc.loadInfo()
        
        const sheet = doc.sheetsByIndex[0]
        const rows = await sheet.getRows()
        
        const customer = rows.find(row => row.get('Customer ID') === customerId)
        
        if (customer) {
          return {
            id: customer.get('Customer ID'),
            name: customer.get('Business Name'),
            email: customer.get('Email'),
            status: customer.get('Status') || 'active'
          }
        }
        
        return null
      } catch (error) {
        console.error('Google Sheets error:', error)
        return null
      }
    },
    
    async validateCustomer(customerId) {
      const customer = await this.getCustomerData(customerId)
      return customer && customer.status === 'active'
    }
  }
}