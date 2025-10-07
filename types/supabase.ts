import type { SupabaseClient } from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export type JobStatus = 'pending' | 'in_progress' | 'complete' | 'failed'
export type JobResultStatus = 'pending' | 'submitted' | 'failed' | 'retry'

export interface JobsRow {
  id: string
  customer_id: string
  package_size: number
  priority_level: number
  status: JobStatus
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  metadata: Json | null
  business_name: string | null
  business_address: string | null
  business_city: string | null
  business_state: string | null
  business_zip: string | null
  business_phone: string | null
  business_email: string | null
  business_website: string | null
  business_description: string | null
}

export type JobsInsert = {
  id?: string
  customer_id: string
  package_size: number
  priority_level?: number
  status?: JobStatus
  created_at?: string
  updated_at?: string
  started_at?: string | null
  completed_at?: string | null
  error_message?: string | null
  metadata?: Json | null
  business_name?: string | null
  business_address?: string | null
  business_city?: string | null
  business_state?: string | null
  business_zip?: string | null
  business_phone?: string | null
  business_email?: string | null
  business_website?: string | null
  business_description?: string | null
}

export type JobsUpdate = {
  id?: string
  customer_id?: string
  package_size?: number
  priority_level?: number
  status?: JobStatus
  created_at?: string
  updated_at?: string
  started_at?: string | null
  completed_at?: string | null
  error_message?: string | null
  metadata?: Json | null
  business_name?: string | null
  business_address?: string | null
  business_city?: string | null
  business_state?: string | null
  business_zip?: string | null
  business_phone?: string | null
  business_email?: string | null
  business_website?: string | null
  business_description?: string | null
}

export interface JobResultsRow {
  id: string
  job_id: string
  directory_name: string
  status: JobResultStatus
  response_log: Json | null
  submitted_at: string | null
  retry_count: number
  updated_at: string
}

export type JobResultsInsert = {
  id?: string
  job_id: string
  directory_name: string
  status: JobResultStatus
  response_log?: Json | null
  submitted_at?: string | null
  retry_count?: number
  updated_at?: string
}

export type JobResultsUpdate = {
  id?: string
  job_id?: string
  directory_name?: string
  status?: JobResultStatus
  response_log?: Json | null
  submitted_at?: string | null
  retry_count?: number
  updated_at?: string
}

export type DirectoryBoltDatabase = {
  public: {
    Tables: {
      jobs: {
        Row: JobsRow
        Insert: JobsInsert
        Update: JobsUpdate
        Relationships: [
          {
            foreignKeyName: 'jobs_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      job_results: {
        Row: JobResultsRow
        Insert: JobResultsInsert
        Update: JobResultsUpdate
        Relationships: [
          {
            foreignKeyName: 'job_results_job_id_fkey'
            columns: ['job_id']
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type DirectoryBoltSupabaseClient = SupabaseClient<DirectoryBoltDatabase, 'public', any, any, any>



