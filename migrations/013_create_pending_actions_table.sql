-- Migration: Create Pending Actions Table
-- Purpose: Verification task management and VA assignment system
-- Date: 2025-09-05
-- Phase: 2.1 Database Schema Enhancement

-- Create pending_actions table for verification task management
CREATE TABLE IF NOT EXISTS pending_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Related Records
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    submission_queue_id UUID REFERENCES submission_queue(id) ON DELETE CASCADE,
    directory_id UUID NOT NULL REFERENCES directories(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batch_submissions(id) ON DELETE SET NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL CHECK (
        action_type IN (
            'sms_verification',     -- SMS verification required
            'email_verification',   -- Email confirmation needed
            'document_upload',      -- Document verification required
            'phone_call',           -- Phone verification needed
            'manual_submission',    -- Manual form submission
            'captcha_solving',      -- CAPTCHA needs solving
            'account_creation',     -- Create account on directory
            'payment_processing',   -- Handle paid directory submission
            'content_review',       -- Review generated content
            'screenshot_verification', -- Verify submission screenshot
            'follow_up_required',   -- Follow up on submission status
            'error_resolution'      -- Resolve submission error
        )
    ),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Priority & Scheduling
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1=urgent, 5=low
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',          -- Waiting for assignment
            'assigned',         -- Assigned to VA
            'in_progress',      -- Being worked on
            'completed',        -- Successfully completed
            'failed',           -- Failed to complete
            'blocked',          -- Blocked by external factor
            'cancelled',        -- Cancelled by customer
            'requires_customer' -- Needs customer input
        )
    ),
    
    -- Assignment & Ownership
    assigned_to_va_id VARCHAR(100), -- VA user ID or identifier
    assigned_to_va_name VARCHAR(255), -- VA name for display
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Timing & Deadlines
    deadline_at TIMESTAMP WITH TIME ZONE,
    estimated_duration_minutes INTEGER DEFAULT 30,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Action Data & Context
    action_data JSONB NOT NULL DEFAULT '{}', -- Action-specific data and requirements
    business_context JSONB NOT NULL DEFAULT '{}', -- Business information for context
    directory_context JSONB NOT NULL DEFAULT '{}', -- Directory-specific information
    
    -- Results & Output
    result_data JSONB DEFAULT '{}', -- Action results and outputs
    completion_notes TEXT,
    error_message TEXT,
    resolution_details TEXT,
    
    -- Customer Communication
    customer_notified BOOLEAN DEFAULT false,
    customer_notification_sent_at TIMESTAMP WITH TIME ZONE,
    customer_response_required BOOLEAN DEFAULT false,
    customer_response_deadline TIMESTAMP WITH TIME ZONE,
    customer_response TEXT,
    customer_response_received_at TIMESTAMP WITH TIME ZONE,
    
    -- Quality & Verification
    requires_verification BOOLEAN DEFAULT false,
    verified_by_supervisor BOOLEAN DEFAULT false,
    verification_notes TEXT,
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    
    -- Retry & Follow-up Logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 2,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_at TIMESTAMP WITH TIME ZONE,
    
    -- External References
    external_reference_id VARCHAR(255), -- Reference ID from external system
    external_reference_url VARCHAR(500), -- URL to external resource
    
    -- Files & Attachments
    attachment_urls JSONB DEFAULT '[]', -- Array of attachment URLs
    screenshot_urls JSONB DEFAULT '[]', -- Array of screenshot URLs
    
    -- Performance Tracking
    actual_duration_minutes INTEGER,
    complexity_score INTEGER DEFAULT 1 CHECK (complexity_score >= 1 AND complexity_score <= 10),
    automation_attempted BOOLEAN DEFAULT false,
    manual_intervention_reason TEXT,
    
    -- Audit & Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Create strategic indexes for task management
CREATE INDEX IF NOT EXISTS idx_pending_actions_status ON pending_actions(status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_priority_deadline ON pending_actions(priority, deadline_at);
CREATE INDEX IF NOT EXISTS idx_pending_actions_action_type ON pending_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_pending_actions_customer_id ON pending_actions(customer_id);
CREATE INDEX IF NOT EXISTS idx_pending_actions_submission_queue_id ON pending_actions(submission_queue_id);
CREATE INDEX IF NOT EXISTS idx_pending_actions_directory_id ON pending_actions(directory_id);
CREATE INDEX IF NOT EXISTS idx_pending_actions_assigned_va ON pending_actions(assigned_to_va_id) WHERE assigned_to_va_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pending_actions_scheduled_for ON pending_actions(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pending_actions_deadline_at ON pending_actions(deadline_at) WHERE deadline_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pending_actions_created_at ON pending_actions(created_at);

-- Composite indexes for common VA workflows
CREATE INDEX IF NOT EXISTS idx_pending_actions_status_priority ON pending_actions(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_pending_actions_va_status ON pending_actions(assigned_to_va_id, status) WHERE assigned_to_va_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pending_actions_type_status ON pending_actions(action_type, status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_customer_status ON pending_actions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_verification_required ON pending_actions(requires_verification, verified_by_supervisor) WHERE requires_verification = true;
CREATE INDEX IF NOT EXISTS idx_pending_actions_follow_up ON pending_actions(follow_up_required, follow_up_at) WHERE follow_up_required = true;

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_pending_actions_action_data_gin ON pending_actions USING GIN (action_data);
CREATE INDEX IF NOT EXISTS idx_pending_actions_business_context_gin ON pending_actions USING GIN (business_context);
CREATE INDEX IF NOT EXISTS idx_pending_actions_result_data_gin ON pending_actions USING GIN (result_data);
CREATE INDEX IF NOT EXISTS idx_pending_actions_metadata_gin ON pending_actions USING GIN (metadata);

-- Create trigger for updated_at
CREATE TRIGGER update_pending_actions_updated_at 
    BEFORE UPDATE ON pending_actions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically assign actions based on VA skills
CREATE OR REPLACE FUNCTION auto_assign_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Set started_at when action begins
    IF OLD.status != 'in_progress' AND NEW.status = 'in_progress' THEN
        NEW.started_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Calculate actual duration when completed
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
        IF NEW.started_at IS NOT NULL THEN
            NEW.actual_duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - NEW.started_at))::INTEGER / 60;
        END IF;
    END IF;
    
    -- Set deadline if not provided (based on priority)
    IF NEW.deadline_at IS NULL AND TG_OP = 'INSERT' THEN
        NEW.deadline_at = CASE NEW.priority
            WHEN 1 THEN CURRENT_TIMESTAMP + INTERVAL '1 hour'   -- Urgent: 1 hour
            WHEN 2 THEN CURRENT_TIMESTAMP + INTERVAL '4 hours'  -- High: 4 hours
            WHEN 3 THEN CURRENT_TIMESTAMP + INTERVAL '24 hours' -- Medium: 1 day
            WHEN 4 THEN CURRENT_TIMESTAMP + INTERVAL '72 hours' -- Low: 3 days
            ELSE CURRENT_TIMESTAMP + INTERVAL '168 hours'       -- Lowest: 1 week
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_action
    BEFORE INSERT OR UPDATE ON pending_actions
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_action();

-- Create VA assignment table for managing virtual assistants
CREATE TABLE IF NOT EXISTS virtual_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- VA Profile
    va_id VARCHAR(100) NOT NULL UNIQUE, -- External VA system ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Skills & Capabilities
    skills JSONB DEFAULT '[]', -- Array of skills: ["sms_verification", "captcha_solving", etc.]
    specializations JSONB DEFAULT '[]', -- Directory types or industries they specialize in
    languages JSONB DEFAULT '["en"]', -- Supported languages
    
    -- Availability & Capacity
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'UTC',
    working_hours JSONB DEFAULT '{
        "monday": {"start": "09:00", "end": "17:00"},
        "tuesday": {"start": "09:00", "end": "17:00"},
        "wednesday": {"start": "09:00", "end": "17:00"},
        "thursday": {"start": "09:00", "end": "17:00"},
        "friday": {"start": "09:00", "end": "17:00"},
        "saturday": {"start": null, "end": null},
        "sunday": {"start": null, "end": null}
    }',
    
    -- Performance Metrics
    current_active_tasks INTEGER DEFAULT 0,
    max_concurrent_tasks INTEGER DEFAULT 10,
    average_completion_time_minutes INTEGER,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    total_tasks_completed INTEGER DEFAULT 0,
    total_tasks_failed INTEGER DEFAULT 0,
    
    -- Quality Metrics
    average_quality_score DECIMAL(3,2) DEFAULT 5.00,
    customer_satisfaction_score DECIMAL(3,2),
    supervisor_rating DECIMAL(3,2),
    
    -- Status & Tracking
    last_active_at TIMESTAMP WITH TIME ZONE,
    last_assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Contact & Communication
    communication_preferences JSONB DEFAULT '{
        "slack_id": null,
        "phone_notifications": true,
        "email_notifications": true,
        "preferred_contact_method": "email"
    }',
    
    -- Audit & Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for virtual_assistants
CREATE INDEX IF NOT EXISTS idx_virtual_assistants_va_id ON virtual_assistants(va_id);
CREATE INDEX IF NOT EXISTS idx_virtual_assistants_is_active ON virtual_assistants(is_active);
CREATE INDEX IF NOT EXISTS idx_virtual_assistants_is_available ON virtual_assistants(is_available);
CREATE INDEX IF NOT EXISTS idx_virtual_assistants_current_tasks ON virtual_assistants(current_active_tasks, max_concurrent_tasks);

-- GIN indexes for skills and specializations
CREATE INDEX IF NOT EXISTS idx_virtual_assistants_skills_gin ON virtual_assistants USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_virtual_assistants_specializations_gin ON virtual_assistants USING GIN (specializations);

-- Create trigger for virtual_assistants updated_at
CREATE TRIGGER update_virtual_assistants_updated_at 
    BEFORE UPDATE ON virtual_assistants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update VA task counts
CREATE OR REPLACE FUNCTION update_va_task_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update VA task counts when actions are assigned/unassigned/completed
    IF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.assigned_to_va_id IS NOT NULL AND OLD.status IN ('assigned', 'in_progress') 
           AND NEW.status IN ('completed', 'failed', 'cancelled') THEN
            -- Task completed/failed - decrease count
            UPDATE virtual_assistants 
            SET 
                current_active_tasks = GREATEST(current_active_tasks - 1, 0),
                total_tasks_completed = CASE 
                    WHEN NEW.status = 'completed' THEN total_tasks_completed + 1
                    ELSE total_tasks_completed
                END,
                total_tasks_failed = CASE 
                    WHEN NEW.status = 'failed' THEN total_tasks_failed + 1
                    ELSE total_tasks_failed
                END,
                last_active_at = CURRENT_TIMESTAMP
            WHERE va_id = OLD.assigned_to_va_id;
        ELSIF OLD.assigned_to_va_id IS NULL AND NEW.assigned_to_va_id IS NOT NULL 
              AND NEW.status IN ('assigned', 'in_progress') THEN
            -- Task newly assigned - increase count
            UPDATE virtual_assistants 
            SET 
                current_active_tasks = current_active_tasks + 1,
                last_assigned_at = CURRENT_TIMESTAMP
            WHERE va_id = NEW.assigned_to_va_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_va_task_counts
    AFTER UPDATE OF assigned_to_va_id, status ON pending_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_va_task_counts();

-- Create views for action center and VA management
CREATE OR REPLACE VIEW action_center_dashboard AS
SELECT 
    pa.id,
    pa.action_type,
    pa.title,
    pa.description,
    pa.priority,
    pa.status,
    pa.deadline_at,
    pa.estimated_duration_minutes,
    c.email as customer_email,
    c.company_name,
    c.subscription_tier,
    d.name as directory_name,
    pa.assigned_to_va_name,
    pa.created_at,
    -- Calculate time until deadline
    CASE 
        WHEN pa.deadline_at IS NOT NULL THEN
            EXTRACT(EPOCH FROM (pa.deadline_at - CURRENT_TIMESTAMP))::INTEGER / 60
        ELSE NULL
    END as minutes_until_deadline,
    -- Check if overdue
    (pa.deadline_at IS NOT NULL AND pa.deadline_at < CURRENT_TIMESTAMP AND pa.status NOT IN ('completed', 'cancelled')) as is_overdue,
    -- Calculate priority score for sorting
    CASE pa.priority
        WHEN 1 THEN 100
        WHEN 2 THEN 80
        WHEN 3 THEN 60
        WHEN 4 THEN 40
        ELSE 20
    END + 
    CASE 
        WHEN pa.deadline_at IS NOT NULL AND pa.deadline_at < CURRENT_TIMESTAMP THEN 50
        WHEN pa.deadline_at IS NOT NULL AND pa.deadline_at < CURRENT_TIMESTAMP + INTERVAL '1 hour' THEN 30
        ELSE 0
    END as priority_score
FROM pending_actions pa
JOIN customers c ON pa.customer_id = c.id
JOIN directories d ON pa.directory_id = d.id;

CREATE OR REPLACE VIEW va_workload_dashboard AS
SELECT 
    va.va_id,
    va.name,
    va.is_active,
    va.is_available,
    va.current_active_tasks,
    va.max_concurrent_tasks,
    va.success_rate,
    va.average_quality_score,
    -- Calculate workload percentage
    ROUND((va.current_active_tasks::numeric / NULLIF(va.max_concurrent_tasks, 0)) * 100, 2) as workload_percentage,
    -- Count tasks by status for this VA
    COUNT(*) FILTER (WHERE pa.status = 'assigned') as assigned_tasks,
    COUNT(*) FILTER (WHERE pa.status = 'in_progress') as in_progress_tasks,
    COUNT(*) FILTER (WHERE pa.status = 'blocked') as blocked_tasks,
    COUNT(*) FILTER (WHERE pa.deadline_at < CURRENT_TIMESTAMP AND pa.status NOT IN ('completed', 'cancelled', 'failed')) as overdue_tasks,
    va.last_active_at
FROM virtual_assistants va
LEFT JOIN pending_actions pa ON va.va_id = pa.assigned_to_va_id AND pa.status IN ('assigned', 'in_progress', 'blocked')
GROUP BY va.va_id, va.name, va.is_active, va.is_available, va.current_active_tasks, va.max_concurrent_tasks, va.success_rate, va.average_quality_score, va.last_active_at;

-- Add comprehensive comments
COMMENT ON TABLE pending_actions IS 'Verification task management and VA assignment system for manual interventions';
COMMENT ON TABLE virtual_assistants IS 'Virtual assistant management with skills, availability, and performance tracking';
COMMENT ON VIEW action_center_dashboard IS 'Action center dashboard with priorities, deadlines, and customer context';
COMMENT ON VIEW va_workload_dashboard IS 'VA workload monitoring with task distribution and performance metrics';

COMMENT ON COLUMN pending_actions.action_type IS 'Type of verification or manual action required';
COMMENT ON COLUMN pending_actions.priority IS 'Task priority (1=urgent, 5=low)';
COMMENT ON COLUMN pending_actions.action_data IS 'Action-specific requirements and context data';
COMMENT ON COLUMN pending_actions.business_context IS 'Customer business information for context';
COMMENT ON COLUMN pending_actions.customer_response_required IS 'Whether customer input is needed';
COMMENT ON COLUMN pending_actions.quality_score IS 'Quality rating of completed action (1-5)';
COMMENT ON COLUMN pending_actions.complexity_score IS 'Task complexity rating (1-10)';

COMMENT ON COLUMN virtual_assistants.skills IS 'Array of VA skills and capabilities';
COMMENT ON COLUMN virtual_assistants.working_hours IS 'VA availability schedule by day';
COMMENT ON COLUMN virtual_assistants.current_active_tasks IS 'Number of currently assigned active tasks';
COMMENT ON COLUMN virtual_assistants.success_rate IS 'Percentage of successfully completed tasks';

-- Insert sample VA for testing
INSERT INTO virtual_assistants (
    va_id,
    name,
    email,
    skills,
    specializations,
    max_concurrent_tasks
) VALUES (
    'va_001',
    'Sarah Johnson',
    'sarah@directorybolt.com',
    '["sms_verification", "email_verification", "captcha_solving", "manual_submission", "document_upload"]',
    '["business_directories", "local_listings", "tech_startups"]',
    15
) ON CONFLICT (va_id) DO NOTHING;