#!/usr/bin/env node

/**
 * 🔍 DATABASE SCHEMA VALIDATOR
 * 
 * Validates that the DirectoryBolt database schema is correctly set up
 * for Excel directory import with 484 directories.
 * 
 * Features:
 * - Validates table existence and structure
 * - Checks column types, constraints, and indexes
 * - Verifies Excel import compatibility
 * - Tests database connectivity and permissions
 * - Comprehensive reporting with recommendations
 * - Performance analysis for large imports
 * 
 * Usage:
 *   npm run validate:schema
 *   node scripts/validate-database-schema.js
 *   node scripts/validate-database-schema.js --verbose
 *   node scripts/validate-database-schema.js --fix-issues
 *   node scripts/validate-database-schema.js --help
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for database access
 */

const fs = require('fs');
const path = require('path');
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

// Configuration
const config = {
  verbose: options.verbose || false,
  fixIssues: options['fix-issues'] || false,
  outputReport: options['output-report'] !== 'false'
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

class DatabaseSchemaValidator {
  constructor() {
    this.supabase = null;
    this.validationResults = {
      passed: [],
      warnings: [],
      errors: [],
      recommendations: []
    };
    
    // Expected schema for Excel import
    this.expectedSchema = {
      tableName: 'directories',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, primary: true },
        { name: 'name', type: 'character varying', nullable: false },
        { name: 'website', type: 'character varying', nullable: false, unique: true },
        { name: 'category', type: 'character varying', nullable: false },
        { name: 'domain_authority', type: 'integer', nullable: true },
        { name: 'impact_level', type: 'character varying', nullable: true },
        { name: 'submission_url', type: 'character varying', nullable: true },
        { name: 'tier_required', type: 'integer', nullable: true },
        { name: 'difficulty', type: 'character varying', nullable: true },
        { name: 'active', type: 'boolean', nullable: false },
        { name: 'estimated_traffic', type: 'integer', nullable: true },
        { name: 'time_to_approval', type: 'character varying', nullable: true },
        { name: 'price', type: 'integer', nullable: true },
        { name: 'features', type: 'jsonb', nullable: true },
        { name: 'requires_approval', type: 'boolean', nullable: true },
        { name: 'country_code', type: 'character varying', nullable: true },
        { name: 'language', type: 'character varying', nullable: true },
        { name: 'description', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp with time zone', nullable: true },
        { name: 'updated_at', type: 'timestamp with time zone', nullable: true }
      ],
      indexes: [
        'idx_directories_name',
        'idx_directories_website', 
        'idx_directories_category',
        'idx_directories_domain_authority_desc',
        'idx_directories_tier_required',
        'idx_directories_active',
        'idx_directories_features_gin'
      ],
      constraints: [
        'directories_pkey', // Primary key
        'directories_website_key', // Unique constraint on website
        'directories_domain_authority_check',
        'directories_tier_required_check',
        'directories_impact_level_check',
        'directories_difficulty_check'
      ]
    };
  }

  async initialize() {
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY\n' +
        'Please ensure these are set in your .env.local file'
      );
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

    // Test connection
    await this.testConnection();
  }

  async testConnection() {
    logProgress('Testing database connection...');

    try {
      // Simple test using raw query
      const { data, error } = await this.supabase
        .rpc('version'); // This is a built-in function that should always work

      if (error) {
        // If version() doesn't work, try a simpler approach
        const { error: simpleError } = await this.supabase
          .from('information_schema.tables')
          .select('table_name')
          .limit(1);
        
        if (simpleError) {
          throw simpleError;
        }
      }

      this.validationResults.passed.push('Database connection successful');
      logSuccess('Database connection test passed');

    } catch (error) {
      this.validationResults.errors.push(`Database connection failed: ${error.message}`);
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  }

  async validateTableExists() {
    logProgress('Checking if directories table exists...');

    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', this.expectedSchema.tableName);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        this.validationResults.errors.push('Directories table does not exist');
        logError('Directories table does not exist');
        return false;
      }

      this.validationResults.passed.push('Directories table exists');
      logSuccess('Directories table found');
      return true;

    } catch (error) {
      this.validationResults.errors.push(`Table existence check failed: ${error.message}`);
      logError(`Table existence check failed: ${error.message}`);
      return false;
    }
  }

  async validateTableStructure() {
    logProgress('Validating table structure...');

    try {
      // Get table columns
      const { data: columns, error } = await this.supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', this.expectedSchema.tableName)
        .order('ordinal_position');

      if (error) {
        throw error;
      }

      if (!columns || columns.length === 0) {
        this.validationResults.errors.push('No columns found in directories table');
        logError('No columns found in directories table');
        return false;
      }

      const actualColumns = columns.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default
      }));

      // Check for required columns
      let structureValid = true;
      
      for (const expectedCol of this.expectedSchema.columns) {
        const actualCol = actualColumns.find(col => col.name === expectedCol.name);
        
        if (!actualCol) {
          this.validationResults.errors.push(`Missing required column: ${expectedCol.name}`);
          logError(`Missing column: ${expectedCol.name}`);
          structureValid = false;
          continue;
        }

        // Check data type compatibility
        if (!this.isTypeCompatible(actualCol.type, expectedCol.type)) {
          this.validationResults.warnings.push(
            `Column '${expectedCol.name}' type mismatch: expected ${expectedCol.type}, got ${actualCol.type}`
          );
          logWarning(`Type mismatch for ${expectedCol.name}: ${actualCol.type} vs ${expectedCol.type}`);
        }

        // Check nullable constraint
        if (expectedCol.nullable === false && actualCol.nullable === true) {
          this.validationResults.warnings.push(
            `Column '${expectedCol.name}' should be NOT NULL but is nullable`
          );
          logWarning(`Column ${expectedCol.name} should be NOT NULL`);
        }
      }

      // Check for unexpected columns
      const expectedColNames = this.expectedSchema.columns.map(col => col.name);
      const unexpectedCols = actualColumns.filter(col => !expectedColNames.includes(col.name));
      
      if (unexpectedCols.length > 0) {
        this.validationResults.warnings.push(
          `Unexpected columns found: ${unexpectedCols.map(col => col.name).join(', ')}`
        );
        logWarning(`Unexpected columns: ${unexpectedCols.map(col => col.name).join(', ')}`);
      }

      if (structureValid) {
        this.validationResults.passed.push(`Table structure validation passed: ${actualColumns.length} columns found`);
        logSuccess(`Table structure valid: ${actualColumns.length} columns`);
      }

      return structureValid;

    } catch (error) {
      this.validationResults.errors.push(`Table structure validation failed: ${error.message}`);
      logError(`Table structure validation failed: ${error.message}`);
      return false;
    }
  }

  isTypeCompatible(actualType, expectedType) {
    const typeMap = {
      'character varying': ['varchar', 'text', 'character varying'],
      'integer': ['integer', 'int', 'int4'],
      'boolean': ['boolean', 'bool'],
      'uuid': ['uuid'],
      'jsonb': ['jsonb', 'json'],
      'text': ['text', 'character varying', 'varchar'],
      'timestamp with time zone': ['timestamp with time zone', 'timestamptz']
    };

    const compatibleTypes = typeMap[expectedType] || [expectedType];
    return compatibleTypes.includes(actualType);
  }

  async validateIndexes() {
    logProgress('Validating database indexes...');

    try {
      const { data: indexes, error } = await this.supabase
        .from('pg_indexes')
        .select('indexname, indexdef')
        .eq('schemaname', 'public')
        .eq('tablename', this.expectedSchema.tableName);

      if (error) {
        throw error;
      }

      const actualIndexNames = (indexes || []).map(idx => idx.indexname);
      
      let indexesValid = true;
      
      for (const expectedIndex of this.expectedSchema.indexes) {
        if (!actualIndexNames.includes(expectedIndex)) {
          this.validationResults.warnings.push(`Missing index: ${expectedIndex}`);
          logWarning(`Missing index: ${expectedIndex}`);
          indexesValid = false;
        }
      }

      if (indexesValid && actualIndexNames.length > 0) {
        this.validationResults.passed.push(`Index validation passed: ${actualIndexNames.length} indexes found`);
        logSuccess(`Indexes valid: ${actualIndexNames.length} found`);
      }

      if (config.verbose) {
        logInfo('Found indexes:');
        actualIndexNames.forEach(name => logInfo(`  - ${name}`));
      }

      return indexesValid;

    } catch (error) {
      this.validationResults.warnings.push(`Index validation failed: ${error.message}`);
      logWarning(`Could not validate indexes: ${error.message}`);
      return true; // Non-critical, continue validation
    }
  }

  async validateConstraints() {
    logProgress('Validating table constraints...');

    try {
      const { data: constraints, error } = await this.supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_schema', 'public')
        .eq('table_name', this.expectedSchema.tableName);

      if (error) {
        throw error;
      }

      const actualConstraints = (constraints || []).map(c => c.constraint_name);
      
      let constraintsValid = true;
      
      for (const expectedConstraint of this.expectedSchema.constraints) {
        if (!actualConstraints.includes(expectedConstraint)) {
          this.validationResults.warnings.push(`Missing constraint: ${expectedConstraint}`);
          logWarning(`Missing constraint: ${expectedConstraint}`);
          constraintsValid = false;
        }
      }

      if (constraintsValid && actualConstraints.length > 0) {
        this.validationResults.passed.push(`Constraint validation passed: ${actualConstraints.length} constraints found`);
        logSuccess(`Constraints valid: ${actualConstraints.length} found`);
      }

      if (config.verbose) {
        logInfo('Found constraints:');
        constraints?.forEach(c => logInfo(`  - ${c.constraint_name} (${c.constraint_type})`));
      }

      return constraintsValid;

    } catch (error) {
      this.validationResults.warnings.push(`Constraint validation failed: ${error.message}`);
      logWarning(`Could not validate constraints: ${error.message}`);
      return true; // Non-critical
    }
  }

  async validateExcelImportCompatibility() {
    logProgress('Validating Excel import compatibility...');

    try {
      // Test if we can perform operations expected by Excel import
      
      // Test insert operation
      const testRecord = {
        name: 'Test Directory',
        website: 'https://test-directory-validation.com',
        category: 'test_category',
        domain_authority: 50,
        active: true
      };

      const { data: insertData, error: insertError } = await this.supabase
        .from('directories')
        .insert(testRecord)
        .select('id, name, website');

      if (insertError) {
        throw new Error(`Test insert failed: ${insertError.message}`);
      }

      // Test update operation
      if (insertData && insertData[0]) {
        const { error: updateError } = await this.supabase
          .from('directories')
          .update({ domain_authority: 75 })
          .eq('id', insertData[0].id);

        if (updateError) {
          throw new Error(`Test update failed: ${updateError.message}`);
        }

        // Clean up test record
        await this.supabase
          .from('directories')
          .delete()
          .eq('id', insertData[0].id);
      }

      this.validationResults.passed.push('Excel import compatibility test passed');
      logSuccess('Excel import operations work correctly');
      return true;

    } catch (error) {
      this.validationResults.errors.push(`Excel import compatibility test failed: ${error.message}`);
      logError(`Excel import compatibility failed: ${error.message}`);
      return false;
    }
  }

  async validatePerformance() {
    logProgress('Analyzing performance for large imports...');

    try {
      // Get table statistics
      const { data: stats, error } = await this.supabase
        .from('directories')
        .select('*', { count: 'exact', head: true });

      if (error && !error.message.includes('relation "directories" does not exist')) {
        throw error;
      }

      const recordCount = stats || 0;

      // Performance recommendations based on expected 484 directory import
      this.validationResults.recommendations.push(
        'For optimal performance importing 484 directories:'
      );
      
      if (recordCount === 0) {
        this.validationResults.recommendations.push(
          '• Use batch size of 25-50 records per transaction',
          '• Enable connection pooling for concurrent imports',
          '• Consider creating indexes after bulk import for better performance'
        );
      } else {
        this.validationResults.recommendations.push(
          `• Current table has ${recordCount} records`,
          '• Large imports may benefit from temporarily dropping indexes',
          '• Monitor connection pool usage during import'
        );
      }

      logSuccess(`Performance analysis complete: ${recordCount} existing records`);
      return true;

    } catch (error) {
      this.validationResults.warnings.push(`Performance analysis failed: ${error.message}`);
      logWarning(`Could not analyze performance: ${error.message}`);
      return true; // Non-critical
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      validation_summary: {
        total_checks: this.validationResults.passed.length + 
                     this.validationResults.warnings.length + 
                     this.validationResults.errors.length,
        passed: this.validationResults.passed.length,
        warnings: this.validationResults.warnings.length,
        errors: this.validationResults.errors.length,
        overall_status: this.validationResults.errors.length === 0 ? 'READY' : 'NEEDS_ATTENTION'
      },
      detailed_results: this.validationResults,
      excel_import_readiness: {
        ready: this.validationResults.errors.length === 0,
        blocking_issues: this.validationResults.errors,
        recommendations: this.validationResults.recommendations
      }
    };

    if (config.outputReport) {
      const reportPath = path.resolve(`schema-validation-report-${Date.now()}.json`);
      
      try {
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        logSuccess(`Validation report saved: ${reportPath}`);
      } catch (error) {
        logWarning(`Failed to save report: ${error.message}`);
      }
    }

    return report;
  }

  printSummary() {
    console.log(`
${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}
${colors.white}                    VALIDATION SUMMARY${colors.reset}
${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}

${colors.green}✅ PASSED (${this.validationResults.passed.length}):${colors.reset}`);

    this.validationResults.passed.forEach(item => {
      console.log(`   • ${item}`);
    });

    if (this.validationResults.warnings.length > 0) {
      console.log(`
${colors.yellow}⚠️  WARNINGS (${this.validationResults.warnings.length}):${colors.reset}`);
      
      this.validationResults.warnings.forEach(item => {
        console.log(`   • ${item}`);
      });
    }

    if (this.validationResults.errors.length > 0) {
      console.log(`
${colors.red}❌ ERRORS (${this.validationResults.errors.length}):${colors.reset}`);
      
      this.validationResults.errors.forEach(item => {
        console.log(`   • ${item}`);
      });
    }

    if (this.validationResults.recommendations.length > 0) {
      console.log(`
${colors.blue}💡 RECOMMENDATIONS:${colors.reset}`);
      
      this.validationResults.recommendations.forEach(item => {
        console.log(`   • ${item}`);
      });
    }

    console.log(`
${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}

${colors.white}EXCEL IMPORT STATUS:${colors.reset} ${
      this.validationResults.errors.length === 0 
        ? colors.green + '🚀 READY TO IMPORT 484 DIRECTORIES!' + colors.reset
        : colors.red + '⚠️  SCHEMA ISSUES NEED TO BE RESOLVED FIRST' + colors.reset
    }
`);
  }

  async run() {
    try {
      logInfo('🔍 Starting database schema validation...');

      await this.initialize();

      // Run all validation checks
      const tableExists = await this.validateTableExists();
      
      if (!tableExists) {
        logError('Cannot continue validation - directories table does not exist');
        this.validationResults.recommendations.push(
          'Run the database migration first: node scripts/run-database-migration.js'
        );
      } else {
        await this.validateTableStructure();
        await this.validateIndexes();
        await this.validateConstraints();
        await this.validateExcelImportCompatibility();
        await this.validatePerformance();
      }

      // Generate report
      const report = this.generateReport();

      // Print summary
      this.printSummary();

      return report;

    } catch (error) {
      logError(`Validation failed: ${error.message}`);
      throw error;
    }
  }
}

// Help documentation
function showHelp() {
  console.log(`
${colors.cyan}DirectoryBolt Database Schema Validator${colors.reset}

${colors.white}USAGE:${colors.reset}
  node scripts/validate-database-schema.js [options]

${colors.white}OPTIONS:${colors.reset}
  --verbose                Show detailed validation information
  --fix-issues             Automatically fix non-critical issues (future feature)
  --output-report=false    Skip generating JSON validation report
  --help                   Show this help message

${colors.white}EXAMPLES:${colors.reset}
  ${colors.green}# Basic validation${colors.reset}
  node scripts/validate-database-schema.js

  ${colors.green}# Detailed validation with verbose output${colors.reset}
  node scripts/validate-database-schema.js --verbose

${colors.white}VALIDATION CHECKS:${colors.reset}
  • Database connectivity and permissions
  • Directories table existence
  • Table structure and column types
  • Required indexes for performance
  • Table constraints and relationships
  • Excel import operation compatibility
  • Performance analysis for 484 directory import

${colors.white}ENVIRONMENT VARIABLES:${colors.reset}
  SUPABASE_URL                Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   Service role key for database access

${colors.cyan}This validator ensures your database is ready for the 484 directory Excel import${colors.reset}
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
║    DirectoryBolt Schema Validator        ║
║      Excel Import Readiness Check       ║
╚══════════════════════════════════════════╝${colors.reset}
`);

  const validator = new DatabaseSchemaValidator();
  
  try {
    const report = await validator.run();
    
    // Exit with appropriate code
    if (report.validation_summary.errors > 0) {
      logError('❌ Schema validation failed - please fix issues before importing');
      process.exit(1);
    } else {
      logSuccess('✅ Schema validation passed - ready for Excel import!');
      process.exit(0);
    }
  } catch (error) {
    logError(`Fatal validation error: ${error.message}`);
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

module.exports = { DatabaseSchemaValidator };