-- Migration: Create Customer Support Tables
-- Purpose: Supporting tables for directory submissions and progress tracking
-- Date: 2025-09-18
-- Phase: 2.2 Customer Management Enhancement

-- Create customer_submissions table for tracking directory submissions
CREATE TABLE IF NOT EXISTS customer_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    directory_id UUID REFERENCES directories(id) ON DELETE SET NULL,
    
    -- Submission Details
    submission_url VARCHAR(500),
    directory_name VARCHAR(255) NOT NULL,
    directory_category VARCHAR(100),
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Status Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',      -- Queued for submission
            'in_progress',  -- Currently being submitted
            'submitted',    -- Successfully submitted
            'approved',     -- Approved by directory
            'rejected',     -- Rejected by directory
            'failed',       -- Submission failed
            'requires_verification', -- Needs manual verification
            'cancelled'     -- Cancelled by customer or system
        )
    ),
    
    -- Submission Data
    submitted_data JSONB DEFAULT '{}', -- Data submitted to directory
    submission_response JSONB DEFAULT '{}', -- Response from directory
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Automation Details
    automation_method VARCHAR(50) DEFAULT 'manual' CHECK (
        automation_method IN ('manual', 'api', 'chrome_extension', 'headless_browser')
    ),
    submission_proof_url VARCHAR(500), -- Screenshot or proof of submission
    
    -- Quality & Verification
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
    requires_follow_up BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_notes TEXT,
    
    -- Performance Metrics
    processing_time_seconds INTEGER,
    retry_count INTEGER DEFAULT 0,
    
    -- Staff Assignment
    assigned_staff VARCHAR(255),
    reviewed_by VARCHAR(255),
    review_date TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Create customer_progress table for tracking overall progress
CREATE TABLE IF NOT EXISTS customer_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Progress Metrics
    total_directories_selected INTEGER DEFAULT 0,
    directories_submitted INTEGER DEFAULT 0,
    directories_approved INTEGER DEFAULT 0,
    directories_rejected INTEGER DEFAULT 0,
    directories_pending INTEGER DEFAULT 0,
    
    -- Completion Tracking
    completion_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    estimated_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    
    -- Quality Metrics
    average_quality_score DECIMAL(3,2),
    approval_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timeline
    project_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_submission_date TIMESTAMP WITH TIME ZONE,
    next_milestone_date TIMESTAMP WITH TIME ZONE,
    
    -- Status
    overall_status VARCHAR(50) DEFAULT 'active' CHECK (
        overall_status IN ('active', 'paused', 'completed', 'cancelled', 'on_hold')
    ),
    
    -- Staff Assignment
    project_manager VARCHAR(255),
    assigned_team JSONB DEFAULT '[]', -- Array of staff members
    
    -- Communication
    last_update_sent TIMESTAMP WITH TIME ZONE,
    next_update_due TIMESTAMP WITH TIME ZONE,
    communication_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (
        communication_frequency IN ('daily', 'weekly', 'bi_weekly', 'monthly', 'as_needed')
    ),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Create customer_communications table for tracking all communications
CREATE TABLE IF NOT EXISTS customer_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    related_submission_id UUID REFERENCES customer_submissions(id) ON DELETE SET NULL,
    
    -- Communication Details
    communication_type VARCHAR(50) NOT NULL CHECK (
        communication_type IN (
            'email', 'phone', 'chat', 'internal_note', 'system_notification',
            'sms', 'support_ticket', 'status_update', 'welcome_message'
        )
    ),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
    
    -- Content
    subject VARCHAR(255),
    message TEXT NOT NULL,
    formatted_message JSONB, -- For rich content, templates, etc.
    
    -- Status
    status VARCHAR(30) DEFAULT 'sent' CHECK (
        status IN ('draft', 'sent', 'delivered', 'read', 'failed', 'bounced')
    ),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    ),
    
    -- Staff & Automation
    staff_member VARCHAR(255),
    automated BOOLEAN DEFAULT false,
    template_used VARCHAR(100),
    
    -- Response Tracking
    requires_response BOOLEAN DEFAULT false,
    response_due_date TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_id UUID REFERENCES customer_communications(id),
    
    -- External References
    external_message_id VARCHAR(255), -- Email message ID, ticket ID, etc.
    thread_id VARCHAR(255), -- For grouping related messages
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Create customer_payments table for payment tracking
CREATE TABLE IF NOT EXISTS customer_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Payment Details
    payment_id VARCHAR(255) NOT NULL, -- Stripe payment intent ID or similar
    payment_method VARCHAR(50) CHECK (
        payment_method IN ('card', 'bank_transfer', 'paypal', 'crypto', 'manual', 'refund')
    ),
    
    -- Amount & Currency
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    amount_decimal DECIMAL(10,2) NOT NULL,
    
    -- Status
    payment_status VARCHAR(50) NOT NULL CHECK (
        payment_status IN (
            'pending', 'processing', 'succeeded', 'failed', 'cancelled',
            'refunded', 'partially_refunded', 'dispute_created', 'dispute_resolved'
        )
    ),
    
    -- Transaction Details
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Stripe/External Details
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    external_transaction_id VARCHAR(255),
    
    -- Package/Service Details
    package_type VARCHAR(50),
    service_description TEXT,
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Refund Information
    refund_amount_cents INTEGER DEFAULT 0,
    refund_reason TEXT,
    refund_date TIMESTAMP WITH TIME ZONE,
    refund_reference VARCHAR(255),
    
    -- Invoice Details
    invoice_id VARCHAR(255),
    invoice_url VARCHAR(500),
    receipt_url VARCHAR(500),
    
    -- Additional Information
    payment_notes TEXT,
    staff_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Create strategic indexes for performance

-- customer_submissions indexes
CREATE INDEX IF NOT EXISTS idx_customer_submissions_customer_id ON customer_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_directory_id ON customer_submissions(directory_id);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_status ON customer_submissions(status);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_submission_date ON customer_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_assigned_staff ON customer_submissions(assigned_staff) WHERE assigned_staff IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_submissions_requires_follow_up ON customer_submissions(requires_follow_up, follow_up_date) WHERE requires_follow_up = true;

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_customer_submissions_customer_status ON customer_submissions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_status_date ON customer_submissions(status, submission_date);

-- GIN indexes for JSONB
CREATE INDEX IF NOT EXISTS idx_customer_submissions_submitted_data_gin ON customer_submissions USING GIN (submitted_data);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_metadata_gin ON customer_submissions USING GIN (metadata);

-- customer_progress indexes
CREATE INDEX IF NOT EXISTS idx_customer_progress_customer_id ON customer_progress(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_progress_overall_status ON customer_progress(overall_status);
CREATE INDEX IF NOT EXISTS idx_customer_progress_completion_date ON customer_progress(estimated_completion_date);
CREATE INDEX IF NOT EXISTS idx_customer_progress_project_manager ON customer_progress(project_manager) WHERE project_manager IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_progress_next_update ON customer_progress(next_update_due) WHERE next_update_due IS NOT NULL;

-- customer_communications indexes
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_type ON customer_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_customer_communications_direction ON customer_communications(direction);
CREATE INDEX IF NOT EXISTS idx_customer_communications_status ON customer_communications(status);
CREATE INDEX IF NOT EXISTS idx_customer_communications_created_at ON customer_communications(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_communications_staff_member ON customer_communications(staff_member) WHERE staff_member IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_communications_requires_response ON customer_communications(requires_response, response_due_date) WHERE requires_response = true;
CREATE INDEX IF NOT EXISTS idx_customer_communications_thread_id ON customer_communications(thread_id) WHERE thread_id IS NOT NULL;

-- customer_payments indexes
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_id ON customer_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_status ON customer_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_customer_payments_transaction_date ON customer_payments(transaction_date);
CREATE INDEX IF NOT EXISTS idx_customer_payments_stripe_payment_intent ON customer_payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_payments_package_type ON customer_payments(package_type) WHERE package_type IS NOT NULL;

-- Create triggers for updated_at columns
CREATE TRIGGER update_customer_submissions_updated_at 
    BEFORE UPDATE ON customer_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_progress_updated_at 
    BEFORE UPDATE ON customer_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_communications_updated_at 
    BEFORE UPDATE ON customer_communications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_payments_updated_at 
    BEFORE UPDATE ON customer_payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update customer progress
CREATE OR REPLACE FUNCTION update_customer_progress_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update progress stats when a submission status changes
    INSERT INTO customer_progress (customer_id)
    VALUES (NEW.customer_id)
    ON CONFLICT (customer_id) DO UPDATE SET
        directories_submitted = (
            SELECT COUNT(*) FROM customer_submissions 
            WHERE customer_id = NEW.customer_id AND status IN ('submitted', 'approved', 'rejected')
        ),
        directories_approved = (
            SELECT COUNT(*) FROM customer_submissions 
            WHERE customer_id = NEW.customer_id AND status = 'approved'
        ),
        directories_rejected = (
            SELECT COUNT(*) FROM customer_submissions 
            WHERE customer_id = NEW.customer_id AND status = 'rejected'
        ),
        directories_pending = (
            SELECT COUNT(*) FROM customer_submissions 
            WHERE customer_id = NEW.customer_id AND status IN ('pending', 'in_progress', 'requires_verification')
        ),
        completion_percentage = CASE 
            WHEN total_directories_selected > 0 THEN
                ROUND((
                    SELECT COUNT(*)::numeric FROM customer_submissions 
                    WHERE customer_id = NEW.customer_id AND status IN ('submitted', 'approved', 'rejected')
                ) / total_directories_selected * 100, 2)
            ELSE 0
        END,
        approval_rate = CASE 
            WHEN directories_submitted > 0 THEN
                ROUND((directories_approved::numeric / directories_submitted) * 100, 2)
            ELSE 0
        END,
        average_quality_score = (
            SELECT AVG(quality_score) FROM customer_submissions 
            WHERE customer_id = NEW.customer_id AND quality_score IS NOT NULL
        ),
        last_submission_date = (
            SELECT MAX(submission_date) FROM customer_submissions 
            WHERE customer_id = NEW.customer_id
        ),
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_progress_stats
    AFTER INSERT OR UPDATE OF status ON customer_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_progress_stats();

-- Create comprehensive views for reporting

-- Customer overview with all key metrics
CREATE OR REPLACE VIEW customer_overview AS
SELECT 
    c.id,
    c.customer_id,
    c.email,
    c.first_name,
    c.last_name,
    c.business_name,
    c.package_type,
    c.submission_status,
    c.payment_status,
    c.created_at,
    
    -- Progress metrics
    COALESCE(cp.directories_submitted, 0) as directories_submitted,
    COALESCE(cp.directories_approved, 0) as directories_approved,
    COALESCE(cp.directories_rejected, 0) as directories_rejected,
    COALESCE(cp.directories_pending, 0) as directories_pending,
    COALESCE(cp.completion_percentage, 0) as completion_percentage,
    COALESCE(cp.approval_rate, 0) as approval_rate,
    cp.estimated_completion_date,
    cp.project_manager,
    cp.overall_status as project_status,
    
    -- Recent activity
    (
        SELECT MAX(created_at) FROM customer_communications cc 
        WHERE cc.customer_id = c.id
    ) as last_communication_date,
    (
        SELECT MAX(submission_date) FROM customer_submissions cs 
        WHERE cs.customer_id = c.id
    ) as last_submission_date,
    
    -- Payment info
    (
        SELECT SUM(amount_decimal) FROM customer_payments cp_pay 
        WHERE cp_pay.customer_id = c.id AND payment_status = 'succeeded'
    ) as total_paid,
    (
        SELECT MAX(payment_date) FROM customer_payments cp_pay 
        WHERE cp_pay.customer_id = c.id AND payment_status = 'succeeded'
    ) as last_payment_date

FROM customers c
LEFT JOIN customer_progress cp ON c.id = cp.customer_id;

-- Staff workload view
CREATE OR REPLACE VIEW staff_workload AS
SELECT 
    assigned_staff,
    COUNT(*) as active_customers,
    SUM(CASE WHEN overall_status = 'active' THEN 1 ELSE 0 END) as active_projects,
    SUM(CASE WHEN completion_percentage < 25 THEN 1 ELSE 0 END) as early_stage_projects,
    SUM(CASE WHEN completion_percentage >= 75 THEN 1 ELSE 0 END) as near_completion_projects,
    AVG(completion_percentage) as avg_completion_percentage,
    COUNT(*) FILTER (WHERE next_update_due <= CURRENT_TIMESTAMP) as overdue_updates
FROM customer_progress
WHERE assigned_staff IS NOT NULL
GROUP BY assigned_staff
ORDER BY active_customers DESC;

-- Daily submission report
CREATE OR REPLACE VIEW daily_submission_report AS
SELECT 
    DATE(submission_date) as submission_date,
    COUNT(*) as total_submissions,
    COUNT(*) FILTER (WHERE status = 'submitted') as successful_submissions,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_submissions,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_submissions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_submissions,
    AVG(processing_time_seconds) as avg_processing_time,
    COUNT(DISTINCT customer_id) as unique_customers
FROM customer_submissions
WHERE submission_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(submission_date)
ORDER BY submission_date DESC;

-- Add comprehensive comments
COMMENT ON TABLE customer_submissions IS 'Tracks individual directory submissions for each customer';
COMMENT ON TABLE customer_progress IS 'Tracks overall progress and project status for each customer';
COMMENT ON TABLE customer_communications IS 'Records all communications with customers';
COMMENT ON TABLE customer_payments IS 'Tracks all payment transactions and billing history';

COMMENT ON VIEW customer_overview IS 'Comprehensive customer overview with progress and activity metrics';
COMMENT ON VIEW staff_workload IS 'Staff workload distribution and project status summary';
COMMENT ON VIEW daily_submission_report IS 'Daily submission statistics and performance metrics';

-- Create initial progress records for existing customers
INSERT INTO customer_progress (customer_id)
SELECT id FROM customers 
WHERE id NOT IN (SELECT customer_id FROM customer_progress);

RAISE NOTICE 'Migration 017 completed successfully - Customer support tables created';