require('dotenv').config();
const GeminiDirectorySubmitter = require('./gemini-directory-submitter');
const axios = require('axios');

class GeminiJobProcessor {
  constructor() {
    this.submitter = new GeminiDirectorySubmitter();
    this.apiBaseUrl = process.env.NETLIFY_FUNCTIONS_URL || process.env.AUTOBOLT_API_BASE || 'http://localhost:3000/api';
    this.authToken = process.env.WORKER_AUTH_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.workerId = process.env.WORKER_ID || 'gemini-worker-001';
  }

  async start() {
    console.log('🚀 Starting Gemini-powered job processor...');
    
    try {
      await this.submitter.initialize();
      
      // Main processing loop
      while (true) {
        try {
          const job = await this.getNextJob();
          
          if (!job) {
            console.log('⏳ No jobs available, waiting 30 seconds...');
            await this.sleep(30000);
            continue;
          }
          
          console.log(`🎯 Processing job: ${job.id}`);
          await this.processJob(job);
          
        } catch (error) {
          console.error('❌ Error in main loop:', error);
          await this.sleep(10000); // Wait 10 seconds before retrying
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to start job processor:', error);
    } finally {
      await this.submitter.close();
    }
  }

  async getNextJob() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/autobolt/jobs/next`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Worker-ID': this.workerId,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get next job:', error.message);
      return null;
    }
  }

  async processJob(job) {
    const startTime = Date.now();
    const results = [];
    
    try {
      // Get directories to process
      const directories = await this.getDirectories(job.package_size || 50);
      
      console.log(`📋 Processing ${directories.length} directories for job ${job.id}`);
      
      for (let i = 0; i < directories.length; i++) {
        const directory = directories[i];
        
        try {
          console.log(`🎯 Processing directory ${i + 1}/${directories.length}: ${directory.name}`);
          
          // Submit to directory using Gemini
          const result = await this.submitToDirectory(directory, job);
          results.push(result);
          
          // Update progress
          await this.updateProgress(job.id, results);
          
          // Add delay between submissions
          await this.sleep(this.getRandomDelay());
          
        } catch (error) {
          console.error(`❌ Error processing directory ${directory.name}:`, error);
          results.push({
            directory_id: directory.id,
            directory_name: directory.name,
            status: 'failed',
            message: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Complete the job
      await this.completeJob(job.id, results, startTime);
      
    } catch (error) {
      console.error(`❌ Failed to process job ${job.id}:`, error);
      await this.updateJobStatus(job.id, 'failed', error.message);
    }
  }

  async submitToDirectory(directory, job) {
    const businessData = {
      business_name: job.business_name || job.customer?.business_name,
      email: job.email || job.customer?.email,
      phone: job.phone || job.customer?.phone,
      website: job.website || job.customer?.website,
      address: job.address || job.customer?.address,
      city: job.city || job.customer?.city,
      state: job.state || job.customer?.state,
      zip: job.zip || job.customer?.zip
    };

    const result = await this.submitter.submitToDirectory(directory.submission_url, businessData);
    
    return {
      directory_id: directory.id,
      directory_name: directory.name,
      status: result.status,
      message: result.message,
      screenshot_url: result.screenshot ? await this.uploadScreenshot(result.screenshot) : null,
      timestamp: new Date().toISOString()
    };
  }

  async getDirectories(limit) {
    // This would fetch from your directories table
    // For now, return some test directories
    return [
      {
        id: '1',
        name: 'Google Business Profile',
        submission_url: 'https://business.google.com/create',
        category: 'local_business'
      },
      {
        id: '2', 
        name: 'Yelp Business',
        submission_url: 'https://biz.yelp.com/signup_business',
        category: 'local_business'
      }
      // Add more directories as needed
    ].slice(0, limit);
  }

  async updateProgress(jobId, results) {
    try {
      await axios.post(`${this.apiBaseUrl}/autobolt/jobs/update`, {
        jobId,
        status: 'in_progress',
        directoryResults: results
      }, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Worker-ID': this.workerId,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
    } catch (error) {
      console.error('❌ Failed to update progress:', error.message);
    }
  }

  async completeJob(jobId, results, startTime) {
    const successfulSubmissions = results.filter(r => r.status === 'submitted').length;
    const failedSubmissions = results.filter(r => r.status === 'failed').length;
    const processingTime = Math.round((Date.now() - startTime) / 1000);

    try {
      await axios.post(`${this.apiBaseUrl}/autobolt/jobs/complete`, {
        jobId,
        finalStatus: 'complete',
        summary: {
          totalDirectories: results.length,
          successfulSubmissions,
          failedSubmissions,
          processingTimeSeconds: processingTime
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Worker-ID': this.workerId,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log(`✅ Job ${jobId} completed successfully!`);
      console.log(`📊 Results: ${successfulSubmissions} successful, ${failedSubmissions} failed`);
      
    } catch (error) {
      console.error('❌ Failed to complete job:', error.message);
    }
  }

  async updateJobStatus(jobId, status, errorMessage) {
    try {
      await axios.post(`${this.apiBaseUrl}/autobolt/jobs/update`, {
        jobId,
        status,
        errorMessage
      }, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Worker-ID': this.workerId,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
    } catch (error) {
      console.error('❌ Failed to update job status:', error.message);
    }
  }

  async uploadScreenshot(screenshotBuffer) {
    // Implement screenshot upload to your storage (Supabase, S3, etc.)
    // For now, return a placeholder
    return `screenshot_${Date.now()}.png`;
  }

  getRandomDelay() {
    // Random delay between 2-8 seconds to avoid detection
    return Math.random() * 6000 + 2000;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the processor if this file is run directly
if (require.main === module) {
  const processor = new GeminiJobProcessor();
  processor.start().catch(console.error);
}

module.exports = GeminiJobProcessor;
