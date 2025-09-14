/**
 * Google Sheets Integration Service
 * 
 * This service provides all Google Sheets operations for DirectoryBolt customer data management.
 * Replaces Airtable integration while maintaining identical interface and functionality.
 * 
 * MIGRATION: Airtable → Google Sheets (September 12, 2025)
 * SHEET ID: 1Cc9Ha5MXt_PAFncIz5HN4_BlAHy3egK1OmjBjj7BN0A
 * SERVICE ACCOUNT: directorybolt-service-58@directorybolt.iam.gserviceaccount.com
 */

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Google Sheets Column Mapping (matches Emily's specification)
const COLUMN_MAP = {
  A: 'customerID',           // DIR-2025-XXXXXX auto-generated
  B: 'firstName',            
  C: 'lastName',
  D: 'packageType',          // starter|growth|professional|enterprise
  E: 'submissionStatus',     // pending|in-progress|completed|failed
  F: 'businessName',
  G: 'email',
  H: 'phone', 
  I: 'address',
  J: 'city',
  K: 'state',
  L: 'zip',
  M: 'website',
  N: 'description',
  O: 'facebook',
  P: 'instagram',
  Q: 'linkedin', 
  R: 'logo',
  S: 'totalDirectories',
  T: 'directoriesSubmitted',
  U: 'directoriesFailed',
  V: 'submissionResults',
  W: 'submissionStartDate',
  X: 'submissionEndDate',
  Y: 'successRate',
  Z: 'notes',
  // Extended fields for AI analysis (if needed beyond Z)
  AA: 'aiAnalysisResults',
  AB: 'competitivePositioning',
  AC: 'directorySuccessProbabilities',
  AD: 'seoRecommendations',
  AE: 'lastAnalysisDate',
  AF: 'analysisConfidenceScore',
  AG: 'industryCategory',
  AH: 'targetMarketAnalysis',
  AI: 'revenueProjections',
  AJ: 'competitiveAdvantages',
  AK: 'marketPositioning',
  AL: 'prioritizedDirectories',
  AM: 'analysisVersion'
};

// Reverse mapping for easy lookup
const FIELD_TO_COLUMN = {};
Object.keys(COLUMN_MAP).forEach(col => {
  FIELD_TO_COLUMN[COLUMN_MAP[col]] = col;
});

/**
 * Google Sheets Service Configuration
 */
class GoogleSheetsConfig {
  constructor() {
    // FRANK EMERGENCY FIX: Enhanced environment variable detection for Netlify Functions
    const isNetlifyFunctions = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
    
    // Log comprehensive environment debugging info
    console.log('🚨 FRANK EMERGENCY DIAGNOSTIC - Environment Check:', {
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: !!process.env.NETLIFY,
      AWS_LAMBDA_FUNCTION_NAME: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
      isNetlifyFunctions,
      processEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE')),
      totalEnvVars: Object.keys(process.env).length
    });
    
    // Get environment variables with enhanced debugging
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    
    // Handle private key formatting for Netlify environment with enhanced debugging
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    console.log('🔍 FRANK EMERGENCY - Raw Env Var Status:', {
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID ? 'SET' : 'MISSING',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'MISSING',
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY ? 'SET' : 'MISSING',
      GOOGLE_PRIVATE_KEY_length: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
      GOOGLE_PRIVATE_KEY_starts_with: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 20) || 'N/A'
    });
    
    if (privateKey) {
      // Handle different formats of private key in Netlify
      if (privateKey.includes('\\n')) {
        // Handle escaped newlines from Netlify environment
        privateKey = privateKey.replace(/\\n/g, '\n');
        console.log('🔧 Converted escaped newlines in private key');
      }

      // If key does not contain PEM headers, attempt base64 decode (common Netlify storage pattern)
      if (!privateKey.includes('-----BEGIN')) {
        try {
          const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
          if (decoded.includes('-----BEGIN') && decoded.includes('PRIVATE KEY-----')) {
            privateKey = decoded;
            console.log('🔐 Decoded base64 GOOGLE_PRIVATE_KEY to PEM format');
          } else {
            console.warn('⚠️ GOOGLE_PRIVATE_KEY appears to lack PEM headers after base64 decode');
          }
        } catch (e) {
          console.warn('⚠️ GOOGLE_PRIVATE_KEY base64 decode failed:', e.message);
        }
      }
      
      // Ensure proper formatting
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.warn('⚠️ Private key may not be properly formatted - missing BEGIN header');
      }
    }
    
    this.privateKey = privateKey;
    
    // Log configuration status (without exposing sensitive data)
    console.log('🔧 Google Sheets Config Status:', {
      spreadsheetId: !!this.spreadsheetId,
      serviceAccountEmail: !!this.serviceAccountEmail, 
      privateKey: !!this.privateKey,
      netlifyContext: isNetlifyFunctions,
      privateKeyLength: this.privateKey?.length || 0
    });
    
    // FRANK EMERGENCY FIX: Provide detailed error messages for debugging
    const missingVars = [];
    if (!this.spreadsheetId) {
      missingVars.push('GOOGLE_SHEET_ID');
    }
    if (!this.serviceAccountEmail) {
      missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    }
    if (!this.privateKey) {
      missingVars.push('GOOGLE_PRIVATE_KEY');
    }
    
    if (missingVars.length > 0) {
      const errorMessage = `🚨 NETLIFY FUNCTIONS ENVIRONMENT WARNING: Missing environment variables: ${missingVars.join(', ')}.\n\nDeployment Context: ${isNetlifyFunctions ? 'Netlify Functions' : 'Local/Other'}\nAvailable Google env vars: ${Object.keys(process.env).filter(k => k.includes('GOOGLE')).join(', ') || 'NONE'}\n\nInitialization will be attempted later and may fail with a clearer message.`;

      // Do not throw here. Defer validation to initialize() so callers can handle gracefully.
      console.error(errorMessage);
      this.missingVars = missingVars;
      this.envValid = false;
    } else {
      this.envValid = true;
    }
  }
}

/**
 * Google Sheets Service - Direct replacement for AirtableService
 * Maintains identical interface for seamless migration
 */
class GoogleSheetsService {
  constructor(config = null) {
    this.config = config || new GoogleSheetsConfig();
    this.doc = null;
    this.sheet = null;
    // Remove persistent authentication state for serverless
    // Each function invocation will initialize fresh
  }

  /**
   * Initialize Google Sheets connection and authentication
   * Optimized for serverless environments (Netlify Functions)
   */
  async initialize() {
    // In serverless, we initialize fresh each time - no persistent connections
    try {
      // Verify environment variables are available
      if (!this.config.spreadsheetId) {
        throw new Error('GOOGLE_SHEET_ID environment variable is missing');
      }
      if (!this.config.serviceAccountEmail) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is missing');
      }
      if (!this.config.privateKey) {
        throw new Error('GOOGLE_PRIVATE_KEY environment variable is missing');
      }

      console.log('🔄 Initializing Google Sheets service for Netlify Functions...');
      console.log('📊 Spreadsheet ID:', this.config.spreadsheetId);
      console.log('📧 Service Account:', this.config.serviceAccountEmail);
      console.log('🔑 Private Key Available:', !!this.config.privateKey);

      // Create JWT auth for serverless environment
      const serviceAccountAuth = new JWT({
        email: this.config.serviceAccountEmail,
        key: this.config.privateKey,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });

      // Initialize document fresh for each request (serverless best practice)
      this.doc = new GoogleSpreadsheet(this.config.spreadsheetId, serviceAccountAuth);
      await this.doc.loadInfo();

      // Get or create the main sheet
      this.sheet = this.doc.sheetsByIndex[0];
      if (!this.sheet) {
        console.log('📝 Creating new DirectoryBolt Customers sheet...');
        this.sheet = await this.doc.addSheet({ 
          title: 'DirectoryBolt Customers',
          headerValues: Object.values(COLUMN_MAP)
        });
      }

      console.log('✅ Google Sheets authentication successful for Netlify Functions');
      console.log('📋 Sheet Title:', this.sheet.title);
      console.log('📏 Sheet Rows:', this.sheet.rowCount);

    } catch (error) {
      console.error('❌ Google Sheets authentication failed in Netlify Functions:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      });
      throw new Error(`Google Sheets connection failed in Netlify: ${error.message}`);
    }
  }

  /**
   * Generate unique customer ID in format DIR-2025-001234 
   * (maintains exact same format as Airtable service)
   */
  generateCustomerId() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `DIR-${year}-${timestamp}${randomSuffix}`;
  }

  /**
   * Get directory limit based on package type
   * (maintains exact same limits as Emily specified)
   */
  getDirectoryLimitByPackage(packageType) {
    const limits = {
      'starter': 50,
      'growth': 75,         // Updated per Emily's specification
      'professional': 150,  // Updated per Emily's specification  
      'enterprise': 500,
      'subscription': 0     // Subscription doesn't get bulk directories
    };
    return limits[packageType?.toLowerCase()] || 50;
  }

  /**
   * Create a new business submission record in Google Sheets
   * (maintains identical interface to AirtableService.createBusinessSubmission)
   */
  async createBusinessSubmission(data) {
    await this.initialize();

    try {
      // Generate customer ID if not provided
      const customerId = data.customerId || this.generateCustomerId();

      // Prepare record data with defaults (exact same as Airtable service)
      const recordData = {
        customerID: customerId,  // Note: using customerID (capital I, D) for consistency
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        packageType: data.packageType || 'starter',
        submissionStatus: data.submissionStatus || 'pending', 
        purchaseDate: data.purchaseDate || new Date().toISOString(),
        directoriesSubmitted: data.directoriesSubmitted || 0,
        failedDirectories: data.failedDirectories || 0,
        businessName: data.businessName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        website: data.website || '',
        description: data.description || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        linkedin: data.linkedin || '',
        logo: data.logo || '',
        sessionId: data.sessionId || '',
        stripeCustomerId: data.stripeCustomerId || '',
        totalDirectories: this.getDirectoryLimitByPackage(data.packageType || 'starter'),
        submissionStartDate: data.submissionStartDate || '',
        submissionEndDate: data.submissionEndDate || '',
        submissionResults: data.submissionResults || '',
        successRate: data.successRate || 0,
        notes: data.notes || ''
      };

      console.log('🔄 Creating Google Sheets record:', {
        customerId: recordData.customerID,
        businessName: recordData.businessName,
        email: recordData.email,
        packageType: recordData.packageType,
        submissionStatus: recordData.submissionStatus
      });

      // Add row to sheet
      const row = await this.sheet.addRow(recordData);

      console.log('✅ Google Sheets record created successfully:', {
        rowNumber: row.rowNumber,
        customerId: recordData.customerID,
        businessName: recordData.businessName
      });

      // Return in same format as Airtable service
      return {
        recordId: row.rowNumber.toString(),
        customerId: recordData.customerID,
        customerID: recordData.customerID, // Provide both formats for compatibility
        ...recordData
      };

    } catch (error) {
      console.error('❌ Failed to create Google Sheets record:', error);
      throw new Error(`Google Sheets creation failed: ${error.message}`);
    }
  }

  /**
   * Update an existing business submission record
   * (maintains identical interface to AirtableService.updateBusinessSubmission)
   */
  async updateBusinessSubmission(recordId, updates) {
    await this.initialize();

    try {
      console.log('🔄 Updating Google Sheets record:', { recordId, updates });

      // Load all rows to find the record
      const rows = await this.sheet.getRows();
      const rowIndex = parseInt(recordId) - 2; // Convert to 0-based index (subtract 2 for header + 1-based)
      
      if (rowIndex < 0 || rowIndex >= rows.length) {
        throw new Error(`Record with ID ${recordId} not found`);
      }

      const row = rows[rowIndex];
      
      // Update fields
      Object.keys(updates).forEach(field => {
        if (field === 'customerId') {
          row.customerID = updates[field]; // Handle field name mapping
        } else {
          row[field] = updates[field];
        }
      });

      await row.save();

      const normalizedCustomerId = row.customerID || row.customerId;
      console.log('✅ Google Sheets record updated successfully:', {
        recordId: recordId,
        customerId: normalizedCustomerId
      });

      // Return in same format as Airtable service
      return {
        recordId: recordId,
        customerId: normalizedCustomerId,
        customerID: normalizedCustomerId, // Provide both formats for compatibility
        ...row._rawData
      };

    } catch (error) {
      console.error('❌ Failed to update Google Sheets record:', error);
      throw new Error(`Google Sheets update failed: ${error.message}`);
    }
  }

  /**
   * Find business submission by customer ID
   * (maintains identical interface to AirtableService.findByCustomerId)
   */
  async findByCustomerId(customerId) {
    await this.initialize();

    try {
      const rows = await this.sheet.getRows();
      
      // Search for customer ID (handle both customerID and customerId field formats)
      const cleanCustomerId = customerId.trim();
      const upperCustomerId = cleanCustomerId.toUpperCase();
      
      const foundRow = rows.find(row => {
        const rowCustomerId = row.customerID || row.customerId || '';
        return rowCustomerId === cleanCustomerId || rowCustomerId === upperCustomerId;
      });

      if (!foundRow) {
        return null;
      }

      const normalizedCustomerId = foundRow.customerID || foundRow.customerId;
      return {
        recordId: foundRow.rowNumber.toString(),
        customerId: normalizedCustomerId,
        customerID: normalizedCustomerId, // Provide both formats for compatibility
        ...foundRow._rawData
      };

    } catch (error) {
      console.error('❌ Failed to find Google Sheets record by customer ID:', error);
      throw new Error(`Google Sheets lookup failed: ${error.message}`);
    }
  }

  /**
   * Find business submissions by status
   * (maintains identical interface to AirtableService.findByStatus)
   */
  async findByStatus(status) {
    await this.initialize();

    try {
      const rows = await this.sheet.getRows();
      
      const filteredRows = rows.filter(row => 
        row.submissionStatus === status
      );

      // Sort by purchase date (ascending)
      filteredRows.sort((a, b) => {
        const dateA = new Date(a.purchaseDate || '1970-01-01');
        const dateB = new Date(b.purchaseDate || '1970-01-01');
        return dateA - dateB;
      });

      return filteredRows.map(row => {
        const normalizedCustomerId = row.customerID || row.customerId;
        return {
          recordId: row.rowNumber.toString(),
          customerId: normalizedCustomerId,
          customerID: normalizedCustomerId, // Provide both formats for compatibility
          ...row._rawData
        };
      });

    } catch (error) {
      console.error('❌ Failed to find Google Sheets records by status:', error);
      throw new Error(`Google Sheets status lookup failed: ${error.message}`);
    }
  }

  /**
   * Update submission status for AutoBolt processing
   * (maintains identical interface to AirtableService.updateSubmissionStatus)
   */
  async updateSubmissionStatus(customerId, status, directoriesSubmitted, failedDirectories) {
    try {
      // First find the record by customer ID
      const existingRecord = await this.findByCustomerId(customerId);
      if (!existingRecord) {
        throw new Error(`No record found for customer ID: ${customerId}`);
      }

      const updates = {
        submissionStatus: status
      };

      if (directoriesSubmitted !== undefined) {
        updates.directoriesSubmitted = directoriesSubmitted;
      }

      if (failedDirectories !== undefined) {
        updates.failedDirectories = failedDirectories;
      }

      return await this.updateBusinessSubmission(existingRecord.recordId, updates);

    } catch (error) {
      console.error('❌ Failed to update submission status:', error);
      throw new Error(`Status update failed: ${error.message}`);
    }
  }

  /**
   * Get all pending submissions for AutoBolt processing queue
   * (maintains identical interface to AirtableService.getPendingSubmissions)
   */
  async getPendingSubmissions() {
    return await this.findByStatus('pending');
  }

  /**
   * Phase 3.2: Store AI analysis results for a customer
   * (maintains identical interface to AirtableService.storeAIAnalysisResults)
   */
  async storeAIAnalysisResults(customerId, analysisData, directoryOpportunities, revenueProjections) {
    try {
      console.log('🧠 Storing AI analysis results for customer:', customerId);

      // Find existing record
      const existingRecord = await this.findByCustomerId(customerId);
      if (!existingRecord) {
        throw new Error(`No record found for customer ID: ${customerId}`);
      }

      // Prepare analysis data for storage (same format as Airtable service)
      const analysisUpdate = {
        aiAnalysisResults: JSON.stringify(analysisData),
        competitivePositioning: this.extractCompetitivePositioning(analysisData),
        directorySuccessProbabilities: JSON.stringify(directoryOpportunities.prioritizedSubmissions.map(dir => ({
          directoryId: dir.directoryId,
          directoryName: dir.directoryName,
          successProbability: dir.successProbability,
          estimatedROI: dir.expectedROI,
          priority: dir.priority
        }))),
        seoRecommendations: JSON.stringify(analysisData.seoAnalysis.improvementOpportunities.map(opp => opp.description)),
        lastAnalysisDate: new Date().toISOString(),
        analysisConfidenceScore: analysisData.confidence,
        industryCategory: analysisData.industryAnalysis.primaryIndustry,
        targetMarketAnalysis: JSON.stringify(analysisData.profile.targetMarket),
        revenueProjections: JSON.stringify(revenueProjections),
        competitiveAdvantages: JSON.stringify(analysisData.competitiveAnalysis.competitiveAdvantages),
        marketPositioning: JSON.stringify(analysisData.marketPositioning),
        prioritizedDirectories: JSON.stringify(directoryOpportunities.prioritizedSubmissions.slice(0, 20)), // Top 20 directories
        analysisVersion: '3.2.0'
      };

      return await this.updateBusinessSubmission(existingRecord.recordId, analysisUpdate);

    } catch (error) {
      console.error('❌ Failed to store AI analysis results:', error);
      throw new Error(`AI analysis storage failed: ${error.message}`);
    }
  }

  /**
   * Phase 3.2: Retrieve cached AI analysis results
   * (maintains identical interface to AirtableService.getCachedAnalysisResults)
   */
  async getCachedAnalysisResults(customerId) {
    try {
      const record = await this.findByCustomerId(customerId);
      if (!record || !record.aiAnalysisResults) {
        return null;
      }

      // Check if analysis is still valid (not older than 30 days)
      const analysisDate = new Date(record.lastAnalysisDate || '2000-01-01');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      if (analysisDate < thirtyDaysAgo) {
        console.log('🕒 Cached analysis is older than 30 days, requiring refresh');
        return null;
      }

      // Parse and return analysis data
      const analysisData = JSON.parse(record.aiAnalysisResults);
      console.log('✅ Retrieved cached AI analysis results for customer:', customerId);
      
      return analysisData;

    } catch (error) {
      console.error('❌ Failed to retrieve cached analysis results:', error);
      return null;
    }
  }

  /**
   * Phase 3.2: Check if business profile has changed since last analysis
   * (maintains identical interface to AirtableService.hasBusinessProfileChanged)
   */
  async hasBusinessProfileChanged(customerId, currentBusinessData) {
    try {
      const record = await this.findByCustomerId(customerId);
      if (!record || !record.lastAnalysisDate) {
        return true; // No previous analysis, consider it changed
      }

      // Compare key business fields
      const keyFields = ['businessName', 'website', 'description', 'city', 'state'];
      for (const field of keyFields) {
        if (record[field] !== currentBusinessData[field]) {
          console.log(`🔄 Business profile changed: ${field} updated`);
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('❌ Failed to check business profile changes:', error);
      return true; // Assume changed on error to be safe
    }
  }

  /**
   * Phase 3.2: Get analysis history for trend tracking
   * (maintains identical interface to AirtableService.getAnalysisHistory)
   */
  async getAnalysisHistory(customerId) {
    try {
      const record = await this.findByCustomerId(customerId);
      if (!record || !record.aiAnalysisResults) {
        return [];
      }

      return [{
        analysisDate: record.lastAnalysisDate,
        version: record.analysisVersion || '1.0.0',
        confidenceScore: record.analysisConfidenceScore,
        industryCategory: record.industryCategory,
        competitivePositioning: record.competitivePositioning
      }];

    } catch (error) {
      console.error('❌ Failed to retrieve analysis history:', error);
      return [];
    }
  }

  /**
   * Phase 3.2: Track optimization improvements over time
   * (maintains identical interface to AirtableService.trackOptimizationProgress)
   */
  async trackOptimizationProgress(customerId, optimizationResults) {
    try {
      const updates = {
        directoriesSubmitted: optimizationResults.directoriesSubmittedSinceAnalysis,
        // Store optimization metrics as JSON for detailed tracking
        optimizationResults: JSON.stringify({
          ...optimizationResults,
          lastUpdated: new Date().toISOString()
        })
      };

      const existingRecord = await this.findByCustomerId(customerId);
      if (!existingRecord) {
        throw new Error(`No record found for customer ID: ${customerId}`);
      }

      return await this.updateBusinessSubmission(existingRecord.recordId, updates);

    } catch (error) {
      console.error('❌ Failed to track optimization progress:', error);
      throw new Error(`Optimization tracking failed: ${error.message}`);
    }
  }

  /**
   * Helper: Extract competitive positioning summary from analysis data
   * (maintains identical logic to AirtableService.extractCompetitivePositioning)
   */
  extractCompetitivePositioning(analysisData) {
    const competitive = analysisData.competitiveAnalysis;
    const positioning = analysisData.marketPositioning;
    
    const summary = [
      `Current Position: ${positioning.currentPosition}`,
      `Recommended Position: ${positioning.recommendedPosition}`,
      `Key Advantages: ${competitive.competitiveAdvantages.slice(0, 3).join(', ')}`,
      `Market Gaps: ${competitive.marketGaps.slice(0, 2).map(gap => gap.description).join('; ')}`
    ].join(' | ');

    return summary.substring(0, 500); // Limit to 500 chars for consistency
  }

  /**
   * Health check - verify Google Sheets connection
   * (maintains identical interface to AirtableService.healthCheck)
   */
  async healthCheck() {
    try {
      await this.initialize();
      
      // Try to access sheet info to verify connection
      await this.sheet.loadHeaderRow();
      
      console.log('✅ Google Sheets health check passed');
      return true;

    } catch (error) {
      console.error('❌ Google Sheets health check failed:', error);
      return false;
    }
  }
}

/**
 * Initialize Google Sheets service with environment variables
 * (maintains identical interface to createAirtableService)
 */
function createGoogleSheetsService() {
  return new GoogleSheetsService();
}

// Export the service and config (maintaining same export pattern as Airtable service)
module.exports = {
  GoogleSheetsService,
  GoogleSheetsConfig,
  createGoogleSheetsService,
  // Export default instance for backward compatibility
  default: createGoogleSheetsService
};