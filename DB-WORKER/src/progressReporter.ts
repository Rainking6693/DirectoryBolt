/**
 * Progress Reporter for AI Worker
 * Sends real-time updates to backend for dashboard display
 */

import axios from 'axios';

export interface ProgressUpdate {
  job_id: string;
  submission_id?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'submitting' | 'submitted' | 'approved' | 'rejected';
  directories_completed?: number;
  directories_failed?: number;
  current_directory?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

export class ProgressReporter {
  private apiBase: string;
  private authToken: string;

  constructor() {
    this.apiBase = process.env.NETLIFY_FUNCTIONS_URL || process.env.AUTOBOLT_API_BASE || 'http://localhost:3000';
    this.authToken = process.env.WORKER_AUTH_TOKEN || process.env.AUTOBOLT_API_KEY || '';
  }

  /**
   * Report progress update to backend
   */
  async reportProgress(update: ProgressUpdate): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.apiBase}/api/worker/update-progress`,
        update,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.status === 200 && response.data.success) {
        console.log(`✅ Progress reported for job ${update.job_id}`);
        return true;
      } else {
        console.error(`⚠️ Failed to report progress: ${response.data.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Progress report error: ${error.message}`);
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Data: ${JSON.stringify(error.response.data)}`);
        }
      } else {
        console.error(`❌ Unexpected error reporting progress:`, error);
      }
      return false;
    }
  }

  /**
   * Report job started
   */
  async reportJobStarted(jobId: string): Promise<boolean> {
    return this.reportProgress({
      job_id: jobId,
      status: 'in_progress',
      directories_completed: 0,
      directories_failed: 0,
    });
  }

  /**
   * Report job completed
   */
  async reportJobCompleted(
    jobId: string,
    completed: number,
    failed: number
  ): Promise<boolean> {
    return this.reportProgress({
      job_id: jobId,
      status: 'completed',
      directories_completed: completed,
      directories_failed: failed,
    });
  }

  /**
   * Report job failed
   */
  async reportJobFailed(
    jobId: string,
    errorMessage: string,
    completed: number,
    failed: number
  ): Promise<boolean> {
    return this.reportProgress({
      job_id: jobId,
      status: 'failed',
      error_message: errorMessage,
      directories_completed: completed,
      directories_failed: failed,
    });
  }

  /**
   * Report submission started
   */
  async reportSubmissionStarted(
    jobId: string,
    submissionId: string,
    directoryName: string
  ): Promise<boolean> {
    return this.reportProgress({
      job_id: jobId,
      submission_id: submissionId,
      status: 'submitting',
      current_directory: directoryName,
    });
  }

  /**
   * Report submission succeeded
   */
  async reportSubmissionSuccess(
    jobId: string,
    submissionId: string,
    completed: number,
    failed: number
  ): Promise<boolean> {
    return this.reportProgress({
      job_id: jobId,
      submission_id: submissionId,
      status: 'submitted',
      directories_completed: completed,
      directories_failed: failed,
    });
  }

  /**
   * Report submission failed
   */
  async reportSubmissionFailed(
    jobId: string,
    submissionId: string,
    errorMessage: string,
    completed: number,
    failed: number
  ): Promise<boolean> {
    return this.reportProgress({
      job_id: jobId,
      submission_id: submissionId,
      status: 'failed',
      error_message: errorMessage,
      directories_completed: completed,
      directories_failed: failed,
    });
  }

  /**
   * Report directory progress (batch update)
   */
  async reportDirectoryProgress(
    jobId: string,
    completed: number,
    failed: number,
    currentDirectory?: string
  ): Promise<boolean> {
    return this.reportProgress({
      job_id: jobId,
      directories_completed: completed,
      directories_failed: failed,
      current_directory: currentDirectory,
    });
  }
}

