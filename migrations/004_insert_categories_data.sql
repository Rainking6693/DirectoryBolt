-- Migration: Insert Categories Data
-- Purpose: Populate the categories table with the 13 directory categories
-- Date: 2025-08-31

-- Insert the 13 categories with comprehensive metadata
INSERT INTO categories (slug, display_name, description, icon, sort_order, metadata) 
VALUES 
(
    'local_business',
    'Local Business',
    'Directories focused on local businesses, community services, and geographic-specific listings that help businesses connect with their local customers.',
    'map-pin',
    10,
    '{
        "target_audience": "Local businesses, service providers, brick-and-mortar stores",
        "typical_da_range": "30-80",
        "submission_complexity": "easy-medium",
        "geographic_focus": true,
        "key_benefits": ["Local SEO", "Community visibility", "Geographic targeting"],
        "common_requirements": ["Business address", "Local phone number", "Service area"]
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
    'home_services',
    'Home Services',
    'Directories specifically designed for home improvement, maintenance, and residential service providers.',
    'home',
    50,
    '{
        "target_audience": "Contractors, home improvement, maintenance services",
        "typical_da_range": "35-70",
        "submission_complexity": "medium",
        "geographic_focus": true,
        "key_benefits": ["Homeowner leads", "Local visibility", "Service area targeting"],
        "common_requirements": ["License verification", "Insurance proof", "Service area definition"]
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
    'restaurants',
    'Restaurants',
    'Food service directories including restaurants, cafes, catering, and food delivery services.',
    'utensils',
    90,
    '{
        "target_audience": "Restaurants, cafes, food service, catering",
        "typical_da_range": "60-95",
        "submission_complexity": "easy-medium",
        "geographic_focus": true,
        "key_benefits": ["Customer discovery", "Online ordering", "Review visibility"],
        "common_requirements": ["Menu information", "Location details", "Operating hours", "Health permits"]
    }'::jsonb
),
(
    'saas',
    'SaaS',
    'Software-as-a-Service directories showcasing software products, tools, and digital solutions.',
    'monitor',
    100,
    '{
        "target_audience": "SaaS companies, software developers, tech startups",
        "typical_da_range": "55-85",
        "submission_complexity": "medium",
        "geographic_focus": false,
        "key_benefits": ["Product discovery", "Tech community exposure", "Software marketplace presence"],
        "common_requirements": ["Product demo", "Pricing information", "Feature descriptions", "User testimonials"]
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
),
(
    'finance',
    'Finance',
    'Financial services directories for banks, credit unions, financial advisors, and fintech companies.',
    'dollar-sign',
    120,
    '{
        "target_audience": "Financial services, banks, advisors, fintech",
        "typical_da_range": "60-90",
        "submission_complexity": "hard",
        "geographic_focus": false,
        "key_benefits": ["Financial authority", "Client trust", "Regulatory compliance showcase"],
        "common_requirements": ["Financial licenses", "Regulatory compliance", "Service descriptions", "Fee structures"]
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
)
ON CONFLICT (slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata,
    updated_at = CURRENT_TIMESTAMP;

-- Create function to get category by slug for easy reference
CREATE OR REPLACE FUNCTION get_category_id(category_slug VARCHAR(50))
RETURNS UUID AS $$
DECLARE
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id FROM categories WHERE slug = category_slug;
    RETURN cat_id;
END;
$$ LANGUAGE plpgsql;

-- Verify all categories were inserted
DO $$
DECLARE
    category_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM categories WHERE is_active = true;
    
    IF category_count != 13 THEN
        RAISE EXCEPTION 'Expected 13 categories, but found %', category_count;
    ELSE
        RAISE NOTICE 'Successfully inserted all 13 categories';
    END IF;
END $$;