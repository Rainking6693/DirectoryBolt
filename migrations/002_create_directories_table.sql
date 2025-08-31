-- Migration: Create Enhanced Directories Table
-- Purpose: Comprehensive directory management with 220+ directories support
-- Date: 2025-08-31

-- Create enhanced directories table with comprehensive metadata
CREATE TABLE IF NOT EXISTS directories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    website VARCHAR(500) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    
    -- Authority and Quality Metrics
    da_score INTEGER CHECK (da_score >= 1 AND da_score <= 100) DEFAULT 50,
    priority_tier VARCHAR(20) CHECK (priority_tier IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    success_rate DECIMAL(3,2) CHECK (success_rate >= 0 AND success_rate <= 1) DEFAULT 0.70,
    
    -- Submission Details
    description TEXT,
    submission_requirements JSONB DEFAULT '{}', -- {account_needed: true, approval_process: "manual", etc.}
    form_fields JSONB DEFAULT '[]', -- [{name: "business_name", type: "text", required: true}, ...]
    average_approval_time INTEGER DEFAULT 3, -- in days
    submission_difficulty INTEGER CHECK (submission_difficulty >= 1 AND submission_difficulty <= 5) DEFAULT 3,
    
    -- Business Compatibility
    business_types JSONB DEFAULT '[]', -- ["restaurant", "retail", "service", ...]
    pricing_model VARCHAR(20) CHECK (pricing_model IN ('free', 'paid', 'freemium')) DEFAULT 'free',
    features JSONB DEFAULT '[]', -- ["seo_benefits", "customer_reviews", "analytics", ...]
    
    -- Contact and Support
    contact_info JSONB DEFAULT '{}', -- {email: "", requirements: "", notes: ""}
    
    -- Status and Timestamps
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata for extensibility
    metadata JSONB DEFAULT '{}' -- Custom fields for future enhancements
);

-- Create strategic indexes for performance
CREATE INDEX IF NOT EXISTS idx_directories_name ON directories(name);
CREATE INDEX IF NOT EXISTS idx_directories_website ON directories(website);
CREATE INDEX IF NOT EXISTS idx_directories_category ON directories(category_id);
CREATE INDEX IF NOT EXISTS idx_directories_da_score ON directories(da_score DESC);
CREATE INDEX IF NOT EXISTS idx_directories_priority_tier ON directories(priority_tier);
CREATE INDEX IF NOT EXISTS idx_directories_success_rate ON directories(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_directories_active ON directories(is_active);
CREATE INDEX IF NOT EXISTS idx_directories_category_active ON directories(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_directories_da_active ON directories(da_score DESC, is_active);
CREATE INDEX IF NOT EXISTS idx_directories_pricing ON directories(pricing_model);
CREATE INDEX IF NOT EXISTS idx_directories_difficulty ON directories(submission_difficulty);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_directories_category_da_active ON directories(category_id, da_score DESC, is_active);
CREATE INDEX IF NOT EXISTS idx_directories_tier_success ON directories(priority_tier, success_rate DESC);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_directories_business_types_gin ON directories USING GIN (business_types);
CREATE INDEX IF NOT EXISTS idx_directories_features_gin ON directories USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_directories_form_fields_gin ON directories USING GIN (form_fields);

-- Create trigger for updated_at
CREATE TRIGGER update_directories_updated_at 
    BEFORE UPDATE ON directories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comprehensive comments
COMMENT ON TABLE directories IS 'Comprehensive directory management with detailed metadata for 220+ directories';
COMMENT ON COLUMN directories.name IS 'Directory display name (must be unique)';
COMMENT ON COLUMN directories.website IS 'Directory main website URL';
COMMENT ON COLUMN directories.category_id IS 'Reference to categories table';
COMMENT ON COLUMN directories.da_score IS 'Domain Authority score (1-100, higher is better)';
COMMENT ON COLUMN directories.priority_tier IS 'Directory priority based on DA and relevance (High/Medium/Low)';
COMMENT ON COLUMN directories.success_rate IS 'Historical submission success rate (0.0-1.0)';
COMMENT ON COLUMN directories.description IS 'Directory description and value proposition';
COMMENT ON COLUMN directories.submission_requirements IS 'JSON object with submission requirements';
COMMENT ON COLUMN directories.form_fields IS 'JSON array of required form fields with validation';
COMMENT ON COLUMN directories.average_approval_time IS 'Average approval time in days';
COMMENT ON COLUMN directories.submission_difficulty IS 'Difficulty rating (1=easiest, 5=hardest)';
COMMENT ON COLUMN directories.business_types IS 'JSON array of compatible business types';
COMMENT ON COLUMN directories.pricing_model IS 'Directory pricing model (free/paid/freemium)';
COMMENT ON COLUMN directories.features IS 'JSON array of directory features and benefits';
COMMENT ON COLUMN directories.contact_info IS 'JSON object with contact and support information';
COMMENT ON COLUMN directories.is_active IS 'Whether directory is currently active and accepting submissions';
COMMENT ON COLUMN directories.last_verified IS 'Last time directory information was verified';
COMMENT ON COLUMN directories.metadata IS 'Additional metadata for future enhancements';