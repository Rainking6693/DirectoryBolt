-- Migration: Create Categories Table
-- Purpose: Normalized category system for directory classification
-- Date: 2025-08-31

-- Create categories table with comprehensive structure
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- Icon class or SVG path
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}', -- Additional category metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE categories IS 'Directory categories for classification and filtering';
COMMENT ON COLUMN categories.slug IS 'URL-friendly category identifier';
COMMENT ON COLUMN categories.display_name IS 'Human-readable category name';
COMMENT ON COLUMN categories.description IS 'Detailed category description for users';
COMMENT ON COLUMN categories.icon IS 'Icon class or SVG path for UI display';
COMMENT ON COLUMN categories.sort_order IS 'Display ordering (lower = higher priority)';
COMMENT ON COLUMN categories.metadata IS 'Additional category-specific data as JSON';