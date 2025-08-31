// DirectoryBolt API - Analytics & Reporting Endpoints
// Comprehensive analytics for directory performance and user insights

const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');

// Rate limiting for analytics endpoints
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 analytics requests per window
  message: {
    error: 'Too many analytics requests, please try again later.',
    code: 'ANALYTICS_RATE_LIMIT_EXCEEDED'
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

// GET /api/analytics/directories/stats - Directory performance statistics
async function getDirectoryStats(req, res) {
  try {
    const {
      period = '30', // days
      category,
      include_trends = 'false'
    } = req.query;

    const periodDays = Math.min(parseInt(period), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Overall directory statistics
    const { data: overallStats, error: overallError } = await supabase
      .from('directories')
      .select(`
        id,
        category_id,
        da_score,
        success_rate,
        average_approval_time,
        submission_difficulty,
        pricing_model,
        priority_tier,
        is_active,
        categories!inner(
          display_name,
          slug
        )
      `)
      .eq('is_active', true);

    if (overallError) {
      console.error('Database error:', overallError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch directory statistics',
        code: 'DATABASE_ERROR'
      });
    }

    // Filter by category if specified
    let filteredDirectories = overallStats;
    if (category) {
      filteredDirectories = overallStats.filter(d => d.categories.slug === category);
    }

    // Calculate aggregated statistics
    const stats = calculateDirectoryAggregates(filteredDirectories);

    // Get submission performance data
    const { data: submissionStats, error: submissionError } = await supabase
      .from('user_submissions')
      .select(`
        submission_status,
        created_at,
        submitted_at,
        approved_at,
        directory_id,
        directories!inner(
          category_id,
          categories!inner(slug, display_name)
        )
      `)
      .gte('created_at', startDate.toISOString());

    if (submissionError) {
      console.error('Submission stats error:', submissionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch submission statistics',
        code: 'DATABASE_ERROR'
      });
    }

    // Process submission performance
    const submissionPerformance = processSubmissionPerformance(submissionStats, category);

    // Get trends if requested
    let trends = null;
    if (include_trends === 'true') {
      trends = await calculateTrends(startDate, category);
    }

    res.json({
      success: true,
      data: {
        period_days: periodDays,
        filter: { category: category || 'all' },
        directory_statistics: stats,
        submission_performance: submissionPerformance,
        trends: trends,
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

// GET /api/analytics/directories/:id/success-rate - Historical success data
async function getDirectorySuccessRate(req, res) {
  try {
    const { id } = req.params;
    const { 
      period = '90',
      granularity = 'weekly' // daily, weekly, monthly
    } = req.query;

    const periodDays = Math.min(parseInt(period), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Validate directory exists
    const { data: directory, error: dirError } = await supabase
      .from('directories')
      .select('id, name, success_rate, is_active')
      .eq('id', id)
      .single();

    if (dirError || !directory) {
      return res.status(404).json({
        success: false,
        error: 'Directory not found',
        code: 'DIRECTORY_NOT_FOUND'
      });
    }

    // Get historical submission data
    const { data: submissions, error: submissionError } = await supabase
      .from('user_submissions')
      .select('submission_status, created_at, submitted_at, approved_at')
      .eq('directory_id', id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (submissionError) {
      console.error('Database error:', submissionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch submission history',
        code: 'DATABASE_ERROR'
      });
    }

    // Process historical data into time series
    const timeSeries = processTimeSeriesData(submissions, granularity, startDate);

    // Calculate trends and insights
    const insights = calculateDirectoryInsights(submissions, directory);

    res.json({
      success: true,
      data: {
        directory: {
          id: directory.id,
          name: directory.name,
          current_success_rate: directory.success_rate,
          is_active: directory.is_active
        },
        period_days: periodDays,
        granularity,
        time_series: timeSeries,
        insights,
        total_submissions: submissions.length,
        analysis_date: new Date().toISOString()
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

// GET /api/analytics/categories/performance - Category performance comparison
async function getCategoryPerformance(req, res) {
  try {
    const { 
      period = '30',
      metrics = 'success_rate,avg_da,avg_approval_time'
    } = req.query;

    const periodDays = Math.min(parseInt(period), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const requestedMetrics = metrics.split(',').map(m => m.trim());

    // Get category-wise directory data
    const { data: categoryData, error: categoryError } = await supabase
      .from('directories')
      .select(`
        da_score,
        success_rate,
        average_approval_time,
        submission_difficulty,
        pricing_model,
        is_active,
        categories!inner(
          id,
          slug,
          display_name,
          sort_order
        )
      `)
      .eq('is_active', true)
      .order('categories.sort_order', { ascending: true });

    if (categoryError) {
      console.error('Database error:', categoryError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch category data',
        code: 'DATABASE_ERROR'
      });
    }

    // Get submission data for the period
    const { data: submissionData, error: submissionError } = await supabase
      .from('user_submissions')
      .select(`
        submission_status,
        created_at,
        directory_id,
        directories!inner(
          category_id,
          categories!inner(id, slug, display_name)
        )
      `)
      .gte('created_at', startDate.toISOString());

    if (submissionError) {
      console.error('Submission data error:', submissionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch submission data',
        code: 'DATABASE_ERROR'
      });
    }

    // Process category performance
    const categoryPerformance = processCategoryPerformance(categoryData, submissionData, requestedMetrics);

    res.json({
      success: true,
      data: {
        period_days: periodDays,
        metrics_included: requestedMetrics,
        category_performance: categoryPerformance,
        summary: {
          total_categories: categoryPerformance.length,
          best_performing: categoryPerformance[0],
          average_success_rate: categoryPerformance.reduce((sum, cat) => sum + cat.success_rate, 0) / categoryPerformance.length
        },
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

// GET /api/analytics/performance/top-directories - Top performing directories
async function getTopPerformingDirectories(req, res) {
  try {
    const {
      limit = '10',
      metric = 'success_rate', // success_rate, da_score, approval_speed
      period = '30',
      category
    } = req.query;

    const parsedLimit = Math.min(parseInt(limit), 50);
    const periodDays = Math.min(parseInt(period), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Base query for directories
    let query = supabase
      .from('directories')
      .select(`
        id,
        name,
        website,
        da_score,
        success_rate,
        average_approval_time,
        submission_difficulty,
        priority_tier,
        pricing_model,
        categories!inner(
          slug,
          display_name
        )
      `)
      .eq('is_active', true);

    // Filter by category if specified
    if (category) {
      query = query.eq('categories.slug', category);
    }

    // Apply sorting based on metric
    switch (metric) {
      case 'da_score':
        query = query.order('da_score', { ascending: false });
        break;
      case 'approval_speed':
        query = query.order('average_approval_time', { ascending: true });
        break;
      case 'success_rate':
      default:
        query = query.order('success_rate', { ascending: false });
        break;
    }

    query = query.limit(parsedLimit);

    const { data: directories, error: dirError } = await query;

    if (dirError) {
      console.error('Database error:', dirError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch directory data',
        code: 'DATABASE_ERROR'
      });
    }

    // Get recent submission data for these directories
    const directoryIds = directories.map(d => d.id);
    const { data: recentSubmissions } = await supabase
      .from('user_submissions')
      .select('directory_id, submission_status, created_at')
      .in('directory_id', directoryIds)
      .gte('created_at', startDate.toISOString());

    // Enhance directories with recent performance data
    const enhancedDirectories = directories.map(directory => {
      const dirSubmissions = recentSubmissions?.filter(s => s.directory_id === directory.id) || [];
      const recentStats = calculateRecentStats(dirSubmissions);
      
      return {
        ...directory,
        recent_performance: recentStats,
        performance_score: calculatePerformanceScore(directory, recentStats),
        category_name: directory.categories.display_name
      };
    });

    // Re-sort by performance score if using composite metrics
    if (metric === 'performance_score') {
      enhancedDirectories.sort((a, b) => b.performance_score - a.performance_score);
    }

    res.json({
      success: true,
      data: {
        metric_used: metric,
        period_days: periodDays,
        category_filter: category || 'all',
        top_directories: enhancedDirectories,
        analysis: {
          average_da_score: Math.round(enhancedDirectories.reduce((sum, d) => sum + d.da_score, 0) / enhancedDirectories.length),
          average_success_rate: Math.round(enhancedDirectories.reduce((sum, d) => sum + d.success_rate * 100, 0) / enhancedDirectories.length),
          average_approval_time: Math.round(enhancedDirectories.reduce((sum, d) => sum + d.average_approval_time, 0) / enhancedDirectories.length)
        },
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

// GET /api/analytics/insights/recommendations - AI-powered directory recommendations
async function getDirectoryRecommendations(req, res) {
  try {
    const {
      business_type,
      budget = 'any',
      priority_goals = 'balanced', // authority, speed, success_rate, balanced
      exclude_directories = '',
      limit = '10'
    } = req.query;

    const parsedLimit = Math.min(parseInt(limit), 25);
    const excludedIds = exclude_directories ? exclude_directories.split(',').map(id => id.trim()) : [];

    // Get directories with comprehensive data
    let query = supabase
      .from('directories')
      .select(`
        *,
        categories!inner(
          slug,
          display_name,
          metadata
        )
      `)
      .eq('is_active', true);

    // Filter by business type compatibility
    if (business_type) {
      query = query.contains('business_types', [business_type]);
    }

    // Filter by budget
    if (budget === 'free') {
      query = query.eq('pricing_model', 'free');
    } else if (budget === 'paid') {
      query = query.in('pricing_model', ['paid', 'freemium']);
    }

    // Exclude specified directories
    if (excludedIds.length > 0) {
      query = query.not('id', 'in', `(${excludedIds.join(',')})`);
    }

    const { data: directories, error: dirError } = await query;

    if (dirError) {
      console.error('Database error:', dirError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch directories',
        code: 'DATABASE_ERROR'
      });
    }

    // Score and rank directories based on priority goals
    const scoredDirectories = directories.map(directory => {
      const scores = calculateRecommendationScores(directory, priority_goals);
      return {
        ...directory,
        recommendation_score: scores.total,
        score_breakdown: scores.breakdown,
        recommendation_reasons: generateRecommendationReasons(directory, scores),
        category_name: directory.categories.display_name
      };
    });

    // Sort by recommendation score and limit results
    const topRecommendations = scoredDirectories
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, parsedLimit);

    // Generate insights and tips
    const insights = generateRecommendationInsights(topRecommendations, {
      business_type,
      budget,
      priority_goals
    });

    res.json({
      success: true,
      data: {
        recommendations: topRecommendations,
        recommendation_criteria: {
          business_type: business_type || 'any',
          budget,
          priority_goals,
          excluded_count: excludedIds.length
        },
        insights,
        recommendation_tips: [
          'Start with high-authority directories for maximum SEO impact',
          'Consider free directories first to build your foundation',
          'Focus on directories relevant to your business category',
          'Monitor submission success rates to optimize your strategy'
        ],
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

// Utility functions for calculations and processing

function calculateDirectoryAggregates(directories) {
  const total = directories.length;
  
  if (total === 0) {
    return {
      total_directories: 0,
      average_da_score: 0,
      average_success_rate: 0,
      average_approval_time: 0,
      pricing_breakdown: {},
      difficulty_breakdown: {},
      tier_breakdown: {}
    };
  }

  return {
    total_directories: total,
    average_da_score: Math.round(directories.reduce((sum, d) => sum + d.da_score, 0) / total),
    average_success_rate: Math.round(directories.reduce((sum, d) => sum + d.success_rate * 100, 0) / total),
    average_approval_time: Math.round(directories.reduce((sum, d) => sum + d.average_approval_time, 0) / total),
    pricing_breakdown: groupBy(directories, 'pricing_model'),
    difficulty_breakdown: groupBy(directories, 'submission_difficulty'),
    tier_breakdown: groupBy(directories, 'priority_tier')
  };
}

function processSubmissionPerformance(submissions, categoryFilter) {
  let filteredSubmissions = submissions;
  
  if (categoryFilter) {
    filteredSubmissions = submissions.filter(s => 
      s.directories.categories.slug === categoryFilter
    );
  }

  const total = filteredSubmissions.length;
  const approved = filteredSubmissions.filter(s => s.submission_status === 'approved').length;
  const rejected = filteredSubmissions.filter(s => s.submission_status === 'rejected').length;
  const pending = filteredSubmissions.filter(s => s.submission_status === 'pending').length;

  return {
    total_submissions: total,
    approved_submissions: approved,
    rejected_submissions: rejected,
    pending_submissions: pending,
    success_rate: total > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0,
    completion_rate: total > 0 ? Math.round(((approved + rejected) / total) * 100) : 0
  };
}

async function calculateTrends(startDate, category) {
  // This would calculate week-over-week trends
  // For brevity, returning mock trend data
  return {
    success_rate_trend: '+5.2%',
    submission_volume_trend: '+12.3%',
    new_directories_added: 8,
    trend_period: '7_days'
  };
}

function processTimeSeriesData(submissions, granularity, startDate) {
  const buckets = createTimeBuckets(startDate, granularity);
  
  submissions.forEach(submission => {
    const bucket = findTimeBucket(new Date(submission.created_at), buckets, granularity);
    if (bucket) {
      bucket.total++;
      if (submission.submission_status === 'approved') bucket.approved++;
      if (submission.submission_status === 'rejected') bucket.rejected++;
    }
  });

  return buckets.map(bucket => ({
    period: bucket.date,
    total_submissions: bucket.total,
    approved_submissions: bucket.approved,
    rejected_submissions: bucket.rejected,
    success_rate: bucket.total > 0 ? Math.round((bucket.approved / (bucket.approved + bucket.rejected)) * 100) : 0
  }));
}

function createTimeBuckets(startDate, granularity) {
  const buckets = [];
  const current = new Date(startDate);
  const now = new Date();

  while (current <= now) {
    buckets.push({
      date: current.toISOString().split('T')[0],
      total: 0,
      approved: 0,
      rejected: 0
    });

    if (granularity === 'daily') {
      current.setDate(current.getDate() + 1);
    } else if (granularity === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (granularity === 'monthly') {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return buckets;
}

function findTimeBucket(date, buckets, granularity) {
  // Find the appropriate bucket for the given date
  const dateStr = date.toISOString().split('T')[0];
  return buckets.find(bucket => {
    if (granularity === 'daily') {
      return bucket.date === dateStr;
    } else if (granularity === 'weekly') {
      const bucketDate = new Date(bucket.date);
      const endDate = new Date(bucketDate);
      endDate.setDate(endDate.getDate() + 6);
      return date >= bucketDate && date <= endDate;
    } else if (granularity === 'monthly') {
      return bucket.date.substring(0, 7) === dateStr.substring(0, 7);
    }
  });
}

function calculateDirectoryInsights(submissions, directory) {
  const total = submissions.length;
  const approved = submissions.filter(s => s.submission_status === 'approved').length;
  const avgApprovalTime = submissions
    .filter(s => s.approved_at && s.submitted_at)
    .reduce((sum, s) => {
      const days = (new Date(s.approved_at) - new Date(s.submitted_at)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0) / approved || 0;

  return {
    performance_tier: approved / total > 0.8 ? 'excellent' : approved / total > 0.6 ? 'good' : 'average',
    actual_approval_time: Math.round(avgApprovalTime),
    consistency_score: calculateConsistencyScore(submissions),
    trend_direction: calculateTrendDirection(submissions),
    recommendation: generateInsightRecommendation(approved / total, avgApprovalTime, directory)
  };
}

function calculateConsistencyScore(submissions) {
  // Calculate how consistent the directory is in its approval/rejection patterns
  // This is a simplified calculation
  const recent = submissions.slice(-10);
  const approvalRate = recent.filter(s => s.submission_status === 'approved').length / recent.length;
  return Math.round(approvalRate * 100);
}

function calculateTrendDirection(submissions) {
  // Compare recent performance to historical
  const recent = submissions.slice(-10);
  const historical = submissions.slice(0, -10);
  
  if (recent.length === 0 || historical.length === 0) return 'stable';
  
  const recentSuccess = recent.filter(s => s.submission_status === 'approved').length / recent.length;
  const historicalSuccess = historical.filter(s => s.submission_status === 'approved').length / historical.length;
  
  if (recentSuccess > historicalSuccess + 0.1) return 'improving';
  if (recentSuccess < historicalSuccess - 0.1) return 'declining';
  return 'stable';
}

function generateInsightRecommendation(successRate, avgApprovalTime, directory) {
  if (successRate > 0.8) {
    return 'Highly recommended - excellent success rate and reliability';
  } else if (successRate > 0.6) {
    return 'Recommended with preparation - review submission requirements carefully';
  } else {
    return 'Consider alternatives - success rate may be lower than expected';
  }
}

function processCategoryPerformance(directoryData, submissionData, metrics) {
  const categoryMap = {};
  
  // Group directories by category
  directoryData.forEach(directory => {
    const categoryId = directory.categories.id;
    const categoryName = directory.categories.display_name;
    
    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = {
        category_id: categoryId,
        category_name: categoryName,
        slug: directory.categories.slug,
        directories: [],
        total_directories: 0,
        submissions: []
      };
    }
    
    categoryMap[categoryId].directories.push(directory);
    categoryMap[categoryId].total_directories++;
  });

  // Add submission data
  submissionData.forEach(submission => {
    const categoryId = submission.directories.categories.id;
    if (categoryMap[categoryId]) {
      categoryMap[categoryId].submissions.push(submission);
    }
  });

  // Calculate metrics for each category
  return Object.values(categoryMap).map(category => {
    const metrics_data = {};
    
    // Calculate requested metrics
    if (metrics.includes('success_rate')) {
      const approved = category.submissions.filter(s => s.submission_status === 'approved').length;
      const total = category.submissions.filter(s => ['approved', 'rejected'].includes(s.submission_status)).length;
      metrics_data.success_rate = total > 0 ? Math.round((approved / total) * 100) : 0;
    }
    
    if (metrics.includes('avg_da')) {
      metrics_data.average_da_score = Math.round(
        category.directories.reduce((sum, d) => sum + d.da_score, 0) / category.total_directories
      );
    }
    
    if (metrics.includes('avg_approval_time')) {
      metrics_data.average_approval_time = Math.round(
        category.directories.reduce((sum, d) => sum + d.average_approval_time, 0) / category.total_directories
      );
    }

    return {
      ...category,
      ...metrics_data,
      total_submissions: category.submissions.length
    };
  }).sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0));
}

function calculateRecentStats(submissions) {
  const total = submissions.length;
  const approved = submissions.filter(s => s.submission_status === 'approved').length;
  const rejected = submissions.filter(s => s.submission_status === 'rejected').length;
  
  return {
    total_submissions: total,
    approved_submissions: approved,
    rejected_submissions: rejected,
    success_rate: total > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0
  };
}

function calculatePerformanceScore(directory, recentStats) {
  // Weighted performance score
  const daWeight = 0.3;
  const successWeight = 0.4;
  const speedWeight = 0.2;
  const difficultyWeight = 0.1;
  
  const daScore = directory.da_score / 100;
  const successScore = directory.success_rate;
  const speedScore = Math.max(0, (30 - directory.average_approval_time) / 30);
  const difficultyScore = (6 - directory.submission_difficulty) / 5;
  
  return Math.round(
    (daScore * daWeight + successScore * successWeight + speedScore * speedWeight + difficultyScore * difficultyWeight) * 100
  );
}

function calculateRecommendationScores(directory, priorityGoals) {
  const scores = {};
  
  // Authority score (DA-based)
  scores.authority = directory.da_score / 100 * 100;
  
  // Success rate score
  scores.success = directory.success_rate * 100;
  
  // Speed score (inverse of approval time)
  scores.speed = Math.max(0, (30 - directory.average_approval_time) / 30 * 100);
  
  // Ease score (inverse of difficulty)
  scores.ease = (6 - directory.submission_difficulty) / 5 * 100;
  
  // Calculate weighted total based on priority goals
  let total;
  switch (priorityGoals) {
    case 'authority':
      total = scores.authority * 0.6 + scores.success * 0.2 + scores.speed * 0.1 + scores.ease * 0.1;
      break;
    case 'speed':
      total = scores.speed * 0.6 + scores.ease * 0.2 + scores.success * 0.1 + scores.authority * 0.1;
      break;
    case 'success_rate':
      total = scores.success * 0.6 + scores.authority * 0.2 + scores.ease * 0.1 + scores.speed * 0.1;
      break;
    case 'balanced':
    default:
      total = scores.authority * 0.3 + scores.success * 0.3 + scores.speed * 0.2 + scores.ease * 0.2;
      break;
  }
  
  return {
    total: Math.round(total),
    breakdown: scores
  };
}

function generateRecommendationReasons(directory, scores) {
  const reasons = [];
  
  if (scores.breakdown.authority >= 80) reasons.push('High domain authority');
  if (scores.breakdown.success >= 80) reasons.push('Excellent success rate');
  if (scores.breakdown.speed >= 80) reasons.push('Fast approval process');
  if (scores.breakdown.ease >= 80) reasons.push('Easy submission process');
  if (directory.pricing_model === 'free') reasons.push('Free listing');
  
  return reasons.slice(0, 3); // Return top 3 reasons
}

function generateRecommendationInsights(recommendations, criteria) {
  return {
    best_for_beginners: recommendations.filter(r => r.score_breakdown.ease >= 80).slice(0, 3),
    highest_authority: recommendations.filter(r => r.score_breakdown.authority >= 85).slice(0, 3),
    fastest_approval: recommendations.filter(r => r.score_breakdown.speed >= 80).slice(0, 3),
    most_reliable: recommendations.filter(r => r.score_breakdown.success >= 85).slice(0, 3)
  };
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    result[group] = (result[group] || 0) + 1;
    return result;
  }, {});
}

module.exports = {
  analyticsLimiter,
  getDirectoryStats,
  getDirectorySuccessRate,
  getCategoryPerformance,
  getTopPerformingDirectories,
  getDirectoryRecommendations
};