-- Migration: Create Excel-Compatible Directories Table
-- Purpose: Create directories table that matches Excel import script expectations
-- Date: 2025-09-01
-- This replaces the complex existing schema with a simple schema matching Excel import requirements

-- Drop existing directories table if it exists (with CASCADE to handle dependencies)
DROP TABLE IF EXISTS directories CASCADE;

-- Create directories table matching Excel import script schema
CREATE TABLE directories (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core directory information (from Excel)
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    domain_authority INTEGER DEFAULT 50 CHECK (domain_authority >= 0 AND domain_authority <= 100),
    
    -- Additional fields expected by import script
    impact_level VARCHAR(20) DEFAULT 'Medium' CHECK (impact_level IN ('Low', 'Medium', 'High')),
    submission_url VARCHAR(500),
    tier_required INTEGER DEFAULT 3 CHECK (tier_required IN (1, 2, 3, 4)),
    difficulty VARCHAR(20) DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    active BOOLEAN NOT NULL DEFAULT true,
    estimated_traffic INTEGER DEFAULT 0,
    time_to_approval VARCHAR(50) DEFAULT '1-3 days',
    price INTEGER DEFAULT 0, -- in cents
    features JSONB DEFAULT '[]',
    requires_approval BOOLEAN DEFAULT true,
    country_code VARCHAR(2),
    language VARCHAR(10) DEFAULT 'en',
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_directories_name ON directories(name);
CREATE INDEX idx_directories_website ON directories(website);
CREATE INDEX idx_directories_category ON directories(category);
CREATE INDEX idx_directories_domain_authority_desc ON directories(domain_authority DESC);
CREATE INDEX idx_directories_tier_required ON directories(tier_required);
CREATE INDEX idx_directories_active ON directories(active);
CREATE INDEX idx_directories_impact_level ON directories(impact_level);
CREATE INDEX idx_directories_difficulty ON directories(difficulty);
CREATE INDEX idx_directories_category_active ON directories(category, active);
CREATE INDEX idx_directories_da_active ON directories(domain_authority DESC, active);

-- GIN index for JSONB features
CREATE INDEX idx_directories_features_gin ON directories USING GIN (features);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_directories_updated_at 
    BEFORE UPDATE ON directories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE directories IS 'Directory listings table compatible with Excel import script';
COMMENT ON COLUMN directories.id IS 'Primary key UUID, auto-generated';
COMMENT ON COLUMN directories.name IS 'Directory display name';
COMMENT ON COLUMN directories.website IS 'Directory website URL (must be unique)';
COMMENT ON COLUMN directories.category IS 'Directory category as text (mapped from Excel)';
COMMENT ON COLUMN directories.domain_authority IS 'Domain Authority score 0-100';
COMMENT ON COLUMN directories.impact_level IS 'Impact level: Low, Medium, High';
COMMENT ON COLUMN directories.submission_url IS 'URL for submitting listings to this directory';
COMMENT ON COLUMN directories.tier_required IS 'Required tier for access: 1-4';
COMMENT ON COLUMN directories.difficulty IS 'Submission difficulty: Easy, Medium, Hard';
COMMENT ON COLUMN directories.active IS 'Whether directory is active and accepting submissions';
COMMENT ON COLUMN directories.estimated_traffic IS 'Estimated monthly traffic';
COMMENT ON COLUMN directories.time_to_approval IS 'Expected approval time';
COMMENT ON COLUMN directories.price IS 'Directory listing price in cents';
COMMENT ON COLUMN directories.features IS 'JSON array of directory features';
COMMENT ON COLUMN directories.requires_approval IS 'Whether submissions require approval';
COMMENT ON COLUMN directories.country_code IS 'Country code for geo-specific directories';
COMMENT ON COLUMN directories.language IS 'Primary language of directory';
COMMENT ON COLUMN directories.description IS 'Directory description';

-- Insert some sample data for testing (optional)
INSERT INTO directories (name, website, category, domain_authority) VALUES 
('Google Business Profile', 'https://business.google.com', 'local_business', 100),
('Yelp Business', 'https://biz.yelp.com', 'local_business', 94),
('Product Hunt', 'https://producthunt.com', 'tech_startups', 91);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Excel-compatible directories table created successfully';
    RAISE NOTICE 'Schema matches Excel import script expectations';
    RAISE NOTICE 'Ready for importing 484 directories from Excel';
END $$;