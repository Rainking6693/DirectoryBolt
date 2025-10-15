/**
 * Batch Directory Submitter
 * Processes multiple directories with the Gemini worker
 */

require('dotenv').config();
const GeminiDirectorySubmitter = require('./gemini-directory-submitter');
const DirectoryLoader = require('./load-directories');
const fs = require('fs');
const path = require('path');

class BatchSubmitter {
  constructor() {
    this.loader = new DirectoryLoader();
    this.submitter = null;
    this.results = [];
  }

  async initialize() {
    this.submitter = new GeminiDirectorySubmitter();
    await this.submitter.initialize();
    console.log('✅ Batch submitter initialized\n');
  }

  /**
   * Process a batch of directories
   * @param {Array} directories - Array of directory objects
   * @param {Object} businessData - Business information to submit
   * @param {Object} options - Processing options
   */
  async processBatch(directories, businessData, options = {}) {
    const {
      delayBetween = 5000,  // 5 seconds between submissions
      saveResults = true,
      stopOnError = false
    } = options;

    console.log(`🚀 Starting batch processing of ${directories.length} directories\n`);
    
    for (let i = 0; i < directories.length; i++) {
      const directory = directories[i];
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📍 Directory ${i + 1}/${directories.length}: ${directory.name}`);
      console.log(`🌐 URL: ${directory.website}`);
      console.log(`📊 DA: ${directory.domain_authority || 'N/A'} | Difficulty: ${directory.difficulty || directory.submission_difficulty}`);
      console.log('='.repeat(80));

      try {
        const result = await this.submitter.submitToDirectory(
          directory.website,
          businessData
        );

        const submissionResult = {
          directory: directory.name,
          url: directory.website,
          status: result.status,
          message: result.message,
          timestamp: new Date().toISOString(),
          difficulty: directory.difficulty || directory.submission_difficulty,
          domain_authority: directory.domain_authority
        };

        this.results.push(submissionResult);

        // Log result
        if (result.status === 'submitted') {
          console.log(`✅ SUCCESS: ${directory.name}`);
        } else {
          console.log(`❌ FAILED: ${directory.name} - ${result.message}`);
        }

        // Save intermediate results
        if (saveResults && (i + 1) % 5 === 0) {
          this.saveResults();
        }

        // Delay between submissions (except for last one)
        if (i < directories.length - 1) {
          console.log(`⏳ Waiting ${delayBetween/1000}s before next submission...`);
          await new Promise(resolve => setTimeout(resolve, delayBetween));
        }

      } catch (error) {
        console.error(`❌ Error processing ${directory.name}:`, error.message);
        
        this.results.push({
          directory: directory.name,
          url: directory.website,
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString(),
          difficulty: directory.difficulty || directory.submission_difficulty,
          domain_authority: directory.domain_authority
        });

        if (stopOnError) {
          console.log('🛑 Stopping batch due to error');
          break;
        }
      }
    }

    // Final results save
    if (saveResults) {
      this.saveResults();
    }

    // Print summary
    this.printSummary();

    return this.results;
  }

  /**
   * Save results to JSON file
   */
  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `batch-results-${timestamp}.json`;
    const filepath = path.join(__dirname, 'results', filename);

    // Create results directory if it doesn't exist
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalProcessed: this.results.length,
      results: this.results,
      summary: this.getSummary()
    }, null, 2));

    console.log(`\n💾 Results saved to: ${filename}`);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const total = this.results.length;
    const successful = this.results.filter(r => r.status === 'submitted').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    return {
      total,
      successful,
      failed,
      errors,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0
    };
  }

  /**
   * Print summary of batch processing
   */
  printSummary() {
    const summary = this.getSummary();

    console.log('\n' + '='.repeat(80));
    console.log('📊 BATCH PROCESSING SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Processed:  ${summary.total}`);
    console.log(`✅ Successful:    ${summary.successful} (${summary.successRate}%)`);
    console.log(`❌ Failed:        ${summary.failed}`);
    console.log(`⚠️  Errors:        ${summary.errors}`);
    console.log('='.repeat(80) + '\n');
  }

  async cleanup() {
    if (this.submitter) {
      await this.submitter.cleanup();
    }
  }
}

// Example usage
async function main() {
  const batchSubmitter = new BatchSubmitter();
  
  try {
    await batchSubmitter.initialize();

    // Load directories
    const loader = batchSubmitter.loader;
    loader.printStats();

    // Get test batch of 10 CAPTCHA-free directories
    const testBatch = loader.getTestBatch(10, 'easy');

    // Test business data
    const businessData = {
      business_name: "Test Business",
      email: "test@example.com",
      phone: "555-123-4567",
      website: "https://testbusiness.com",
      address: "123 Test Street",
      city: "Test City",
      state: "TS",
      zip: "12345"
    };

    // Process the batch
    await batchSubmitter.processBatch(testBatch, businessData, {
      delayBetween: 5000,
      saveResults: true,
      stopOnError: false
    });

  } catch (error) {
    console.error('❌ Batch processing failed:', error);
  } finally {
    await batchSubmitter.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = BatchSubmitter;

