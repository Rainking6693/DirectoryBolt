// DirectoryBolt API - Submissions Management Endpoints
// Comprehensive submission tracking and batch processing system

const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

// Rate limiting for submission endpoints
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 submissions per hour
  message: {
    error: 'Too many submissions, please try again later.',
    code: 'SUBMISSION_RATE_LIMIT_EXCEEDED'
  }
});

const batchSubmissionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // limit to 5 batch operations per day
  message: {
    error: 'Daily batch submission limit reached.',
    code: 'BATCH_LIMIT_EXCEEDED'
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// POST /api/submissions - Create new submission
async function createSubmission(req, res) {
  try {
    const {
      directory_id,
      business_name,
      business_description,
      business_url,
      business_email,
      business_phone,
      business_address,
      business_category,
      submission_data = {},
      priority = 3
    } = req.body;

    // Validate required fields
    if (!directory_id || !business_name || !business_url || !business_email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required_fields: ['directory_id', 'business_name', 'business_url', 'business_email'],
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate directory exists and is active
    const { data: directory, error: dirError } = await supabase
      .from('directories')
      .select('id, name, is_active, form_fields, submission_requirements')
      .eq('id', directory_id)
      .eq('is_active', true)
      .single();

    if (dirError || !directory) {
      return res.status(404).json({
        success: false,
        error: 'Directory not found or inactive',
        code: 'DIRECTORY_NOT_FOUND'
      });
    }

    // Validate submission data against directory form fields
    const validationResult = validateSubmissionData(submission_data, directory.form_fields);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid submission data',
        validation_errors: validationResult.errors,
        code: 'SUBMISSION_VALIDATION_ERROR'
      });
    }

    // Create the submission
    const submissionId = uuidv4();
    const { data, error } = await supabase
      .from('user_submissions')
      .insert([{
        id: submissionId,
        user_id: req.user?.id || 'anonymous', // Assuming user middleware
        directory_id,
        business_name,
        business_description,
        business_url,
        business_email,
        business_phone,
        business_address,
        business_category,
        submission_data,
        priority: Math.min(Math.max(priority, 1), 5),
        submission_status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create submission',
        code: 'DATABASE_ERROR'
      });
    }

    // Queue the submission for processing (in real implementation, this would use a job queue)
    // For now, we'll just update the status to in_progress
    setTimeout(async () => {
      await processSubmission(submissionId);
    }, 1000);

    res.status(201).json({
      success: true,
      data: {
        ...data,
        directory_name: directory.name,
        estimated_processing_time: '1-3 business days'
      },
      message: 'Submission created successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

// POST /api/submissions/bulk - Create bulk submissions
async function createBulkSubmissions(req, res) {
  try {
    const {
      batch_name,
      directory_ids = [],
      business_data,
      configuration = {}
    } = req.body;

    // Validate input
    if (!Array.isArray(directory_ids) || directory_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Directory IDs array is required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!business_data || !business_data.business_name || !business_data.business_url || !business_data.business_email) {
      return res.status(400).json({
        success: false,
        error: 'Complete business data is required',
        required_fields: ['business_name', 'business_url', 'business_email'],
        code: 'VALIDATION_ERROR'
      });
    }

    // Limit batch size
    if (directory_ids.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Batch size limited to 50 directories',
        code: 'BATCH_SIZE_EXCEEDED'
      });
    }

    // Validate directories exist and are active
    const { data: directories, error: dirError } = await supabase
      .from('directories')
      .select('id, name, is_active, form_fields, submission_requirements')
      .in('id', directory_ids)
      .eq('is_active', true);

    if (dirError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to validate directories',
        code: 'DATABASE_ERROR'
      });
    }

    if (directories.length !== directory_ids.length) {
      const foundIds = directories.map(d => d.id);
      const missingIds = directory_ids.filter(id => !foundIds.includes(id));
      
      return res.status(400).json({
        success: false,
        error: 'Some directories not found or inactive',
        missing_directory_ids: missingIds,
        code: 'DIRECTORIES_NOT_FOUND'
      });
    }

    // Create batch record
    const batchId = uuidv4();
    const { data: batch, error: batchError } = await supabase
      .from('batch_submissions')
      .insert([{
        id: batchId,
        user_id: req.user?.id || 'anonymous',
        batch_name: batch_name || `Batch ${new Date().toISOString()}`,
        total_submissions: directory_ids.length,
        status: 'pending',
        configuration
      }])
      .select()
      .single();

    if (batchError) {
      console.error('Batch creation error:', batchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create batch',
        code: 'DATABASE_ERROR'
      });
    }

    // Create individual submissions
    const submissions = directory_ids.map(directory_id => ({
      id: uuidv4(),
      user_id: req.user?.id || 'anonymous',
      directory_id,
      batch_id: batchId,
      business_name: business_data.business_name,
      business_description: business_data.business_description,
      business_url: business_data.business_url,
      business_email: business_data.business_email,
      business_phone: business_data.business_phone,
      business_address: business_data.business_address,
      business_category: business_data.business_category,
      submission_data: business_data.submission_data || {},
      priority: configuration.priority || 3,
      submission_status: 'pending'
    }));

    const { data: createdSubmissions, error: submissionsError } = await supabase
      .from('user_submissions')
      .insert(submissions)
      .select();

    if (submissionsError) {
      console.error('Submissions creation error:', submissionsError);
      
      // Clean up batch if submissions failed
      await supabase
        .from('batch_submissions')
        .delete()
        .eq('id', batchId);

      return res.status(500).json({
        success: false,
        error: 'Failed to create submissions',
        code: 'DATABASE_ERROR'
      });
    }

    // Start batch processing (in real implementation, use job queue)
    setTimeout(async () => {
      await processBatchSubmissions(batchId);
    }, 2000);

    res.status(201).json({
      success: true,
      data: {
        batch_id: batchId,
        batch_name: batch.batch_name,
        total_submissions: directory_ids.length,
        submissions: createdSubmissions.map(s => ({
          id: s.id,
          directory_id: s.directory_id,
          status: s.submission_status
        })),
        estimated_completion: '3-7 business days'
      },
      message: 'Batch submissions created successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

// GET /api/submissions - List user submissions
async function getUserSubmissions(req, res) {
  try {
    const {
      limit = 20,
      offset = 0,
      status,
      directory_id,
      batch_id,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const userId = req.user?.id || 'anonymous';
    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);

    let query = supabase
      .from('user_submissions')
      .select(`
        *,
        directories!inner(
          id,
          name,
          website,
          categories!inner(
            display_name,
            slug
          )
        ),
        batch_submissions(
          batch_name,
          status
        )
      `)
      .eq('user_id', userId);

    // Apply filters
    if (status) {
      query = query.eq('submission_status', status);
    }

    if (directory_id) {
      query = query.eq('directory_id', directory_id);
    }

    if (batch_id) {
      query = query.eq('batch_id', batch_id);
    }

    // Apply sorting
    const sortColumn = ['created_at', 'updated_at', 'submitted_at', 'approved_at'].includes(sort_by) 
      ? sort_by 
      : 'created_at';
    const sortDirection = sort_order === 'asc';
    
    query = query
      .order(sortColumn, { ascending: sortDirection })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch submissions',
        code: 'DATABASE_ERROR'
      });
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('user_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({
      success: true,
      data: data.map(submission => ({
        ...submission,
        directory_name: submission.directories.name,
        category_name: submission.directories.categories.display_name,
        batch_name: submission.batch_submissions?.batch_name
      })),
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total: totalCount,
        has_more: parsedOffset + parsedLimit < totalCount
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

// GET /api/submissions/batch/:batch_id - Track batch progress
async function getBatchProgress(req, res) {
  try {
    const { batch_id } = req.params;
    const userId = req.user?.id || 'anonymous';

    // Get batch details
    const { data: batch, error: batchError } = await supabase
      .from('batch_submissions')
      .select('*')
      .eq('id', batch_id)
      .eq('user_id', userId)
      .single();

    if (batchError || !batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
        code: 'BATCH_NOT_FOUND'
      });
    }

    // Get submission details
    const { data: submissions, error: submissionsError } = await supabase
      .from('user_submissions')
      .select(`
        id,
        directory_id,
        submission_status,
        submitted_at,
        approved_at,
        rejection_reason,
        directories!inner(name, website)
      `)
      .eq('batch_id', batch_id)
      .order('created_at', { ascending: true });

    if (submissionsError) {
      console.error('Database error:', submissionsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch submission details',
        code: 'DATABASE_ERROR'
      });
    }

    // Calculate progress statistics
    const stats = {
      total: submissions.length,
      pending: submissions.filter(s => s.submission_status === 'pending').length,
      in_progress: submissions.filter(s => s.submission_status === 'in_progress').length,
      submitted: submissions.filter(s => s.submission_status === 'submitted').length,
      approved: submissions.filter(s => s.submission_status === 'approved').length,
      rejected: submissions.filter(s => s.submission_status === 'rejected').length,
      failed: submissions.filter(s => s.submission_status === 'failed').length
    };

    const progress_percentage = Math.round(
      ((stats.approved + stats.rejected + stats.failed) / stats.total) * 100
    );

    res.json({
      success: true,
      data: {
        batch_info: {
          ...batch,
          progress_percentage,
          updated_stats: stats
        },
        submissions: submissions.map(s => ({
          id: s.id,
          directory_name: s.directories.name,
          directory_website: s.directories.website,
          status: s.submission_status,
          submitted_at: s.submitted_at,
          approved_at: s.approved_at,
          rejection_reason: s.rejection_reason
        })),
        statistics: stats
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

// GET /api/submissions/analytics - User submission analytics
async function getSubmissionAnalytics(req, res) {
  try {
    const userId = req.user?.id || 'anonymous';
    const { 
      period = '30', // days
      category_breakdown = 'true',
      directory_breakdown = 'true' 
    } = req.query;

    const periodDays = Math.min(parseInt(period), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Overall statistics
    const { data: overallStats } = await supabase
      .rpc('get_user_submission_stats', {
        user_id_param: userId,
        start_date_param: startDate.toISOString()
      });

    // Category breakdown
    let categoryBreakdown = null;
    if (category_breakdown === 'true') {
      const { data: categoryData } = await supabase
        .from('user_submissions')
        .select(`
          submission_status,
          directories!inner(
            categories!inner(
              display_name,
              slug
            )
          )
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      categoryBreakdown = processCategoryBreakdown(categoryData);
    }

    // Top performing directories
    let topDirectories = null;
    if (directory_breakdown === 'true') {
      const { data: directoryData } = await supabase
        .from('user_submissions')
        .select(`
          submission_status,
          directories!inner(
            id,
            name,
            da_score
          )
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      topDirectories = processDirectoryBreakdown(directoryData);
    }

    res.json({
      success: true,
      data: {
        period_days: periodDays,
        overall_statistics: overallStats?.[0] || {
          total_submissions: 0,
          approved_submissions: 0,
          rejected_submissions: 0,
          pending_submissions: 0,
          success_rate: 0
        },
        category_breakdown: categoryBreakdown,
        top_performing_directories: topDirectories,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Utility functions
function validateSubmissionData(submissionData, formFields) {
  const errors = [];
  
  if (!Array.isArray(formFields)) {
    return { valid: true, errors: [] };
  }

  formFields.forEach(field => {
    if (field.required && !submissionData[field.name]) {
      errors.push(`${field.name} is required`);
    }
    
    if (field.max_length && submissionData[field.name] && submissionData[field.name].length > field.max_length) {
      errors.push(`${field.name} exceeds maximum length of ${field.max_length}`);
    }
    
    if (field.type === 'email' && submissionData[field.name]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(submissionData[field.name])) {
        errors.push(`${field.name} must be a valid email address`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

function processCategoryBreakdown(categoryData) {
  const breakdown = {};
  
  categoryData.forEach(submission => {
    const categoryName = submission.directories.categories.display_name;
    const status = submission.submission_status;
    
    if (!breakdown[categoryName]) {
      breakdown[categoryName] = {
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        success_rate: 0
      };
    }
    
    breakdown[categoryName].total++;
    breakdown[categoryName][status]++;
  });

  // Calculate success rates
  Object.keys(breakdown).forEach(category => {
    const stats = breakdown[category];
    const completed = stats.approved + stats.rejected;
    stats.success_rate = completed > 0 ? Math.round((stats.approved / completed) * 100) : 0;
  });

  return breakdown;
}

function processDirectoryBreakdown(directoryData) {
  const breakdown = {};
  
  directoryData.forEach(submission => {
    const directoryId = submission.directories.id;
    const directoryName = submission.directories.name;
    const status = submission.submission_status;
    
    if (!breakdown[directoryId]) {
      breakdown[directoryId] = {
        name: directoryName,
        da_score: submission.directories.da_score,
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        success_rate: 0
      };
    }
    
    breakdown[directoryId].total++;
    breakdown[directoryId][status]++;
  });

  // Calculate success rates and return top 10
  return Object.values(breakdown)
    .map(dir => {
      const completed = dir.approved + dir.rejected;
      dir.success_rate = completed > 0 ? Math.round((dir.approved / completed) * 100) : 0;
      return dir;
    })
    .sort((a, b) => b.success_rate - a.success_rate)
    .slice(0, 10);
}

// Mock processing functions (in real implementation, these would be job queue workers)
async function processSubmission(submissionId) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Update submission status
  await supabase
    .from('user_submissions')
    .update({
      submission_status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', submissionId);
}

async function processBatchSubmissions(batchId) {
  // Update batch status to processing
  await supabase
    .from('batch_submissions')
    .update({
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', batchId);
  
  // In real implementation, process submissions one by one with proper queuing
  // For now, simulate batch processing
  setTimeout(async () => {
    await supabase
      .from('batch_submissions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        successful_submissions: 5,
        progress_percentage: 100
      })
      .eq('id', batchId);
  }, 30000);
}

module.exports = {
  submissionLimiter,
  batchSubmissionLimiter,
  createSubmission,
  createBulkSubmissions,
  getUserSubmissions,
  getBatchProgress,
  getSubmissionAnalytics,
  validateSubmissionData
};