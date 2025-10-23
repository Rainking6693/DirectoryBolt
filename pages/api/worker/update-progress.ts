/**
 * Worker Progress Update Endpoint
 * POST /api/worker/update-progress
 * 
 * Allows the AI worker to report progress on jobs and submissions
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface ProgressUpdateRequest {
  job_id: string;
  submission_id?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'submitting' | 'submitted' | 'approved' | 'rejected';
  directories_completed?: number;
  directories_failed?: number;
  current_directory?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

interface ProgressUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProgressUpdateResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Authenticate worker
  const authHeader = req.headers.authorization;
  const workerToken = process.env.WORKER_AUTH_TOKEN || process.env.AUTOBOLT_API_KEY;

  if (!authHeader || !workerToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (token !== workerToken) {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }

  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const data: ProgressUpdateRequest = req.body;

    if (!data.job_id) {
      return res.status(400).json({ success: false, error: 'job_id is required' });
    }

    // Update job progress
    if (data.status || data.directories_completed !== undefined || data.directories_failed !== undefined) {
      const jobUpdate: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.status) {
        jobUpdate.status = data.status;
        if (data.status === 'in_progress' && !data.directories_completed) {
          jobUpdate.started_at = new Date().toISOString();
        }
        if (data.status === 'completed') {
          jobUpdate.completed_at = new Date().toISOString();
        }
      }

      if (data.directories_completed !== undefined) {
        jobUpdate.directories_completed = data.directories_completed;
      }

      if (data.directories_failed !== undefined) {
        jobUpdate.directories_failed = data.directories_failed;
      }

      if (data.error_message) {
        jobUpdate.error_message = data.error_message;
      }

      // Calculate progress percentage
      const { data: jobData } = await supabase
        .from('jobs')
        .select('directories_to_process')
        .eq('id', data.job_id)
        .single();

      if (jobData && jobData.directories_to_process > 0) {
        const completed = data.directories_completed || 0;
        const failed = data.directories_failed || 0;
        const total = jobData.directories_to_process;
        jobUpdate.progress_percentage = ((completed + failed) / total) * 100;
      }

      // Update metadata
      if (data.current_directory || data.metadata) {
        const { data: currentJob } = await supabase
          .from('jobs')
          .select('metadata')
          .eq('id', data.job_id)
          .single();

        const existingMetadata = currentJob?.metadata || {};
        jobUpdate.metadata = {
          ...existingMetadata,
          ...(data.metadata || {}),
          ...(data.current_directory ? { current_directory: data.current_directory } : {}),
          last_update: new Date().toISOString(),
        };
      }

      const { error: jobError } = await supabase
        .from('jobs')
        .update(jobUpdate)
        .eq('id', data.job_id);

      if (jobError) {
        console.error('Failed to update job:', jobError);
        return res.status(500).json({ success: false, error: `Failed to update job: ${jobError.message}` });
      }
    }

    // Update specific submission if provided
    if (data.submission_id) {
      const submissionUpdate: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.status) {
        submissionUpdate.status = data.status;
        if (data.status === 'submitted') {
          submissionUpdate.submitted_at = new Date().toISOString();
        }
        if (data.status === 'approved') {
          submissionUpdate.approved_at = new Date().toISOString();
        }
        if (data.status === 'failed') {
          submissionUpdate.failed_at = new Date().toISOString();
          if (data.error_message) {
            // Append to error log
            const { data: currentSubmission } = await supabase
              .from('directory_submissions')
              .select('error_log')
              .eq('id', data.submission_id)
              .single();

            const errorLog = currentSubmission?.error_log || [];
            errorLog.push({
              timestamp: new Date().toISOString(),
              message: data.error_message,
            });
            submissionUpdate.error_log = errorLog;
            submissionUpdate.last_error_message = data.error_message;
          }
        }
      }

      const { error: submissionError } = await supabase
        .from('directory_submissions')
        .update(submissionUpdate)
        .eq('id', data.submission_id);

      if (submissionError) {
        console.error('Failed to update submission:', submissionError);
        return res.status(500).json({ success: false, error: `Failed to update submission: ${submissionError.message}` });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

