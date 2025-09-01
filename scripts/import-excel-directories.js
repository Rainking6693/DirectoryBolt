#!/usr/bin/env node

/**
 * 🚀 EXCEL DIRECTORY IMPORT SCRIPT
 * 
 * Reads directory data from directoryBolt480Directories.xlsx and imports into Supabase database
 * with comprehensive validation, duplicate detection, and error handling.
 * 
 * Features:
 * - Excel file reading with column mapping
 * - Data transformation to match DirectoryBolt schema
 * - Intelligent tier assignment based on Domain Authority
 * - Duplicate detection by website URL
 * - Batch processing for optimal performance
 * - Comprehensive validation and error reporting
 * - Dry-run and validation modes
 * - Integration with existing DirectoryBolt infrastructure
 * 
 * Usage:
 *   npm run import:excel
 *   node scripts/import-excel-directories.js --file=directoryBolt480Directories.xlsx
 *   node scripts/import-excel-directories.js --dry-run --validate
 *   node scripts/import-excel-directories.js --help
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for database access
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value || true;
  }
});

// Configuration with intelligent defaults
const config = {
  excelFile: options.file || 'directoryBolt480Directories.xlsx',
  dryRun: options['dry-run'] || false,
  validate: options.validate || false,
  batchSize: parseInt(options['batch-size']) || 25,
  skipDuplicates: options['skip-duplicates'] !== 'false',
  overwriteDuplicates: options['overwrite-duplicates'] || false,
  outputReport: options['output-report'] !== 'false',
  verbose: options.verbose || false
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

// Logging utilities
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logProgress(message) {
  log(`🔄 ${message}`, colors.cyan);
}

// Category mapping for consistent categorization
const CATEGORY_MAPPING = {
  // Business & General
  'business': 'business_general',
  'general business': 'business_general',
  'business directory': 'business_general',
  'business profile': 'business_general',
  
  // Technology & Startups
  'technology': 'tech_startups',
  'tech': 'tech_startups',
  'startup': 'tech_startups',
  'startups': 'tech_startups',
  'innovation': 'tech_startups',
  
  // SaaS & Software
  'software': 'saas',
  'saas': 'saas',
  'apps': 'saas',
  'tools': 'saas',
  
  // AI & Machine Learning
  'ai': 'ai_tools',
  'artificial intelligence': 'ai_tools',
  'machine learning': 'ai_tools',
  'ml': 'ai_tools',
  
  // Local Business
  'local': 'local_business',
  'local business': 'local_business',
  'directory': 'local_business',
  'maps': 'local_business',
  
  // Professional Services
  'professional': 'professional_services',
  'services': 'professional_services',
  'consulting': 'professional_services',
  'agency': 'professional_services',
  
  // Reviews & Ratings
  'reviews': 'review_platforms',
  'review': 'review_platforms',
  'ratings': 'review_platforms',
  'feedback': 'review_platforms',
  
  // E-commerce
  'ecommerce': 'ecommerce',
  'e-commerce': 'ecommerce',
  'shopping': 'ecommerce',
  'marketplace': 'ecommerce',
  
  // Social Media
  'social': 'social_media',
  'social media': 'social_media',
  'community': 'social_media',
  'network': 'social_media',
  
  // Content & Media
  'content': 'content_media',
  'media': 'content_media',
  'publishing': 'content_media',
  'blog': 'content_media',
  
  // Industry Specific
  'healthcare': 'healthcare',
  'medical': 'healthcare',
  'health': 'healthcare',
  'legal': 'legal',
  'law': 'legal',
  'finance': 'finance',
  'financial': 'finance',
  'real estate': 'real_estate',
  'property': 'real_estate',
  'education': 'education',
  'learning': 'education',
  'restaurant': 'restaurants',
  'food': 'restaurants',
  'automotive': 'automotive',
  'cars': 'automotive',
  'non-profit': 'non_profit',
  'charity': 'non_profit'
};

// Excel import class
class ExcelDirectoryImporter {
  constructor() {
    this.supabase = null;
    this.stats = {
      totalRows: 0,
      validRows: 0,
      duplicates: 0,
      errors: 0,
      inserted: 0,
      updated: 0,
      skipped: 0
    };
    this.errors = [];
    this.duplicateUrls = new Set();
    this.existingDirectories = new Map();
  }

  async initialize() {
    // Validate environment
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    logSuccess('Supabase client initialized');

    // Load existing directories for duplicate detection
    await this.loadExistingDirectories();
  }

  async loadExistingDirectories() {
    logProgress('Loading existing directories for duplicate detection...');

    try {
      const { data, error } = await this.supabase
        .from('directories')
        .select('id, name, website, domain_authority');

      if (error) {
        throw error;
      }

      data.forEach(dir => {
        this.existingDirectories.set(this.normalizeUrl(dir.website), {
          id: dir.id,
          name: dir.name,
          domain_authority: dir.domain_authority
        });
      });

      logSuccess(`Loaded ${this.existingDirectories.size} existing directories`);
    } catch (error) {
      logError(`Failed to load existing directories: ${error.message}`);
      throw error;
    }
  }

  normalizeUrl(url) {
    if (!url) return '';
    // Remove protocol, www, and trailing slashes for consistent comparison
    return url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  readExcelFile() {
    const filePath = path.resolve(config.excelFile);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found: ${filePath}`);
    }

    logProgress(`Reading Excel file: ${filePath}`);

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const rawData = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false
      });

      if (rawData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      const headers = rawData[0];
      const dataRows = rawData.slice(1);

      logSuccess(`Excel file read successfully: ${dataRows.length} data rows found`);
      
      if (config.verbose) {
        logInfo(`Headers detected: ${headers.join(', ')}`);
      }

      return { headers, dataRows };
    } catch (error) {
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }
  }

  mapExcelColumns(headers) {
    // Flexible column mapping to handle different Excel formats
    const columnMap = {};
    
    headers.forEach((header, index) => {
      const normalizedHeader = header.toString().toLowerCase().trim();
      
      // Map common variations to our schema fields
      if (['name', 'directory name', 'site name', 'website name'].includes(normalizedHeader)) {
        columnMap.name = index;
      } else if (['website', 'url', 'site url', 'website url', 'link'].includes(normalizedHeader)) {
        columnMap.website = index;
      } else if (['category', 'type', 'sector', 'industry'].includes(normalizedHeader)) {
        columnMap.category = index;
      } else if (['da', 'domain authority', 'authority', 'domain_authority'].includes(normalizedHeader)) {
        columnMap.domain_authority = index;
      } else if (['submission url', 'submit url', 'add url', 'registration url'].includes(normalizedHeader)) {
        columnMap.submission_url = index;
      } else if (['price', 'cost', 'fee', 'pricing'].includes(normalizedHeader)) {
        columnMap.price = index;
      } else if (['description', 'notes', 'details'].includes(normalizedHeader)) {
        columnMap.description = index;
      }
    });

    // Validate required columns
    const required = ['name', 'website', 'category'];
    const missing = required.filter(field => columnMap[field] === undefined);
    
    if (missing.length > 0) {
      throw new Error(`Missing required columns: ${missing.join(', ')}. Available columns: ${headers.join(', ')}`);
    }

    logSuccess(`Column mapping completed. Required fields mapped: ${Object.keys(columnMap).join(', ')}`);
    return columnMap;
  }

  transformExcelRowToDirectory(row, columnMap, index) {
    try {
      // Extract basic data
      const name = this.getCell(row, columnMap.name);
      const website = this.getCell(row, columnMap.website);
      const category = this.getCell(row, columnMap.category);
      const domainAuthority = this.getCell(row, columnMap.domain_authority, 50);

      // Validate required fields
      if (!name || !website || !category) {
        throw new Error(`Missing required data: name="${name}", website="${website}", category="${category}"`);
      }

      // Clean and validate website URL
      const cleanWebsite = this.cleanWebsiteUrl(website);
      if (!this.isValidUrl(cleanWebsite)) {
        throw new Error(`Invalid website URL: ${website}`);
      }

      // Map category to our system
      const mappedCategory = this.mapCategory(category);

      // Parse domain authority
      const parsedDA = this.parseDomainAuthority(domainAuthority);
      if (parsedDA < 0 || parsedDA > 100) {
        throw new Error(`Invalid domain authority: ${domainAuthority} (must be 0-100)`);
      }

      // Determine tier based on domain authority
      const tierRequired = this.determineTier(parsedDA);

      // Generate submission URL if not provided
      const submissionUrl = this.getCell(row, columnMap.submission_url) || this.generateSubmissionUrl(cleanWebsite);

      // Parse price
      const price = this.parsePrice(this.getCell(row, columnMap.price, 0));

      // Set intelligent defaults based on domain authority and category
      const defaults = this.getIntelligentDefaults(parsedDA, mappedCategory, price);

      return {
        name: name.trim(),
        website: cleanWebsite,
        category: mappedCategory,
        domain_authority: parsedDA,
        impact_level: defaults.impact_level,
        submission_url: submissionUrl,
        tier_required: tierRequired,
        difficulty: defaults.difficulty,
        active: true,
        estimated_traffic: defaults.estimated_traffic,
        time_to_approval: defaults.time_to_approval,
        price: Math.max(0, price),
        features: defaults.features,
        requires_approval: defaults.requires_approval,
        country_code: defaults.country_code,
        language: 'en'
      };

    } catch (error) {
      throw new Error(`Row ${index + 1}: ${error.message}`);
    }
  }

  getCell(row, columnIndex, defaultValue = '') {
    if (columnIndex === undefined || row[columnIndex] === undefined) {
      return defaultValue;
    }
    return String(row[columnIndex]).trim() || defaultValue;
  }

  cleanWebsiteUrl(url) {
    if (!url) return '';
    
    let cleaned = url.trim();
    
    // Add protocol if missing
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }

    // Remove trailing slashes
    cleaned = cleaned.replace(/\/+$/, '');

    return cleaned;
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  mapCategory(category) {
    if (!category) return 'business_general';
    
    const normalized = category.toLowerCase().trim();
    
    // Direct match
    if (CATEGORY_MAPPING[normalized]) {
      return CATEGORY_MAPPING[normalized];
    }

    // Partial match
    for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }

    // Default fallback
    return 'business_general';
  }

  parseDomainAuthority(da) {
    if (typeof da === 'number') return Math.round(da);
    
    const parsed = parseInt(String(da).replace(/[^\d]/g, ''));
    return isNaN(parsed) ? 50 : Math.min(100, Math.max(0, parsed));
  }

  determineTier(domainAuthority) {
    if (domainAuthority >= 90) return 1;
    if (domainAuthority >= 70) return 2;
    if (domainAuthority >= 50) return 3;
    return 4;
  }

  generateSubmissionUrl(website) {
    // Generate intelligent submission URLs based on common patterns
    const domain = website.replace(/^https?:\/\//, '').split('/')[0];
    
    const commonPatterns = [
      '/submit',
      '/add-listing',
      '/join',
      '/register',
      '/signup',
      '/claim',
      '/add',
      '/business/add'
    ];

    // Return first pattern (most common)
    return `https://${domain}${commonPatterns[0]}`;
  }

  parsePrice(price) {
    if (typeof price === 'number') return Math.round(price * 100); // Convert to cents
    
    const priceStr = String(price).replace(/[^\d.]/g, '');
    const parsed = parseFloat(priceStr) || 0;
    
    // Convert dollars to cents
    return Math.round(parsed * 100);
  }

  getIntelligentDefaults(domainAuthority, category, price) {
    // Determine impact level based on DA
    let impact_level = 'Medium';
    if (domainAuthority >= 85) impact_level = 'High';
    else if (domainAuthority < 60) impact_level = 'Low';

    // Determine difficulty based on DA and price
    let difficulty = 'Medium';
    if (domainAuthority >= 90 || price > 10000) difficulty = 'Hard';
    else if (domainAuthority < 70 && price === 0) difficulty = 'Easy';

    // Estimate traffic based on DA
    let estimated_traffic = Math.round((domainAuthority / 100) * 10000000);
    if (domainAuthority >= 95) estimated_traffic *= 2;

    // Time to approval based on difficulty
    let time_to_approval = '1-3 days';
    if (difficulty === 'Easy') time_to_approval = 'Same day';
    else if (difficulty === 'Hard') time_to_approval = '1-4 weeks';

    // Default features based on category
    const categoryFeatures = {
      'business_general': ['Business Directory', 'Company Profile', 'Contact Information'],
      'tech_startups': ['Startup Profile', 'Product Launch', 'Tech Community'],
      'saas': ['Software Directory', 'Reviews', 'Feature Comparison'],
      'local_business': ['Local SEO', 'Business Listing', 'Location Services'],
      'review_platforms': ['Customer Reviews', 'Ratings', 'Trust Badge'],
      'social_media': ['Social Presence', 'Community Building', 'Content Sharing'],
      'ai_tools': ['AI Tool Discovery', 'Category Listings', 'User Reviews'],
      'ecommerce': ['Product Listings', 'Online Store', 'Shopping Features']
    };

    return {
      impact_level,
      difficulty,
      estimated_traffic,
      time_to_approval,
      features: categoryFeatures[category] || ['Directory Listing', 'Business Profile', 'Contact Information'],
      requires_approval: difficulty !== 'Easy',
      country_code: null // Will be detected based on domain if needed
    };
  }

  async processExcelData() {
    try {
      // Read Excel file
      const { headers, dataRows } = this.readExcelFile();
      this.stats.totalRows = dataRows.length;

      // Map columns
      const columnMap = this.mapExcelColumns(headers);

      // Transform data
      logProgress('Transforming Excel data to directory format...');
      const transformedDirectories = [];

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const directory = this.transformExcelRowToDirectory(dataRows[i], columnMap, i);
          
          // Check for duplicates
          const normalizedWebsite = this.normalizeUrl(directory.website);
          
          if (this.duplicateUrls.has(normalizedWebsite)) {
            this.stats.duplicates++;
            logWarning(`Row ${i + 1}: Duplicate website URL detected: ${directory.website}`);
            continue;
          }

          if (this.existingDirectories.has(normalizedWebsite)) {
            if (!config.overwriteDuplicates && config.skipDuplicates) {
              this.stats.skipped++;
              logWarning(`Row ${i + 1}: Website already exists in database: ${directory.website}`);
              continue;
            }
          }

          this.duplicateUrls.add(normalizedWebsite);
          transformedDirectories.push(directory);
          this.stats.validRows++;

        } catch (error) {
          this.stats.errors++;
          this.errors.push(error.message);
          logError(error.message);
        }
      }

      logSuccess(`Data transformation completed. ${this.stats.validRows} valid directories processed`);
      return transformedDirectories;

    } catch (error) {
      logError(`Failed to process Excel data: ${error.message}`);
      throw error;
    }
  }

  async insertDirectories(directories) {
    if (config.dryRun) {
      logInfo(`DRY RUN: Would insert ${directories.length} directories`);
      return;
    }

    logProgress(`Inserting ${directories.length} directories in batches of ${config.batchSize}...`);

    const totalBatches = Math.ceil(directories.length / config.batchSize);
    let batchSuccesses = 0;
    let batchErrors = 0;

    for (let i = 0; i < totalBatches; i++) {
      const start = i * config.batchSize;
      const end = Math.min(start + config.batchSize, directories.length);
      const batch = directories.slice(start, end);

      try {
        const { data, error } = await this.supabase
          .from('directories')
          .upsert(batch, { 
            onConflict: 'website',
            ignoreDuplicates: false 
          });

        if (error) {
          batchErrors += batch.length;
          logError(`Batch ${i + 1}/${totalBatches} failed: ${error.message}`);
          this.errors.push(`Batch ${i + 1}: ${error.message}`);
        } else {
          batchSuccesses += batch.length;
          this.stats.inserted += batch.length;
          logSuccess(`Batch ${i + 1}/${totalBatches} completed (${batch.length} records)`);
        }

        // Small delay between batches
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        batchErrors += batch.length;
        logError(`Batch ${i + 1}/${totalBatches} failed with exception: ${error.message}`);
        this.errors.push(`Batch ${i + 1}: ${error.message}`);
      }
    }

    logInfo(`Batch insertion completed: ${batchSuccesses} successful, ${batchErrors} failed`);

    if (batchErrors > 0) {
      throw new Error(`${batchErrors} records failed to insert`);
    }
  }

  generateReport() {
    if (!config.outputReport) return;

    const report = {
      timestamp: new Date().toISOString(),
      configuration: config,
      statistics: this.stats,
      errors: this.errors.slice(0, 50) // Limit error list
    };

    const reportPath = path.resolve(`excel-import-report-${Date.now()}.json`);
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      logSuccess(`Import report saved: ${reportPath}`);
    } catch (error) {
      logWarning(`Failed to save report: ${error.message}`);
    }

    return report;
  }

  async run() {
    try {
      logInfo('🚀 Starting Excel directory import...');
      logInfo(`Configuration: ${JSON.stringify(config, null, 2)}`);

      // Initialize
      await this.initialize();

      // Process Excel data
      const directories = await this.processExcelData();

      if (directories.length === 0) {
        logWarning('No valid directories to import');
        return;
      }

      // Validation mode
      if (config.validate && !config.dryRun) {
        logSuccess(`✅ Validation completed: ${directories.length} valid directories found`);
        return;
      }

      // Insert directories
      await this.insertDirectories(directories);

      // Generate final statistics
      await this.generateFinalStats();

      // Generate report
      this.generateReport();

      logSuccess('🎉 Excel directory import completed successfully!');

    } catch (error) {
      logError(`Import failed: ${error.message}`);
      throw error;
    }
  }

  async generateFinalStats() {
    try {
      const { count, error } = await this.supabase
        .from('directories')
        .select('*', { count: 'exact', head: true });

      if (!error) {
        logInfo(`📊 Total directories in database: ${count}`);
      }

      logInfo('📋 Import Statistics:');
      console.log(JSON.stringify(this.stats, null, 2));

      if (this.errors.length > 0) {
        logWarning(`⚠️  ${this.errors.length} errors occurred during import`);
        if (config.verbose) {
          this.errors.forEach((error, i) => {
            logError(`  ${i + 1}. ${error}`);
          });
        }
      }

    } catch (error) {
      logWarning(`Could not generate final stats: ${error.message}`);
    }
  }
}

// Help documentation
function showHelp() {
  console.log(`
${colors.cyan}DirectoryBolt Excel Import Script${colors.reset}

${colors.white}USAGE:${colors.reset}
  node scripts/import-excel-directories.js [options]

${colors.white}OPTIONS:${colors.reset}
  --file=FILE              Excel file to import (default: directoryBolt480Directories.xlsx)
  --dry-run                Validate data without importing to database
  --validate               Validate data transformation only
  --batch-size=N           Insert records in batches of N (default: 25)
  --skip-duplicates        Skip URLs that already exist (default: true)
  --overwrite-duplicates   Update existing directories with new data
  --output-report=false    Skip generating JSON import report
  --verbose                Show detailed logging and error messages
  --help                   Show this help message

${colors.white}EXAMPLES:${colors.reset}
  ${colors.green}# Import from default file${colors.reset}
  node scripts/import-excel-directories.js

  ${colors.green}# Validate data without importing${colors.reset}
  node scripts/import-excel-directories.js --dry-run --verbose

  ${colors.green}# Import from custom file with larger batches${colors.reset}
  node scripts/import-excel-directories.js --file=my-directories.xlsx --batch-size=50

  ${colors.green}# Overwrite existing directories${colors.reset}
  node scripts/import-excel-directories.js --overwrite-duplicates

${colors.white}EXCEL FILE FORMAT:${colors.reset}
  Required columns (case-insensitive):
  • Name / Directory Name / Website Name
  • Website / URL / Site URL
  • Category / Type / Industry
  
  Optional columns:
  • DA / Domain Authority
  • Submission URL / Submit URL
  • Price / Cost / Fee
  • Description / Notes

${colors.white}DATA TRANSFORMATION:${colors.reset}
  • Domain Authority → Tier Assignment (90+ = Tier 1, 70-89 = Tier 2, etc.)
  • Category → Mapped to DirectoryBolt categories
  • Missing fields → Intelligent defaults based on DA and category
  • URLs → Cleaned and validated
  • Prices → Converted to cents

${colors.white}DUPLICATE HANDLING:${colors.reset}
  • Duplicates detected by normalized website URL
  • Options to skip or overwrite existing directories
  • Comprehensive reporting of duplicate conflicts

${colors.cyan}For more information: https://github.com/your-repo/DirectoryBolt${colors.reset}
`);
}

// Main execution
async function main() {
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log(`
${colors.magenta}╔══════════════════════════════════════════╗
║       DirectoryBolt Excel Importer      ║
║         Excel-to-Database Pipeline       ║
╚══════════════════════════════════════════╝${colors.reset}
`);

  const importer = new ExcelDirectoryImporter();
  
  try {
    await importer.run();
    process.exit(0);
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { ExcelDirectoryImporter };