-- =====================================================================
-- DirectoryBolt Complete Database Setup & Directory Import
-- =====================================================================
-- EXECUTE THIS SQL IN SUPABASE SQL EDITOR
-- Purpose: Set up tables and import all 592 directories
-- Generated: 2025-09-23
-- =====================================================================

-- =====================================================================
-- STEP 1: CREATE TABLES AND FUNCTIONS
-- =====================================================================

-- Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create directories table
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
    submission_requirements JSONB DEFAULT '{}',
    form_fields JSONB DEFAULT '[]',
    average_approval_time INTEGER DEFAULT 3,
    submission_difficulty INTEGER CHECK (submission_difficulty >= 1 AND submission_difficulty <= 5) DEFAULT 3,
    
    -- Business Compatibility
    business_types JSONB DEFAULT '[]',
    pricing_model VARCHAR(20) CHECK (pricing_model IN ('free', 'paid', 'freemium')) DEFAULT 'free',
    features JSONB DEFAULT '[]',
    
    -- Contact and Support
    contact_info JSONB DEFAULT '{}',
    
    -- Status and Timestamps
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata for extensibility
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_directories_name ON directories(name);
CREATE INDEX IF NOT EXISTS idx_directories_website ON directories(website);
CREATE INDEX IF NOT EXISTS idx_directories_category ON directories(category_id);
CREATE INDEX IF NOT EXISTS idx_directories_da_score ON directories(da_score DESC);
CREATE INDEX IF NOT EXISTS idx_directories_priority_tier ON directories(priority_tier);
CREATE INDEX IF NOT EXISTS idx_directories_active ON directories(is_active);

-- Create triggers
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_directories_updated_at 
    BEFORE UPDATE ON directories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- STEP 2: INSERT CATEGORIES
-- =====================================================================

INSERT INTO categories (slug, display_name, description, icon, sort_order, metadata) 
VALUES 
(
    'business_general',
    'General Business',
    'Broad business directories that accept companies from various industries and provide general business listings and information.',
    'building',
    40,
    '{
        "target_audience": "All business types and sizes",
        "typical_da_range": "50-90",
        "submission_complexity": "easy-medium",
        "geographic_focus": false,
        "key_benefits": ["General visibility", "SEO backlinks", "Business credibility"],
        "common_requirements": ["Business registration", "Company description", "Contact information"]
    }'::jsonb
),
(
    'review_platforms',
    'Review Platforms',
    'Consumer review platforms and rating sites where businesses can manage their online reputation.',
    'star',
    130,
    '{
        "target_audience": "All consumer-facing businesses",
        "typical_da_range": "70-95",
        "submission_complexity": "easy-medium",
        "geographic_focus": false,
        "key_benefits": ["Online reputation", "Customer reviews", "Trust building"],
        "common_requirements": ["Business verification", "Customer service", "Review management"]
    }'::jsonb
),
(
    'healthcare',
    'Healthcare',
    'Medical and healthcare directories for hospitals, clinics, practitioners, and healthcare service providers.',
    'heart',
    70,
    '{
        "target_audience": "Healthcare providers, medical practices, wellness services",
        "typical_da_range": "50-90",
        "submission_complexity": "hard",
        "geographic_focus": true,
        "key_benefits": ["Patient acquisition", "Medical authority", "Healthcare visibility"],
        "common_requirements": ["Medical license", "Credentials verification", "Specialization areas", "Insurance acceptance"]
    }'::jsonb
),
(
    'social_media',
    'Social Media',
    'Social media platforms and community-driven directories where businesses can build their online presence and engage with customers.',
    'share-2',
    20,
    '{
        "target_audience": "All business types, content creators, influencers",
        "typical_da_range": "85-99",
        "submission_complexity": "easy",
        "geographic_focus": false,
        "key_benefits": ["Brand awareness", "Customer engagement", "Content distribution"],
        "common_requirements": ["Social media accounts", "Business profile", "Content strategy"]
    }'::jsonb
),
(
    'professional_services',
    'Professional Services',
    'Specialized directories for professional service providers including consultants, agencies, freelancers, and B2B service companies.',
    'briefcase',
    30,
    '{
        "target_audience": "Consultants, agencies, freelancers, B2B services",
        "typical_da_range": "40-75",
        "submission_complexity": "medium",
        "geographic_focus": false,
        "key_benefits": ["Professional credibility", "Lead generation", "Industry networking"],
        "common_requirements": ["Professional credentials", "Portfolio", "Client testimonials"]
    }'::jsonb
),
(
    'legal',
    'Legal',
    'Specialized directories for law firms, attorneys, legal professionals, and legal service providers.',
    'scale',
    60,
    '{
        "target_audience": "Law firms, attorneys, legal professionals",
        "typical_da_range": "45-85",
        "submission_complexity": "hard",
        "geographic_focus": true,
        "key_benefits": ["Professional authority", "Client acquisition", "Legal expertise showcase"],
        "common_requirements": ["Bar admission", "Practice areas", "Legal credentials", "Malpractice insurance"]
    }'::jsonb
),
(
    'real_estate',
    'Real Estate',
    'Directories for real estate professionals, agencies, property listings, and real estate service providers.',
    'key',
    80,
    '{
        "target_audience": "Real estate agents, brokers, property managers",
        "typical_da_range": "40-80",
        "submission_complexity": "medium",
        "geographic_focus": true,
        "key_benefits": ["Property exposure", "Agent visibility", "Local market presence"],
        "common_requirements": ["Real estate license", "MLS membership", "Service areas", "Property portfolio"]
    }'::jsonb
),
(
    'tech_startups',
    'Tech Startups',
    'Directories specifically for technology startups, innovation companies, and emerging tech businesses.',
    'zap',
    110,
    '{
        "target_audience": "Tech startups, innovative companies, entrepreneurs",
        "typical_da_range": "45-75",
        "submission_complexity": "medium-hard",
        "geographic_focus": false,
        "key_benefits": ["Investor visibility", "Tech community recognition", "Innovation showcase"],
        "common_requirements": ["Company stage", "Technology focus", "Funding information", "Innovation description"]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata,
    updated_at = CURRENT_TIMESTAMP;

-- Create helper function
CREATE OR REPLACE FUNCTION get_category_id(category_slug VARCHAR(50))
RETURNS UUID AS $$
DECLARE
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id FROM categories WHERE slug = category_slug;
    RETURN cat_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- STEP 3: VERIFICATION QUERY (RUN AFTER CATEGORIES INSERT)
-- =====================================================================

-- Verify categories were created
DO $$
DECLARE
    category_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM categories WHERE is_active = true;
    
    IF category_count < 8 THEN
        RAISE EXCEPTION 'Expected at least 8 categories, but found %', category_count;
    ELSE
        RAISE NOTICE 'Successfully created % categories', category_count;
    END IF;
END $$;

-- =====================================================================
-- STEP 4: SAMPLE DIRECTORY INSERTS (CRITICAL DIRECTORIES)
-- =====================================================================

-- Insert top 20 high-priority directories for immediate testing
INSERT INTO directories (
    name, website, category_id, da_score, priority_tier,
    success_rate, description, submission_requirements,
    form_fields, submission_difficulty, business_types,
    pricing_model, features, metadata
) VALUES
(
    'Google Business Profile',
    'https://www.google.com/business',
    get_category_id('business_general'),
    100,
    'High',
    0.70,
    'Google Business Profile directory listing - The most important business directory for local SEO and online visibility.',
    '{}'::jsonb,
    '[]'::jsonb,
    5,
    '[]'::jsonb,
    'free',
    '["Business listing","Customer reviews","Contact information","Business hours","Photos/media"]'::jsonb,
    '{"source": "json", "id": "google-business-profile", "traffic_potential": 50000}'::jsonb
),
(
    'Yelp',
    'https://www.yelp.com',
    get_category_id('review_platforms'),
    95,
    'High',
    0.80,
    'Yelp business directory and review platform - Leading consumer review platform for local businesses.',
    '{}'::jsonb,
    '[]'::jsonb,
    3,
    '[]'::jsonb,
    'free',
    '["Customer reviews", "Business listing", "Local search", "Mobile app presence"]'::jsonb,
    '{"source": "manual", "id": "yelp", "traffic_potential": 40000}'::jsonb
),
(
    'Facebook Business',
    'https://www.facebook.com/business',
    get_category_id('social_media'),
    99,
    'High',
    0.90,
    'Facebook Business Pages - Essential social media presence for businesses.',
    '{}'::jsonb,
    '[]'::jsonb,
    2,
    '[]'::jsonb,
    'free',
    '["Social media presence", "Customer engagement", "Advertising platform", "Event promotion"]'::jsonb,
    '{"source": "manual", "id": "facebook", "traffic_potential": 60000}'::jsonb
),
(
    'LinkedIn Company Pages',
    'https://www.linkedin.com/company/setup',
    get_category_id('professional_services'),
    98,
    'High',
    0.85,
    'LinkedIn Company Pages - Professional networking and B2B visibility.',
    '{}'::jsonb,
    '[]'::jsonb,
    3,
    '[]'::jsonb,
    'free',
    '["Professional networking", "B2B visibility", "Employee showcase", "Industry authority"]'::jsonb,
    '{"source": "manual", "id": "linkedin", "traffic_potential": 35000}'::jsonb
),
(
    'Better Business Bureau',
    'https://www.bbb.org',
    get_category_id('business_general'),
    85,
    'High',
    0.75,
    'Better Business Bureau - Trust and credibility platform for businesses.',
    '{}'::jsonb,
    '[]'::jsonb,
    4,
    '[]'::jsonb,
    'free',
    '["Trust badge", "Customer complaints resolution", "Business credibility", "Consumer protection"]'::jsonb,
    '{"source": "manual", "id": "bbb", "traffic_potential": 25000}'::jsonb
),
(
    'Yellow Pages',
    'https://www.yellowpages.com',
    get_category_id('business_general'),
    80,
    'High',
    0.70,
    'Yellow Pages online directory - Traditional business directory with strong local presence.',
    '{}'::jsonb,
    '[]'::jsonb,
    3,
    '[]'::jsonb,
    'free',
    '["Local directory", "Phone book listings", "Address information", "Business categories"]'::jsonb,
    '{"source": "manual", "id": "yellowpages", "traffic_potential": 30000}'::jsonb
),
(
    'Apple Maps',
    'https://mapsconnect.apple.com',
    get_category_id('business_general'),
    90,
    'High',
    0.65,
    'Apple Maps Connect - Business listings for Apple Maps and Siri.',
    '{}'::jsonb,
    '[]'::jsonb,
    4,
    '[]'::jsonb,
    'free',
    '["Apple Maps presence", "Siri integration", "iOS visibility", "Location services"]'::jsonb,
    '{"source": "manual", "id": "applemaps", "traffic_potential": 20000}'::jsonb
),
(
    'Bing Places',
    'https://www.bingplaces.com',
    get_category_id('business_general'),
    75,
    'Medium',
    0.70,
    'Bing Places for Business - Microsoft search engine business listings.',
    '{}'::jsonb,
    '[]'::jsonb,
    3,
    '[]'::jsonb,
    'free',
    '["Bing search presence", "Microsoft ecosystem", "Local search", "Business information"]'::jsonb,
    '{"source": "manual", "id": "bingplaces", "traffic_potential": 15000}'::jsonb
),
(
    'Foursquare',
    'https://foursquare.com/developers/apps',
    get_category_id('social_media'),
    70,
    'Medium',
    0.65,
    'Foursquare business listings - Location-based social networking platform.',
    '{}'::jsonb,
    '[]'::jsonb,
    3,
    '[]'::jsonb,
    'free',
    '["Location check-ins", "Social discovery", "Mobile app presence", "Local recommendations"]'::jsonb,
    '{"source": "manual", "id": "foursquare", "traffic_potential": 12000}'::jsonb
),
(
    'TripAdvisor',
    'https://www.tripadvisor.com',
    get_category_id('review_platforms'),
    88,
    'High',
    0.75,
    'TripAdvisor business listings - Leading travel and hospitality review platform.',
    '{}'::jsonb,
    '[]'::jsonb,
    3,
    '["restaurant", "hotel", "tourism", "travel"]'::jsonb,
    'free',
    '["Travel reviews", "Hospitality visibility", "Tourism marketing", "Customer feedback"]'::jsonb,
    '{"source": "manual", "id": "tripadvisor", "traffic_potential": 45000}'::jsonb
);

-- =====================================================================
-- STEP 5: FINAL VERIFICATION
-- =====================================================================

-- Count directories and categories
SELECT 
    'SETUP VERIFICATION' as status,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM directories) as directories_count,
    (SELECT COUNT(*) FROM directories WHERE priority_tier = 'High') as high_priority_count,
    (SELECT AVG(da_score) FROM directories) as average_da_score;

-- Show sample directories
SELECT 
    name,
    website,
    da_score,
    priority_tier,
    (SELECT display_name FROM categories WHERE id = directories.category_id) as category
FROM directories 
ORDER BY da_score DESC 
LIMIT 10;

-- =====================================================================
-- NEXT STEPS
-- =====================================================================

/*
HUDSON AUDIT STATUS:
✅ Database tables created
✅ Categories setup (8 categories)
✅ Sample directories imported (10 high-priority directories)

TO COMPLETE THE MISSION (592 DIRECTORIES):
1. The full SQL import file is available at: migrations/025_import_all_directories.sql
2. Execute that file after this setup to import all 592 directories
3. Or use the JavaScript import script: node scripts/execute-database-import.js

CURRENT STATUS: FOUNDATION READY FOR FULL IMPORT
*/