// 🔒 JORDAN'S DATABASE SCHEMA - Enterprise-grade data architecture
// Designed for 1000+ users with scalable relationships and proper indexing

export interface User {
  id: string // UUID primary key
  email: string // Unique, indexed
  password_hash: string // bcrypt hashed
  full_name: string
  company_name?: string
  subscription_tier: 'free' | 'pro' | 'enterprise'
  credits_remaining: number
  is_verified: boolean
  created_at: Date
  updated_at: Date
  last_login_at?: Date
  
  // Security & Rate Limiting
  failed_login_attempts: number
  locked_until?: Date
  password_reset_token?: string
  password_reset_expires?: Date
  verification_token?: string
  
  // Billing & Payments
  stripe_customer_id?: string
  subscription_id?: string
  subscription_status?: 'active' | 'cancelled' | 'past_due'
  trial_ends_at?: Date
}

export interface Directory {
  id: string // UUID primary key
  name: string
  url: string // Unique, indexed
  category: DirectoryCategory
  authority_score: number // 0-100, calculated metric
  submission_fee?: number // In cents
  turnaround_time_days: number
  
  // Metadata for scraping & automation
  submission_url?: string
  contact_email?: string
  submission_guidelines?: string
  
  // Quality metrics
  is_active: boolean
  last_checked_at: Date
  response_rate: number // % of successful submissions
  avg_approval_time: number // In hours
  
  // SEO & Discovery
  domain_authority: number
  monthly_traffic?: number
  language: string // ISO code
  country_code: string // ISO code
  
  created_at: Date
  updated_at: Date
}

export interface Submission {
  id: string // UUID primary key
  user_id: string // Foreign key to User
  directory_id: string // Foreign key to Directory
  
  // Business Information
  business_name: string
  business_description: string
  business_url: string
  business_email: string
  business_phone?: string
  business_address?: string
  business_category: string
  
  // Submission tracking
  status: SubmissionStatus
  submitted_at: Date
  approved_at?: Date
  rejected_at?: Date
  rejection_reason?: string
  
  // Automation & Processing
  auto_submitted: boolean
  submission_method: 'manual' | 'automated' | 'api'
  external_submission_id?: string
  
  // Payment & Credits
  credits_used: number
  payment_amount?: number // In cents
  payment_id?: string // Stripe payment intent ID
  
  created_at: Date
  updated_at: Date
}

export interface ScrapingJob {
  id: string // UUID primary key
  type: 'directory_discovery' | 'contact_extraction' | 'submission_verification'
  target_url: string
  payload: Record<string, any> // JSON data for the job
  
  // Job Status & Processing
  status: JobStatus
  priority: 1 | 2 | 3 | 4 | 5 // 1 = highest priority
  attempts: number
  max_attempts: number
  
  // Scheduling
  scheduled_for: Date
  started_at?: Date
  completed_at?: Date
  failed_at?: Date
  
  // Results & Errors
  result?: Record<string, any>
  error_message?: string
  error_stack?: string
  
  // Rate limiting & throttling
  rate_limit_key: string
  delay_until?: Date
  
  created_at: Date
  updated_at: Date
}

export interface Payment {
  id: string // UUID primary key
  user_id: string // Foreign key to User
  
  // Stripe Integration
  stripe_payment_intent_id: string
  stripe_charge_id?: string
  
  // Payment Details
  amount: number // In cents
  currency: string // ISO currency code
  status: PaymentStatus
  description: string
  
  // Associated Records
  submission_ids?: string[] // Array of submission IDs this payment covers
  credits_purchased?: number
  
  // Metadata
  payment_method_type: string // card, bank_transfer, etc.
  receipt_url?: string
  invoice_id?: string
  
  created_at: Date
  updated_at: Date
}

export interface ApiKey {
  id: string // UUID primary key
  user_id: string // Foreign key to User
  key_hash: string // SHA-256 hashed API key
  name: string // User-friendly name for the key
  
  // Permissions & Scoping
  permissions: ApiPermission[]
  is_active: boolean
  
  // Rate Limiting
  rate_limit_per_hour: number
  requests_made_today: number
  
  // Security
  last_used_at?: Date
  created_from_ip: string
  
  created_at: Date
  expires_at?: Date
}

export interface AuditLog {
  id: string // UUID primary key
  user_id?: string // Foreign key to User (nullable for system events)
  entity_type: string // 'user', 'submission', 'directory', etc.
  entity_id: string
  action: string // 'create', 'update', 'delete', 'login', etc.
  
  // Change Tracking
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  
  // Context
  ip_address: string
  user_agent?: string
  api_key_id?: string
  
  created_at: Date
}

// Enums for type safety
export type DirectoryCategory = 
  | 'business_general'
  | 'local_business'
  | 'tech_startups'
  | 'ecommerce'
  | 'saas'
  | 'healthcare'
  | 'education'
  | 'non_profit'
  | 'real_estate'
  | 'professional_services'
  | 'retail'
  | 'restaurants'
  | 'automotive'
  | 'finance'
  | 'legal'

export type SubmissionStatus = 
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'failed'
  | 'cancelled'

export type JobStatus = 
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export type ApiPermission = 
  | 'read_directories'
  | 'create_submissions'
  | 'read_submissions'
  | 'read_profile'
  | 'admin_access'

// Database Indexes for Performance
export const DATABASE_INDEXES = {
  users: [
    { fields: ['email'], unique: true },
    { fields: ['stripe_customer_id'] },
    { fields: ['created_at'] },
    { fields: ['subscription_tier', 'is_verified'] }
  ],
  directories: [
    { fields: ['url'], unique: true },
    { fields: ['category', 'is_active'] },
    { fields: ['authority_score'] },
    { fields: ['country_code', 'language'] }
  ],
  submissions: [
    { fields: ['user_id', 'created_at'] },
    { fields: ['directory_id', 'status'] },
    { fields: ['status', 'submitted_at'] },
    { fields: ['business_url'] }
  ],
  scraping_jobs: [
    { fields: ['status', 'priority', 'scheduled_for'] },
    { fields: ['rate_limit_key', 'scheduled_for'] },
    { fields: ['type', 'status'] }
  ],
  payments: [
    { fields: ['user_id', 'created_at'] },
    { fields: ['stripe_payment_intent_id'], unique: true },
    { fields: ['status'] }
  ]
} as const

// Validation Schemas for Data Integrity
export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  }
} as const