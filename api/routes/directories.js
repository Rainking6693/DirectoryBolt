// DirectoryBolt API - Directories Management Endpoints
// Comprehensive directory management with filtering, search, and bulk operations

const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const directoryApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

const bulkOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit bulk operations
  message: {
    error: 'Too many bulk operations, please try again later.',
    code: 'BULK_RATE_LIMIT_EXCEEDED'
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

// Utility function to calculate priority score
function calculatePriorityScore(directory) {
  let score = 0;
  
  // DA Score weight (40%)
  score += (directory.da_score / 100) * 40;
  
  // Success Rate weight (30%)
  score += directory.success_rate * 30;
  
  // Category relevance weight (20%) - simplified for now
  score += 20; // This would be dynamic based on user preferences
  
  // Submission difficulty (10% - inverse)
  score += ((6 - directory.submission_difficulty) / 5) * 10;
  
  return Math.round(score);
}

// Utility function to build query filters
function buildDirectoryQuery(baseQuery, filters) {
  let query = baseQuery;

  if (filters.category) {
    query = query.eq('category_id', filters.category);
  }

  if (filters.da_min) {
    query = query.gte('da_score', parseInt(filters.da_min));
  }

  if (filters.da_max) {
    query = query.lte('da_score', parseInt(filters.da_max));
  }

  if (filters.success_rate_min) {
    query = query.gte('success_rate', parseFloat(filters.success_rate_min));
  }

  if (filters.difficulty) {
    const difficultyMap = {
      'easy': [1, 2],
      'medium': [3],
      'hard': [4, 5]
    };
    if (difficultyMap[filters.difficulty]) {
      query = query.in('submission_difficulty', difficultyMap[filters.difficulty]);
    }
  }

  if (filters.pricing_model) {
    query = query.eq('pricing_model', filters.pricing_model);
  }

  if (filters.priority_tier) {
    query = query.eq('priority_tier', filters.priority_tier);
  }

  if (filters.business_type) {
    query = query.contains('business_types', [filters.business_type]);
  }

  if (filters.features && Array.isArray(filters.features)) {
    query = query.overlaps('features', filters.features);
  }

  // Always filter for active directories unless explicitly requested
  if (filters.include_inactive !== 'true') {
    query = query.eq('is_active', true);
  }

  return query;
}

// GET /api/directories - List all directories with filtering
async function getDirectories(req, res) {
  try {
    const {
      limit = 50,
      offset = 0,
      category,
      da_min,
      da_max,
      success_rate_min,
      difficulty,
      pricing_model,
      priority_tier,
      business_type,
      features,
      sort_by = 'da_score',
      sort_order = 'desc',
      search,
      include_inactive
    } = req.query;

    // Validate limit
    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);

    // Base query with category join
    let query = supabase
      .from('directories')
      .select(`
        *,
        categories!inner(
          id,
          slug,
          display_name,
          icon
        )
      `);

    // Apply filters
    query = buildDirectoryQuery(query, req.query);

    // Apply text search if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    const sortColumn = ['da_score', 'success_rate', 'average_approval_time', 'created_at', 'name'].includes(sort_by) 
      ? sort_by 
      : 'da_score';
    const sortDirection = sort_order === 'asc';
    
    query = query.order(sortColumn, { ascending: sortDirection });

    // Apply pagination
    query = query.range(parsedOffset, parsedOffset + parsedLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch directories',
        code: 'DATABASE_ERROR'
      });
    }

    // Calculate priority scores for each directory
    const enrichedData = data.map(directory => ({
      ...directory,
      priority_score: calculatePriorityScore(directory),
      submission_url: directory.website + '/submit', // Construct submission URL
      estimated_approval_time: directory.average_approval_time
    }));

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('directories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', include_inactive === 'true' ? undefined : true);

    res.json({
      success: true,
      data: enrichedData,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total: totalCount,
        has_more: parsedOffset + parsedLimit < totalCount
      },
      filters_applied: {
        category,
        da_min,
        da_max,
        success_rate_min,
        difficulty,
        pricing_model,
        priority_tier,
        business_type,
        search
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

// GET /api/directories/:id - Get specific directory
async function getDirectoryById(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('directories')
      .select(`
        *,
        categories!inner(
          id,
          slug,
          display_name,
          description,
          icon
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Directory not found',
          code: 'DIRECTORY_NOT_FOUND'
        });
      }
      
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch directory',
        code: 'DATABASE_ERROR'
      });
    }

    // Enrich with calculated data
    const enrichedDirectory = {
      ...data,
      priority_score: calculatePriorityScore(data),
      submission_url: data.website + '/submit',
      estimated_approval_time: data.average_approval_time
    };

    res.json({
      success: true,
      data: enrichedDirectory
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

// GET /api/directories/categories - List all categories
async function getCategories(req, res) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        directories:directories(count)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
        code: 'DATABASE_ERROR'
      });
    }

    // Get directory counts per category
    const enrichedCategories = await Promise.all(
      data.map(async (category) => {
        const { count } = await supabase
          .from('directories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('is_active', true);

        return {
          ...category,
          directory_count: count,
          directories: undefined // Remove the nested count object
        };
      })
    );

    res.json({
      success: true,
      data: enrichedCategories
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

// GET /api/directories/search - Search directories
async function searchDirectories(req, res) {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_SEARCH_QUERY'
      });
    }

    const searchTerm = q.trim();
    const parsedLimit = Math.min(parseInt(limit), 50);

    const { data, error } = await supabase
      .from('directories')
      .select(`
        id,
        name,
        website,
        description,
        da_score,
        success_rate,
        priority_tier,
        categories!inner(
          slug,
          display_name,
          icon
        )
      `)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('da_score', { ascending: false })
      .limit(parsedLimit);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Search failed',
        code: 'SEARCH_ERROR'
      });
    }

    const enrichedResults = data.map(directory => ({
      ...directory,
      priority_score: calculatePriorityScore(directory)
    }));

    res.json({
      success: true,
      data: enrichedResults,
      query: searchTerm,
      total_results: data.length
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

// GET /api/directories/recommend - Get recommended directories
async function getRecommendedDirectories(req, res) {
  try {
    const {
      business_type,
      location,
      budget = 'free',
      priority = 'balanced',
      limit = 10
    } = req.query;

    const parsedLimit = Math.min(parseInt(limit), 25);
    
    let query = supabase
      .from('directories')
      .select(`
        *,
        categories!inner(
          slug,
          display_name,
          icon
        )
      `)
      .eq('is_active', true);

    // Filter by business type if provided
    if (business_type) {
      query = query.contains('business_types', [business_type]);
    }

    // Filter by budget/pricing model
    if (budget === 'free') {
      query = query.eq('pricing_model', 'free');
    } else if (budget === 'paid') {
      query = query.in('pricing_model', ['paid', 'freemium']);
    }

    // Apply priority-based sorting
    let orderColumn = 'da_score';
    if (priority === 'high_authority') {
      orderColumn = 'da_score';
    } else if (priority === 'high_success') {
      orderColumn = 'success_rate';
    } else if (priority === 'fast_approval') {
      orderColumn = 'average_approval_time';
      query = query.order(orderColumn, { ascending: true }); // Faster is better
    }

    if (priority !== 'fast_approval') {
      query = query.order(orderColumn, { ascending: false });
    }

    query = query.limit(parsedLimit);

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get recommendations',
        code: 'DATABASE_ERROR'
      });
    }

    // Calculate and sort by priority score for balanced recommendations
    let recommendations = data.map(directory => ({
      ...directory,
      priority_score: calculatePriorityScore(directory),
      recommendation_reason: getRecommendationReason(directory, { business_type, priority, budget })
    }));

    if (priority === 'balanced') {
      recommendations = recommendations
        .sort((a, b) => b.priority_score - a.priority_score)
        .slice(0, parsedLimit);
    }

    res.json({
      success: true,
      data: recommendations,
      recommendation_criteria: {
        business_type,
        location,
        budget,
        priority,
        algorithm_version: '1.0'
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

// GET /api/directories/popular - Get most successful directories
async function getPopularDirectories(req, res) {
  try {
    const { limit = 10, category } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 25);

    let query = supabase
      .from('directories')
      .select(`
        *,
        categories!inner(
          slug,
          display_name,
          icon
        )
      `)
      .eq('is_active', true)
      .gte('success_rate', 0.7)
      .gte('da_score', 60);

    if (category) {
      query = query.eq('categories.slug', category);
    }

    query = query
      .order('success_rate', { ascending: false })
      .order('da_score', { ascending: false })
      .limit(parsedLimit);

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch popular directories',
        code: 'DATABASE_ERROR'
      });
    }

    const popularDirectories = data.map(directory => ({
      ...directory,
      priority_score: calculatePriorityScore(directory),
      popularity_rank: calculatePopularityRank(directory)
    }));

    res.json({
      success: true,
      data: popularDirectories,
      criteria: {
        min_success_rate: 0.7,
        min_da_score: 60,
        category: category || 'all'
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
function getRecommendationReason(directory, criteria) {
  const reasons = [];
  
  if (directory.da_score >= 80) reasons.push('High Domain Authority');
  if (directory.success_rate >= 0.85) reasons.push('High Success Rate');
  if (directory.average_approval_time <= 3) reasons.push('Fast Approval');
  if (directory.pricing_model === 'free' && criteria.budget === 'free') reasons.push('Free Listing');
  if (directory.submission_difficulty <= 2) reasons.push('Easy Submission');
  
  return reasons.join(', ') || 'Good Overall Performance';
}

function calculatePopularityRank(directory) {
  // Weighted scoring for popularity
  return Math.round(
    (directory.success_rate * 40) +
    (directory.da_score / 100 * 35) +
    ((6 - directory.submission_difficulty) / 5 * 15) +
    ((30 - directory.average_approval_time) / 30 * 10)
  );
}

// Export route handlers
module.exports = {
  // Apply rate limiting middleware
  directoryApiLimiter,
  bulkOperationLimiter,
  
  // Route handlers
  getDirectories,
  getDirectoryById,
  getCategories,
  searchDirectories,
  getRecommendedDirectories,
  getPopularDirectories,
  
  // Utility functions
  calculatePriorityScore,
  buildDirectoryQuery
};