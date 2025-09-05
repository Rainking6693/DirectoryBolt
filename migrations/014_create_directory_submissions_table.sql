-- Migration: Create Directory Submissions Table
-- Purpose: Detailed tracking of directory submissions with performance metrics and proof storage
-- Date: 2025-09-05
-- Phase: 2.1 Database Schema Enhancement

-- Create directory_submissions table for detailed submission tracking
CREATE TABLE IF NOT EXISTS directory_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core References
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    directory_id UUID NOT NULL REFERENCES directories(id) ON DELETE CASCADE,
    submission_queue_id UUID REFERENCES submission_queue(id) ON DELETE SET NULL,
    
    -- Submission Identification
    external_submission_id VARCHAR(255), -- ID from the directory's system
    internal_reference_id VARCHAR(100), -- Our internal tracking reference
    submission_url VARCHAR(500), -- URL of the submitted listing
    
    -- Submission Status Tracking
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',          -- Queued for submission
            'submitting',       -- Currently being submitted
            'submitted',        -- Successfully submitted, awaiting review
            'under_review',     -- Directory is reviewing
            'approved',         -- Approved and live
            'rejected',         -- Rejected by directory
            'revision_needed',  -- Needs changes
            'expired',          -- Listing expired
            'removed',          -- Removed from directory
            'failed',           -- Technical failure
            'cancelled'         -- Cancelled by user
        )
    ),
    
    -- Timestamps for Status Tracking
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    live_at TIMESTAMP WITH TIME ZONE, -- When listing went live
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Rejection & Revision Details
    rejection_reason TEXT,
    rejection_category VARCHAR(100), -- Category of rejection (content, formatting, requirements, etc.)
    revision_notes TEXT,
    revision_count INTEGER DEFAULT 0,
    
    -- Performance Metrics
    submission_attempt_count INTEGER DEFAULT 0,
    processing_time_seconds INTEGER, -- Time taken to submit
    approval_time_hours INTEGER, -- Time from submission to approval
    click_through_rate DECIMAL(5,4), -- CTR if available from directory
    impressions_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    
    -- SEO & Ranking Metrics
    listing_ranking_position INTEGER, -- Position in directory category
    search_visibility_score INTEGER, -- 1-100 visibility score
    backlink_created BOOLEAN DEFAULT false,
    domain_authority_impact DECIMAL(4,2), -- Impact on DA (if measurable)
    
    -- Quality Assurance
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10), -- Our quality rating
    directory_rating INTEGER CHECK (directory_rating >= 1 AND directory_rating <= 5), -- Directory's rating system
    compliance_status VARCHAR(30) CHECK (
        compliance_status IN ('compliant', 'non_compliant', 'pending_review', 'not_applicable')
    ) DEFAULT 'pending_review',
    
    -- Proof & Evidence Storage
    screenshot_urls JSONB DEFAULT '[]', -- Screenshots of submission process and final listing
    confirmation_email_url VARCHAR(500), -- Link to confirmation email
    submission_receipt_url VARCHAR(500), -- Receipt or confirmation document
    listing_proof_urls JSONB DEFAULT '[]', -- Proof that listing is live
    
    -- Directory-Specific Data
    listing_data JSONB DEFAULT '{}', -- Complete listing information as submitted
    directory_response_data JSONB DEFAULT '{}', -- Response/feedback from directory
    form_fields_submitted JSONB DEFAULT '{}', -- Form fields that were filled
    additional_requirements_met JSONB DEFAULT '[]', -- Special requirements fulfilled
    
    -- Business Information Snapshot (at time of submission)
    business_name_submitted VARCHAR(255),
    business_description_submitted TEXT,
    business_url_submitted VARCHAR(500),
    business_category_submitted VARCHAR(100),
    business_location_submitted VARCHAR(255),
    
    -- Automation & Process Details
    automation_method VARCHAR(50) DEFAULT 'chrome_extension' CHECK (
        automation_method IN ('chrome_extension', 'api', 'manual', 'headless_browser', 'rpa_tool')
    ),
    automation_success_rate DECIMAL(5,2), -- Success rate for this specific combination
    manual_intervention_required BOOLEAN DEFAULT false,
    manual_intervention_reasons JSONB DEFAULT '[]', -- Array of reasons manual intervention was needed
    
    -- Cost & Billing
    submission_cost_cents INTEGER DEFAULT 0, -- Cost to submit (for paid directories)
    credits_consumed INTEGER DEFAULT 1, -- Credits used from customer account
    billing_reference VARCHAR(255), -- Reference for billing purposes
    
    -- Follow-up & Maintenance
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_scheduled_at TIMESTAMP WITH TIME ZONE,
    follow_up_completed_at TIMESTAMP WITH TIME ZONE,
    maintenance_required BOOLEAN DEFAULT false,
    next_maintenance_at TIMESTAMP WITH TIME ZONE,
    
    -- Communication Log
    customer_notifications_sent INTEGER DEFAULT 0,
    last_customer_notification_at TIMESTAMP WITH TIME ZONE,
    directory_communications JSONB DEFAULT '[]', -- Log of communications with directory
    
    -- Performance Insights
    traffic_generated_estimate INTEGER DEFAULT 0, -- Estimated traffic from this listing
    leads_generated_estimate INTEGER DEFAULT 0, -- Estimated leads
    conversion_tracking_url VARCHAR(500), -- UTM or tracking URL
    
    -- Error Handling
    error_log JSONB DEFAULT '[]', -- Array of errors encountered
    retry_attempts INTEGER DEFAULT 0,
    max_retry_attempts INTEGER DEFAULT 3,
    last_error_message TEXT,
    last_error_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Audit & Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata for extensibility
    metadata JSONB DEFAULT '{}'
);

-- Create strategic indexes for submission tracking and analytics
CREATE INDEX IF NOT EXISTS idx_directory_submissions_customer_id ON directory_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_directory_id ON directory_submissions(directory_id);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_submission_queue_id ON directory_submissions(submission_queue_id);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_status ON directory_submissions(status);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_external_id ON directory_submissions(external_submission_id) WHERE external_submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_internal_ref ON directory_submissions(internal_reference_id) WHERE internal_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_submission_url ON directory_submissions(submission_url) WHERE submission_url IS NOT NULL;

-- Timestamp-based indexes for analytics
CREATE INDEX IF NOT EXISTS idx_directory_submissions_submitted_at ON directory_submissions(submitted_at) WHERE submitted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_approved_at ON directory_submissions(approved_at) WHERE approved_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_live_at ON directory_submissions(live_at) WHERE live_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_expires_at ON directory_submissions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_created_at ON directory_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_last_checked ON directory_submissions(last_checked_at);

-- Performance and quality indexes
CREATE INDEX IF NOT EXISTS idx_directory_submissions_quality_score ON directory_submissions(quality_score) WHERE quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_directory_rating ON directory_submissions(directory_rating) WHERE directory_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_compliance ON directory_submissions(compliance_status);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_automation_method ON directory_submissions(automation_method);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_directory_submissions_customer_status ON directory_submissions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_directory_status ON directory_submissions(directory_id, status);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_status_submitted ON directory_submissions(status, submitted_at) WHERE submitted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_customer_directory ON directory_submissions(customer_id, directory_id);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_follow_up ON directory_submissions(follow_up_required, follow_up_scheduled_at) WHERE follow_up_required = true;
CREATE INDEX IF NOT EXISTS idx_directory_submissions_maintenance ON directory_submissions(maintenance_required, next_maintenance_at) WHERE maintenance_required = true;

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_directory_submissions_performance ON directory_submissions(directory_id, status, approved_at) WHERE status IN ('approved', 'live');
CREATE INDEX IF NOT EXISTS idx_directory_submissions_success_rate ON directory_submissions(directory_id, automation_method, status);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_billing ON directory_submissions(customer_id, created_at, credits_consumed);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_directory_submissions_listing_data_gin ON directory_submissions USING GIN (listing_data);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_directory_response_gin ON directory_submissions USING GIN (directory_response_data);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_screenshot_urls_gin ON directory_submissions USING GIN (screenshot_urls);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_error_log_gin ON directory_submissions USING GIN (error_log);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_metadata_gin ON directory_submissions USING GIN (metadata);

-- Create trigger for updated_at
CREATE TRIGGER update_directory_submissions_updated_at 
    BEFORE UPDATE ON directory_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically calculate performance metrics
CREATE OR REPLACE FUNCTION calculate_submission_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate approval time when approved
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        NEW.approved_at = CURRENT_TIMESTAMP;
        IF NEW.submitted_at IS NOT NULL THEN
            NEW.approval_time_hours = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - NEW.submitted_at))::INTEGER / 3600;
        END IF;
    END IF;
    
    -- Set live_at when status changes to approved or live
    IF OLD.status NOT IN ('approved', 'live') AND NEW.status IN ('approved') THEN
        NEW.live_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Set submitted_at when status changes to submitted
    IF OLD.status != 'submitted' AND NEW.status = 'submitted' THEN
        NEW.submitted_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Set rejected_at when rejected
    IF OLD.status != 'rejected' AND NEW.status = 'rejected' THEN
        NEW.rejected_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Update last_checked_at on any status change
    NEW.last_checked_at = CURRENT_TIMESTAMP;
    
    -- Generate internal reference ID if not provided
    IF NEW.internal_reference_id IS NULL AND TG_OP = 'INSERT' THEN
        NEW.internal_reference_id = 'DB-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_submission_metrics
    BEFORE INSERT OR UPDATE ON directory_submissions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_submission_metrics();

-- Create submission analytics and reporting table
CREATE TABLE IF NOT EXISTS submission_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Date and Scope
    analytics_date DATE NOT NULL,
    directory_id UUID REFERENCES directories(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Submission Metrics
    total_submissions INTEGER DEFAULT 0,
    successful_submissions INTEGER DEFAULT 0,
    failed_submissions INTEGER DEFAULT 0,
    pending_submissions INTEGER DEFAULT 0,
    approved_submissions INTEGER DEFAULT 0,
    rejected_submissions INTEGER DEFAULT 0,
    
    -- Performance Metrics
    average_approval_time_hours DECIMAL(8,2),
    average_processing_time_seconds DECIMAL(10,2),
    success_rate DECIMAL(5,2),
    approval_rate DECIMAL(5,2),
    
    -- Quality Metrics
    average_quality_score DECIMAL(3,2),
    compliance_rate DECIMAL(5,2),
    manual_intervention_rate DECIMAL(5,2),
    
    -- Business Impact
    total_credits_consumed INTEGER DEFAULT 0,
    estimated_traffic_generated INTEGER DEFAULT 0,
    estimated_leads_generated INTEGER DEFAULT 0,
    
    -- Cost Analysis
    total_submission_costs_cents INTEGER DEFAULT 0,
    average_cost_per_submission_cents INTEGER DEFAULT 0,
    
    -- Automation Performance
    automation_success_rate DECIMAL(5,2),
    error_rate DECIMAL(5,2),
    retry_rate DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint for daily analytics
ALTER TABLE submission_analytics_daily 
ADD CONSTRAINT unique_daily_analytics 
UNIQUE (analytics_date, directory_id, customer_id);

-- Create indexes for analytics table
CREATE INDEX IF NOT EXISTS idx_submission_analytics_date ON submission_analytics_daily(analytics_date);
CREATE INDEX IF NOT EXISTS idx_submission_analytics_directory ON submission_analytics_daily(directory_id);
CREATE INDEX IF NOT EXISTS idx_submission_analytics_customer ON submission_analytics_daily(customer_id);
CREATE INDEX IF NOT EXISTS idx_submission_analytics_success_rate ON submission_analytics_daily(success_rate);

-- Create trigger for analytics updated_at
CREATE TRIGGER update_submission_analytics_daily_updated_at 
    BEFORE UPDATE ON submission_analytics_daily 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create comprehensive analytics views
CREATE OR REPLACE VIEW submission_performance_dashboard AS
SELECT 
    ds.id,
    ds.internal_reference_id,
    ds.status,
    c.email as customer_email,
    c.company_name,
    c.subscription_tier,
    d.name as directory_name,
    d.da_score,
    d.priority_tier,
    ds.submitted_at,
    ds.approved_at,
    ds.approval_time_hours,
    ds.processing_time_seconds,
    ds.quality_score,
    ds.automation_method,
    ds.manual_intervention_required,
    ds.credits_consumed,
    ds.business_name_submitted,
    -- Calculate time since submission
    CASE 
        WHEN ds.submitted_at IS NOT NULL THEN
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ds.submitted_at))::INTEGER / 3600
        ELSE NULL
    END as hours_since_submission,
    -- Determine if submission is overdue (based on directory average approval time)
    CASE 
        WHEN ds.status IN ('submitted', 'under_review') AND ds.submitted_at IS NOT NULL THEN
            ds.submitted_at + (d.average_approval_time || ' days')::INTERVAL < CURRENT_TIMESTAMP
        ELSE false
    END as is_overdue,
    ds.created_at
FROM directory_submissions ds
JOIN customers c ON ds.customer_id = c.id
JOIN directories d ON ds.directory_id = d.id;

CREATE OR REPLACE VIEW directory_performance_analytics AS
SELECT 
    d.id as directory_id,
    d.name as directory_name,
    d.da_score,
    d.priority_tier,
    d.average_approval_time as expected_approval_days,
    -- Submission counts
    COUNT(*) as total_submissions,
    COUNT(*) FILTER (WHERE ds.status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE ds.status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE ds.status IN ('submitted', 'under_review')) as pending_count,
    COUNT(*) FILTER (WHERE ds.status = 'failed') as failed_count,
    -- Success rates
    ROUND(
        COUNT(*) FILTER (WHERE ds.status = 'approved')::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as approval_rate_percentage,
    ROUND(
        COUNT(*) FILTER (WHERE ds.status IN ('approved', 'submitted', 'under_review'))::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as success_rate_percentage,
    -- Average metrics
    AVG(ds.approval_time_hours) as avg_approval_time_hours,
    AVG(ds.processing_time_seconds) as avg_processing_time_seconds,
    AVG(ds.quality_score) as avg_quality_score,
    -- Manual intervention analysis
    ROUND(
        COUNT(*) FILTER (WHERE ds.manual_intervention_required = true)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as manual_intervention_percentage,
    -- Recent performance (last 30 days)
    COUNT(*) FILTER (WHERE ds.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') as submissions_last_30_days,
    ROUND(
        COUNT(*) FILTER (WHERE ds.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' AND ds.status = 'approved')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE ds.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'), 0) * 100, 2
    ) as approval_rate_last_30_days,
    -- Financial metrics
    SUM(ds.credits_consumed) as total_credits_consumed,
    SUM(ds.submission_cost_cents) as total_cost_cents,
    AVG(ds.submission_cost_cents) as avg_cost_per_submission_cents,
    -- Most recent activity
    MAX(ds.created_at) as last_submission_date,
    MAX(ds.approved_at) as last_approval_date
FROM directories d
LEFT JOIN directory_submissions ds ON d.id = ds.directory_id
GROUP BY d.id, d.name, d.da_score, d.priority_tier, d.average_approval_time;

CREATE OR REPLACE VIEW customer_submission_summary AS
SELECT 
    c.id as customer_id,
    c.email,
    c.company_name,
    c.subscription_tier,
    c.credits_remaining,
    c.credits_limit,
    -- Submission counts
    COUNT(ds.*) as total_submissions,
    COUNT(*) FILTER (WHERE ds.status = 'approved') as approved_submissions,
    COUNT(*) FILTER (WHERE ds.status = 'rejected') as rejected_submissions,
    COUNT(*) FILTER (WHERE ds.status IN ('submitted', 'under_review')) as pending_submissions,
    COUNT(*) FILTER (WHERE ds.status = 'failed') as failed_submissions,
    -- Success rates
    ROUND(
        COUNT(*) FILTER (WHERE ds.status = 'approved')::numeric / 
        NULLIF(COUNT(ds.*), 0) * 100, 2
    ) as success_rate_percentage,
    -- Credits and costs
    SUM(ds.credits_consumed) as total_credits_used,
    SUM(ds.submission_cost_cents) as total_spent_cents,
    -- Quality metrics
    AVG(ds.quality_score) as avg_quality_score,
    -- Recent activity
    MAX(ds.created_at) as last_submission_date,
    COUNT(*) FILTER (WHERE ds.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') as submissions_last_30_days,
    -- Directory diversity
    COUNT(DISTINCT ds.directory_id) as unique_directories_used,
    -- Performance
    AVG(ds.approval_time_hours) as avg_approval_time_hours
FROM customers c
LEFT JOIN directory_submissions ds ON c.id = ds.customer_id
GROUP BY c.id, c.email, c.company_name, c.subscription_tier, c.credits_remaining, c.credits_limit;

-- Add comprehensive comments
COMMENT ON TABLE directory_submissions IS 'Detailed tracking of directory submissions with performance metrics, proof storage, and analytics';
COMMENT ON TABLE submission_analytics_daily IS 'Daily aggregated analytics for submission performance and business metrics';
COMMENT ON VIEW submission_performance_dashboard IS 'Real-time dashboard view for monitoring submission status and performance';
COMMENT ON VIEW directory_performance_analytics IS 'Analytics view for directory success rates and performance metrics';
COMMENT ON VIEW customer_submission_summary IS 'Customer-level submission analytics and usage summary';

COMMENT ON COLUMN directory_submissions.external_submission_id IS 'ID assigned by the directory system';
COMMENT ON COLUMN directory_submissions.internal_reference_id IS 'Our internal tracking reference for customer support';
COMMENT ON COLUMN directory_submissions.submission_url IS 'Direct URL to the live listing on the directory';
COMMENT ON COLUMN directory_submissions.approval_time_hours IS 'Time taken from submission to approval in hours';
COMMENT ON COLUMN directory_submissions.quality_score IS 'Internal quality rating (1-10) for the submission';
COMMENT ON COLUMN directory_submissions.screenshot_urls IS 'Array of URLs to submission proof screenshots';
COMMENT ON COLUMN directory_submissions.listing_data IS 'Complete business information as submitted to directory';
COMMENT ON COLUMN directory_submissions.automation_method IS 'Method used for submission automation';
COMMENT ON COLUMN directory_submissions.credits_consumed IS 'Number of customer credits used for this submission';
COMMENT ON COLUMN directory_submissions.traffic_generated_estimate IS 'Estimated traffic generated from this listing';
COMMENT ON COLUMN directory_submissions.follow_up_required IS 'Whether this submission needs follow-up monitoring';
COMMENT ON COLUMN directory_submissions.compliance_status IS 'Compliance status with directory requirements';