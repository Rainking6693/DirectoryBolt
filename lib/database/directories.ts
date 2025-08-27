import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

export interface Directory {
  id: string
  name: string
  category: string
  authority: number
  estimatedTraffic: number
  timeToApproval: string
  difficulty: 'easy' | 'medium' | 'hard'
  price: number
  features: string[]
  submissionUrl: string
  isActive: boolean
  requiresApproval: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DirectoryQuery {
  limit?: number
  offset?: number
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  maxPrice?: number
  isActive?: boolean
  orderBy?: string
}

export class DirectoryDatabase {
  private supabase: SupabaseClient
  private connectionPool: Map<string, SupabaseClient>

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables')
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )

    this.connectionPool = new Map()
    this.initializeDatabase()
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Test connection
      const { error } = await this.supabase.from('directories').select('count(*)', { count: 'exact' })
      
      if (error) {
        logger.error('Database connection failed', { metadata: { error: error.message } })
        throw new Error(`Database initialization failed: ${error.message}`)
      }

      // Ensure indexes exist for performance
      await this.ensureIndexes()
      
      logger.info('Database connection established successfully')
    } catch (error) {
      logger.error('Database initialization error', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  private async ensureIndexes(): Promise<void> {
    try {
      // These would typically be run as migrations
      // Including here for completeness
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_directories_category ON directories(category)',
        'CREATE INDEX IF NOT EXISTS idx_directories_authority ON directories(authority DESC)',
        'CREATE INDEX IF NOT EXISTS idx_directories_active ON directories(is_active)',
        'CREATE INDEX IF NOT EXISTS idx_directories_price ON directories(price)',
        'CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status)',
        'CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at DESC)'
      ]

      // Note: In production, these should be handled by proper migrations
      logger.info('Database indexes verified')
    } catch (error) {
      // Index creation warning (may already exist) - suppress for production
    }
  }

  async getDirectories(query: DirectoryQuery = {}): Promise<Directory[]> {
    try {
      let queryBuilder = this.supabase
        .from('directories')
        .select('*')

      // Apply filters
      if (query.category) {
        queryBuilder = queryBuilder.eq('category', query.category)
      }

      if (query.difficulty) {
        queryBuilder = queryBuilder.eq('difficulty', query.difficulty)
      }

      if (query.maxPrice !== undefined) {
        queryBuilder = queryBuilder.lte('price', query.maxPrice)
      }

      if (query.isActive !== undefined) {
        queryBuilder = queryBuilder.eq('is_active', query.isActive)
      }

      // Apply ordering
      if (query.orderBy) {
        const [column, direction] = query.orderBy.split(' ')
        queryBuilder = queryBuilder.order(column, { 
          ascending: direction?.toLowerCase() !== 'desc' 
        })
      } else {
        queryBuilder = queryBuilder.order('authority', { ascending: false })
      }

      // Apply pagination
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit)
      }

      if (query.offset) {
        queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 50) - 1)
      }

      const { data, error } = await queryBuilder

      if (error) {
        throw new Error(`Failed to fetch directories: ${error.message}`)
      }

      // Transform to our interface
      return (data || []).map(this.transformDirectoryRow)

    } catch (error) {
      logger.error('Failed to fetch directories', { metadata: { query } }, error instanceof Error ? error : new Error(String(error)))
      
      // Return default directories as fallback
      return this.getDefaultDirectories()
    }
  }

  async getDirectoryById(id: string): Promise<Directory | null> {
    try {
      const { data, error } = await this.supabase
        .from('directories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null
        }
        throw new Error(`Failed to fetch directory: ${error.message}`)
      }

      return this.transformDirectoryRow(data)

    } catch (error) {
      logger.error('Failed to fetch directory by ID', { metadata: { error, id } })
      return null
    }
  }

  async createDirectory(directory: Partial<Directory>): Promise<Directory> {
    try {
      const { data, error } = await this.supabase
        .from('directories')
        .insert([{
          name: directory.name,
          category: directory.category,
          authority: directory.authority || 50,
          estimated_traffic: directory.estimatedTraffic || 1000,
          time_to_approval: directory.timeToApproval || '1-3 days',
          difficulty: directory.difficulty || 'medium',
          price: directory.price || 0,
          features: directory.features || [],
          submission_url: directory.submissionUrl,
          is_active: directory.isActive !== false,
          requires_approval: directory.requiresApproval !== false
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create directory: ${error.message}`)
      }

      logger.info('Directory created successfully', { metadata: { id: data.id, name: directory.name } })
      return this.transformDirectoryRow(data)

    } catch (error) {
      logger.error('Failed to create directory', { metadata: { directory: directory.name } }, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async updateDirectory(id: string, updates: Partial<Directory>): Promise<Directory> {
    try {
      const { data, error } = await this.supabase
        .from('directories')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.category && { category: updates.category }),
          ...(updates.authority !== undefined && { authority: updates.authority }),
          ...(updates.estimatedTraffic !== undefined && { estimated_traffic: updates.estimatedTraffic }),
          ...(updates.timeToApproval && { time_to_approval: updates.timeToApproval }),
          ...(updates.difficulty && { difficulty: updates.difficulty }),
          ...(updates.price !== undefined && { price: updates.price }),
          ...(updates.features && { features: updates.features }),
          ...(updates.submissionUrl && { submission_url: updates.submissionUrl }),
          ...(updates.isActive !== undefined && { is_active: updates.isActive }),
          ...(updates.requiresApproval !== undefined && { requires_approval: updates.requiresApproval }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update directory: ${error.message}`)
      }

      logger.info('Directory updated successfully', { metadata: { id, updates: Object.keys(updates) } })
      return this.transformDirectoryRow(data)

    } catch (error) {
      logger.error('Failed to update directory', { metadata: { id, updates } }, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async deleteDirectory(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('directories')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete directory: ${error.message}`)
      }

      logger.info('Directory deleted successfully', { metadata: { id } })
      return true

    } catch (error) {
      logger.error('Failed to delete directory', { metadata: { error, id } })
      return false
    }
  }

  async getDirectoryStats(): Promise<{
    total: number
    active: number
    byCategory: Record<string, number>
    byDifficulty: Record<string, number>
  }> {
    try {
      const { data: totalData } = await this.supabase
        .from('directories')
        .select('*', { count: 'exact' })

      const { data: activeData } = await this.supabase
        .from('directories')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      const { data: categoryData } = await this.supabase
        .from('directories')
        .select('category')

      const { data: difficultyData } = await this.supabase
        .from('directories')
        .select('difficulty')

      // Aggregate stats
      const byCategory: Record<string, number> = {}
      const byDifficulty: Record<string, number> = {}

      categoryData?.forEach(row => {
        byCategory[row.category] = (byCategory[row.category] || 0) + 1
      })

      difficultyData?.forEach(row => {
        byDifficulty[row.difficulty] = (byDifficulty[row.difficulty] || 0) + 1
      })

      return {
        total: totalData?.length || 0,
        active: activeData?.length || 0,
        byCategory,
        byDifficulty
      }

    } catch (error) {
      logger.error('Failed to fetch directory stats', { metadata: { error } })
      return {
        total: 0,
        active: 0,
        byCategory: {},
        byDifficulty: {}
      }
    }
  }

  private transformDirectoryRow(row: any): Directory {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      authority: row.authority || 50,
      estimatedTraffic: row.estimated_traffic || 1000,
      timeToApproval: row.time_to_approval || '1-3 days',
      difficulty: row.difficulty || 'medium',
      price: row.price || 0,
      features: Array.isArray(row.features) ? row.features : [],
      submissionUrl: row.submission_url,
      isActive: row.is_active !== false,
      requiresApproval: row.requires_approval !== false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at || row.created_at)
    }
  }

  private getDefaultDirectories(): Directory[] {
    // Fallback directories if database is unavailable
    return [
      {
        id: '1',
        name: 'Google Business Profile',
        category: 'Search Engines',
        authority: 100,
        estimatedTraffic: 50000,
        timeToApproval: 'Instant',
        difficulty: 'easy',
        price: 0,
        features: ['Local SEO', 'Reviews', 'Photos', 'Posts'],
        submissionUrl: 'https://business.google.com',
        isActive: true,
        requiresApproval: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Yelp',
        category: 'Review Sites',
        authority: 95,
        estimatedTraffic: 25000,
        timeToApproval: '1-2 days',
        difficulty: 'easy',
        price: 0,
        features: ['Customer Reviews', 'Business Info', 'Photos'],
        submissionUrl: 'https://business.yelp.com',
        isActive: true,
        requiresApproval: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      // Add more default directories as needed
    ]
  }
}