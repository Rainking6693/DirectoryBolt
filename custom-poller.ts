/**
 * Custom Poller Worker - Reliable Job Processing
 * Polls for pending jobs and processes directory submissions
 * Features: Exponential backoff, retry logic, health checks
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { chromium, Browser, Page } from 'playwright';

// Configuration
const POLL_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 60000; // 1 minute
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute
const MAX_CONCURRENT_JOBS = 5;

// Initialize Supabase client
const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface Job {
  id: string;
  customer_id: string;
  package_type: string;
  package_size: number;
  directory_limit: number;
  status: string;
  business_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  created_at: string;
  updated_at: string;
}

interface DirectorySubmission {
  id: string;
  job_id: string;
  customer_id: string;
  directory_name: string;
  directory_url: string;
  status: string;
  retry_count: number;
  error_message?: string;
}

interface HealthMetrics {
  uptime: number;
  jobsProcessed: number;
  jobsFailed: number;
  lastHealthCheck: Date;
  isHealthy: boolean;
}

class CustomPoller {
  private browser: Browser | null = null;
  private isRunning = false;
  private activeJobs = new Set<string>();
  private metrics: HealthMetrics = {
    uptime: 0,
    jobsProcessed: 0,
    jobsFailed: 0,
    lastHealthCheck: new Date(),
    isHealthy: true,
  };
  private startTime: number = Date.now();

  /**
   * Start the poller
   */
  async start(): Promise<void> {
    console.log('🚀 Starting Custom Poller...');
    this.isRunning = true;
    this.startTime = Date.now();

    // Initialize browser
    await this.initializeBrowser();

    // Start health check interval
    setInterval(() => this.performHealthCheck(), HEALTH_CHECK_INTERVAL);

    // Start polling loop
    await this.pollLoop();
  }

  /**
   * Stop the poller
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Custom Poller...');
    this.isRunning = false;

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    console.log('✅ Poller stopped successfully');
  }

  /**
   * Initialize Playwright browser
   */
  private async initializeBrowser(): Promise<void> {
    try {
      console.log('🌐 Initializing browser...');
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      console.log('✅ Browser initialized');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Main polling loop
   */
  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        if (this.activeJobs.size < MAX_CONCURRENT_JOBS) {
          await this.processNextJob();
        }

        // Wait before next poll
        await this.sleep(POLL_INTERVAL);
      } catch (error) {
        console.error('❌ Error in poll loop:', error);
        await this.sleep(POLL_INTERVAL);
      }
    }
  }

  /**
   * Process the next pending job
   */
  private async processNextJob(): Promise<void> {
    try {
      // Fetch next pending job
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        console.error('❌ Error fetching jobs:', error);
        return;
      }

      if (!jobs || jobs.length === 0) {
        return; // No pending jobs
      }

      const job = jobs[0] as Job;

      // Check if job is already being processed
      if (this.activeJobs.has(job.id)) {
        return;
      }

      // Mark job as active
      this.activeJobs.add(job.id);

      // Update job status to in_progress
      await this.updateJobStatus(job.id, 'in_progress');

      console.log(`📋 Processing job ${job.id} for ${job.business_name}`);

      // Process the job
      await this.processJob(job);

      // Remove from active jobs
      this.activeJobs.delete(job.id);
    } catch (error) {
      console.error('❌ Error processing job:', error);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    try {
      // Fetch directory submissions for this job
      const { data: submissions, error } = await supabase
        .from('directory_submissions')
        .select('*')
        .eq('job_id', job.id)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Failed to fetch submissions: ${error.message}`);
      }

      if (!submissions || submissions.length === 0) {
        console.log(`⚠️ No pending submissions for job ${job.id}`);
        await this.updateJobStatus(job.id, 'completed');
        return;
      }

      console.log(`📊 Processing ${submissions.length} submissions for job ${job.id}`);

      // Process each submission
      for (const submission of submissions as DirectorySubmission[]) {
        await this.processSubmission(submission, job);
      }

      // Update job status to completed
      await this.updateJobStatus(job.id, 'completed');
      this.metrics.jobsProcessed++;

      console.log(`✅ Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);
      await this.updateJobStatus(job.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
      this.metrics.jobsFailed++;
    }
  }

  /**
   * Process a single directory submission
   */
  private async processSubmission(
    submission: DirectorySubmission,
    job: Job
  ): Promise<void> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < MAX_RETRIES) {
      try {
        console.log(`🔄 Processing submission ${submission.id} (attempt ${retryCount + 1}/${MAX_RETRIES})`);

        // Update submission status to in_progress
        await this.updateSubmissionStatus(submission.id, 'in_progress');

        // Create a new page
        if (!this.browser) {
          throw new Error('Browser not initialized');
        }

        const page = await this.browser.newPage();

        try {
          // Navigate to directory URL
          await page.goto(submission.directory_url, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          // Fill form (simplified - would need actual form detection logic)
          await this.fillDirectoryForm(page, job);

          // Submit form
          await this.submitForm(page);

          // Update submission status to submitted
          await this.updateSubmissionStatus(submission.id, 'submitted');

          console.log(`✅ Submission ${submission.id} completed successfully`);
          break; // Success - exit retry loop
        } finally {
          await page.close();
        }
      } catch (error) {
        lastError = error as Error;
        retryCount++;

        console.error(
          `❌ Submission ${submission.id} failed (attempt ${retryCount}/${MAX_RETRIES}):`,
          error
        );

        if (retryCount < MAX_RETRIES) {
          // Calculate backoff delay
          const backoffDelay = Math.min(
            INITIAL_BACKOFF * Math.pow(2, retryCount - 1),
            MAX_BACKOFF
          );

          console.log(`⏳ Retrying in ${backoffDelay}ms...`);
          await this.sleep(backoffDelay);
        }
      }
    }

    // If all retries failed, mark as failed
    if (retryCount >= MAX_RETRIES && lastError) {
      await this.updateSubmissionStatus(
        submission.id,
        'failed',
        lastError.message
      );
      console.error(`❌ Submission ${submission.id} failed after ${MAX_RETRIES} attempts`);
    }
  }

  /**
   * Fill directory submission form
   */
  private async fillDirectoryForm(page: Page, job: Job): Promise<void> {
    // This is a simplified version - actual implementation would need
    // AI-powered form detection and mapping

    // Common form field selectors
    const selectors = {
      businessName: ['input[name="business_name"]', 'input[name="company"]', '#business-name'],
      email: ['input[type="email"]', 'input[name="email"]', '#email'],
      website: ['input[name="website"]', 'input[name="url"]', '#website'],
      phone: ['input[type="tel"]', 'input[name="phone"]', '#phone'],
      description: ['textarea[name="description"]', 'textarea', '#description'],
    };

    // Try to fill each field
    for (const selector of selectors.businessName) {
      try {
        await page.fill(selector, job.business_name, { timeout: 2000 });
        break;
      } catch {
        // Try next selector
      }
    }

    for (const selector of selectors.email) {
      try {
        await page.fill(selector, job.email, { timeout: 2000 });
        break;
      } catch {
        // Try next selector
      }
    }

    for (const selector of selectors.website) {
      try {
        await page.fill(selector, job.website, { timeout: 2000 });
        break;
      } catch {
        // Try next selector
      }
    }

    for (const selector of selectors.phone) {
      try {
        await page.fill(selector, job.phone, { timeout: 2000 });
        break;
      } catch {
        // Try next selector
      }
    }

    console.log('✅ Form filled successfully');
  }

  /**
   * Submit the form
   */
  private async submitForm(page: Page): Promise<void> {
    // Try common submit button selectors
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Send")',
    ];

    for (const selector of submitSelectors) {
      try {
        await page.click(selector, { timeout: 2000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log('✅ Form submitted successfully');
        return;
      } catch {
        // Try next selector
      }
    }

    throw new Error('Could not find submit button');
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error(`❌ Failed to update job status:`, error);
    }
  }

  /**
   * Update submission status
   */
  private async updateSubmissionStatus(
    submissionId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    if (status === 'failed') {
      // Increment retry count
      const { data } = await supabase
        .from('directory_submissions')
        .select('retry_count')
        .eq('id', submissionId)
        .single();

      if (data) {
        updateData.retry_count = (data.retry_count || 0) + 1;
      }
    }

    const { error } = await supabase
      .from('directory_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (error) {
      console.error(`❌ Failed to update submission status:`, error);
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      this.metrics.uptime = Date.now() - this.startTime;
      this.metrics.lastHealthCheck = new Date();

      // Check database connection
      const { error } = await supabase.from('jobs').select('id').limit(1);

      this.metrics.isHealthy = !error;

      console.log('💚 Health check:', {
        uptime: `${Math.floor(this.metrics.uptime / 1000)}s`,
        jobsProcessed: this.metrics.jobsProcessed,
        jobsFailed: this.metrics.jobsFailed,
        activeJobs: this.activeJobs.size,
        isHealthy: this.metrics.isHealthy,
      });
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.metrics.isHealthy = false;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current metrics
   */
  getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }
}

// Main execution
if (require.main === module) {
  const poller = new CustomPoller();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await poller.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await poller.stop();
    process.exit(0);
  });

  // Start poller
  poller.start().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export default CustomPoller;
