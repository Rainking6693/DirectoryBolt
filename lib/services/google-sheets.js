const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.auth = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
  }

  async initialize() {
    try {
      const saPath = path.join(process.cwd(), 'config', 'directoryboltGoogleKey9.17.json');
      
      if (!fs.existsSync(saPath)) {
        throw new Error('Service account JSON not found at config/directoryboltGoogleKey9.17.json');
      }

      const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));

      this.auth = new google.auth.JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.readonly'
        ],
      });

      await this.auth.authorize();
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEET_ID environment variable not set');
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      return {
        ok: true,
        title: response.data.properties.title,
        sheets: response.data.sheets.map(sheet => sheet.properties.title)
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message
      };
    }
  }

  async getCustomerById(customerId) {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      const range = 'Customers!A1:Z';
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return { found: false, error: 'No data in sheet' };
      }

      const headers = rows[0].map(header => (header || '').toString().trim().toLowerCase());
      const records = rows.slice(1);

      const customerIdIndex = headers.indexOf('customerid');
      if (customerIdIndex === -1) {
        return { found: false, error: 'CustomerID column not found' };
      }

      const cleanedId = customerId.toString().trim().toUpperCase();
      const match = records.find(record => {
        const value = record[customerIdIndex];
        return (value || '').toString().trim().toUpperCase() === cleanedId;
      });

      if (!match) {
        return { found: false, error: 'Customer not found' };
      }

      // Map the data to an object
      const customer = {};
      headers.forEach((header, index) => {
        customer[header] = match[index] || '';
      });

      return {
        found: true,
        customer: {
          customerId: customer.customerid || '',
          firstName: customer.firstname || '',
          lastName: customer.lastname || '',
          businessName: customer.businessname || '',
          email: customer.email || '',
          phone: customer.phone || '',
          website: customer.website || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          zip: customer.zip || '',
          packageType: customer.packagetype || 'starter',
          status: customer.status || 'active',
          created: customer.created || ''
        }
      };
    } catch (error) {
      return {
        found: false,
        error: error.message
      };
    }
  }

  async addCustomer(customerData) {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      const timestamp = new Date().toISOString();
      const rowData = [
        customerData.customerId,
        customerData.firstName,
        customerData.lastName,
        customerData.businessName,
        customerData.email,
        customerData.phone || '',
        customerData.website || '',
        customerData.address || '',
        customerData.city || '',
        customerData.state || '',
        customerData.zip || '',
        customerData.packageType || 'starter',
        timestamp,
        customerData.status || 'active'
      ];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Customers!A:N',
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData]
        }
      });

      return {
        success: true,
        updatedRows: response.data.updates.updatedRows,
        customerId: customerData.customerId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllCustomers(limit = 100) {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      const range = `Customers!A1:N${limit + 1}`;
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return { success: true, customers: [], total: 0 };
      }

      const headers = rows[0].map(header => (header || '').toString().trim().toLowerCase());
      const records = rows.slice(1);

      const customers = records.map(record => {
        const customer = {};
        headers.forEach((header, index) => {
          customer[header] = record[index] || '';
        });

        return {
          customerId: customer.customerid || '',
          firstName: customer.firstname || '',
          lastName: customer.lastname || '',
          businessName: customer.businessname || '',
          email: customer.email || '',
          phone: customer.phone || '',
          website: customer.website || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          zip: customer.zip || '',
          packageType: customer.packagetype || 'starter',
          status: customer.status || 'active',
          created: customer.created || ''
        };
      });

      return {
        success: true,
        customers,
        total: customers.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        customers: [],
        total: 0
      };
    }
  }

  async updateCustomer(customerId, updateData) {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      // First, find the customer row
      const range = 'Customers!A1:Z';
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return { success: false, error: 'No data in sheet' };
      }

      const headers = rows[0].map(header => (header || '').toString().trim().toLowerCase());
      const records = rows.slice(1);

      const customerIdIndex = headers.indexOf('customerid');
      if (customerIdIndex === -1) {
        return { success: false, error: 'CustomerID column not found' };
      }

      const cleanedId = customerId.toString().trim().toUpperCase();
      const rowIndex = records.findIndex(record => {
        const value = record[customerIdIndex];
        return (value || '').toString().trim().toUpperCase() === cleanedId;
      });

      if (rowIndex === -1) {
        return { success: false, error: 'Customer not found' };
      }

      // Update the specific cells
      const actualRowIndex = rowIndex + 2; // +1 for header, +1 for 0-based index
      const updates = [];

      Object.entries(updateData).forEach(([field, value]) => {
        const headerIndex = headers.indexOf(field.toLowerCase());
        if (headerIndex !== -1) {
          const cellAddress = this.columnIndexToLetter(headerIndex) + actualRowIndex;
          updates.push({
            range: `Customers!${cellAddress}`,
            values: [[value]]
          });
        }
      });

      if (updates.length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates
        }
      });

      return {
        success: true,
        updatedFields: Object.keys(updateData),
        customerId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  columnIndexToLetter(index) {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode(65 + (index % 26)) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }

  getPackageLimits() {
    return {
      starter: 50,
      growth: 75,
      professional: 150,
      enterprise: 500
    };
  }

  validateCustomerId(customerId) {
    const pattern = /^DIR-\d{8}-\d{6}$/;
    return pattern.test(customerId);
  }

  generateCustomerId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `DIR-${year}${month}${day}-${random}`;
  }
}

module.exports = GoogleSheetsService;