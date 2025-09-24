-- DirectoryBolt Complete Directory Database
-- Total Directories: 543
-- Generated: 2025-09-24
-- Version: 6.0.0

-- Drop existing table
DROP TABLE IF EXISTS directories CASCADE;

-- Create directories table
CREATE TABLE directories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    submission_url VARCHAR(1000),
    category VARCHAR(100) NOT NULL,
    domain_authority INTEGER,
    difficulty VARCHAR(20),
    priority VARCHAR(20),
    traffic_potential INTEGER,
    tier VARCHAR(20),
    requires_registration BOOLEAN,
    approval_time VARCHAR(100),
    submission_type VARCHAR(50),
    field_mapping JSONB,
    is_active BOOLEAN DEFAULT true,
    last_verified TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_directories_category ON directories(category);
CREATE INDEX idx_directories_tier ON directories(tier);
CREATE INDEX idx_directories_difficulty ON directories(difficulty);
CREATE INDEX idx_directories_domain_authority ON directories(domain_authority);
CREATE INDEX idx_directories_is_active ON directories(is_active);

-- Insert all directories

INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'google-business-profile',
    'Google Business Profile',
    'https://www.google.com/business',
    'https://www.google.com/business/submit',
    'general-directory',
    100,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tech-time',
    'Tech | Time',
    'https://time.com/section/tech',
    'https://time.com/section/tech/submit',
    'general-directory',
    94,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'huffingtonpost',
    'Huffingtonpost',
    'http://www.huffingtonpost.com',
    'http://www.huffingtonpost.com/submit',
    'general-directory',
    94,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'forbes-technology',
    'Forbes Technology',
    'http://www.forbes.com/technology',
    'http://www.forbes.com/technology/submit',
    'general-directory',
    94,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'guardian-technology',
    'Guardian Technology',
    'http://www.theguardian.com/uk/technology',
    'http://www.theguardian.com/uk/technology/submit',
    'general-directory',
    94,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'huffpost',
    'HuffPost',
    'https://www.huffpost.com',
    'https://www.huffpost.com/submit',
    'general-directory',
    94,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'sourceforge',
    'SourceForge',
    'https://sourceforge.net/software/vendors/new',
    'https://sourceforge.net/software/vendors/new/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'the-verge',
    'The Verge',
    'https://www.theverge.com',
    'https://www.theverge.com/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'the-wall-street-journal',
    'The Wall Street Journal',
    'https://www.wsj.com',
    'https://www.wsj.com/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'mashable',
    'Mashable',
    'http://mashable.com',
    'http://mashable.com/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'mashable-india',
    'Mashable India',
    'https://in.mashable.com',
    'https://in.mashable.com/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cnet',
    'CNET',
    'https://www.cnet.com/news',
    'https://www.cnet.com/news/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'engadget',
    'Engadget',
    'http://www.engadget.com',
    'http://www.engadget.com/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'gizmodo',
    'Gizmodo',
    'http://www.gizmodo.com',
    'http://www.gizmodo.com/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'psychology-today',
    'Psychology Today',
    'https://www.psychologytoday.com/us',
    'https://www.psychologytoday.com/us/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techcrunch',
    'TechCrunch',
    'https://techcrunch.com',
    'https://techcrunch.com/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'wired',
    'Wired',
    'http://www.wired.com',
    'http://www.wired.com/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'quora',
    'Quora',
    'https://www.quora.com',
    'https://www.quora.com/submit',
    'general-directory',
    93,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'behance',
    'Behance',
    'http://behance.net',
    'http://behance.net/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'dribbble',
    'Dribbble',
    'https://dribbble.com',
    'https://dribbble.com/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'slide-share',
    'Slide Share',
    'https://www.slideshare.net',
    'https://www.slideshare.net/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'source-forge',
    'Source Forge',
    'https://sourceforge.net',
    'https://sourceforge.net/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'softonic',
    'Softonic',
    'https://en.softonic.com/android',
    'https://en.softonic.com/android/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'bostinno-startups-tech-news-and-events',
    'BostInno Startups, Tech News and Events',
    'https://bizjournals.com',
    'https://bizjournals.com/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'digg',
    'Digg',
    'https://digg.com',
    'https://digg.com/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'entrepreneur',
    'Entrepreneur',
    'https://Entrepreneur.com',
    'https://Entrepreneur.com/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'fast-company',
    'Fast Company',
    'https://www.fastcompany.com',
    'https://www.fastcompany.com/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'fastcompany',
    'Fastcompany',
    'http://www.fastcompany.com',
    'http://www.fastcompany.com/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'pcmag',
    'PCMag',
    'https://www.pcmag.com',
    'https://www.pcmag.com/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'slate',
    'Slate',
    'https://slate.com/pitch',
    'https://slate.com/pitch/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'about-me',
    'about me',
    'https://about.me',
    'https://about.me/submit',
    'general-directory',
    92,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'producthunt',
    'ProductHunt',
    'https://producthunt.com',
    'https://producthunt.com/submit',
    'general-directory',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'crunchbase',
    'Crunchbase',
    'https://crunchbase.com',
    'https://crunchbase.com/submit',
    'general-directory',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'getapp',
    'GetApp',
    'https://www.gartner.com/en/digital-markets/basic-listing',
    'https://www.gartner.com/en/digital-markets/basic-listing/submit',
    'general-directory',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'mit-technology-review',
    'MIT Technology Review',
    'https://www.technologyreview.com',
    'https://www.technologyreview.com/submit',
    'review-platform',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'android-authority',
    'Android Authority',
    'https://androidauthority.com',
    'https://androidauthority.com/submit',
    'general-directory',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'android-central',
    'Android Central',
    'https://www.androidcentral.com',
    'https://www.androidcentral.com/submit',
    'general-directory',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'healthline',
    'Healthline',
    'https://healthline.com',
    'https://healthline.com/submit',
    'healthcare',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'inc-magazine',
    'Inc. Magazine',
    'https://www.inc.com',
    'https://www.inc.com/submit',
    'general-directory',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'pc-world',
    'PC World',
    'https://www.pcworld.com',
    'https://www.pcworld.com/submit',
    'general-directory',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'venture-beat',
    'Venture Beat',
    'https://venturebeat.com',
    'https://venturebeat.com/submit',
    'general-directory',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'stripe',
    'Stripe',
    'https://stripe.com/en-in/partner-proqram',
    'https://stripe.com/en-in/partner-proqram/submit',
    'general-directory',
    91,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'business-insider-india',
    'Business Insider India',
    'https://www.businessinsider.in',
    'https://www.businessinsider.in/submit',
    'general-directory',
    90,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'make-use-of',
    'Make Use of',
    'https://www.makeuseof.com/contributor',
    'https://www.makeuseof.com/contributor/submit',
    'general-directory',
    90,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'makeuseof',
    'MakeUseOf',
    'http://www.makeuseof.com',
    'http://www.makeuseof.com/submit',
    'general-directory',
    90,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'artstation',
    'ArtStation',
    'https://www.artstation.com',
    'https://www.artstation.com/submit',
    'general-directory',
    89,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'atlassian',
    'Atlassian',
    'https://www.atlassian.com/blog/trello/trello-collection-atlassian-community',
    'https://www.atlassian.com/blog/trello/trello-collection-atlassian-community/submit',
    'general-directory',
    89,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'hackernews',
    'HackerNews',
    'https://news.ycombinator.com/showhn.html',
    'https://news.ycombinator.com/showhn.html/submit',
    'general-directory',
    89,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'hacker-news',
    'Hacker News',
    'https://news.ycombinator.com',
    'https://news.ycombinator.com/submit',
    'general-directory',
    89,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'smashing-magazine',
    'Smashing Magazine',
    'https://www.smashingmagazine.com',
    'https://www.smashingmagazine.com/submit',
    'general-directory',
    89,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'the-register-uk',
    'The Register UK',
    'http://www.theregister.co.uk',
    'http://www.theregister.co.uk/submit',
    'general-directory',
    89,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'geekwire',
    'Geekwire',
    'https://Geekwire.com',
    'https://Geekwire.com/submit',
    'general-directory',
    88,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tech-in-asia',
    'Tech in Asia',
    'https://www.techinasia.com/companies/create',
    'https://www.techinasia.com/companies/create/submit',
    'general-directory',
    88,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'freecodecamp',
    'FreeCodeCamp',
    'https://forum.freecodecamp.org',
    'https://forum.freecodecamp.org/submit',
    'general-directory',
    88,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techrepublic',
    'TechRepublic',
    'https://www.techrepublic.com',
    'https://www.techrepublic.com/submit',
    'general-directory',
    88,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'hackernoon',
    'HackerNoon',
    'https://hackernoon.com',
    'https://hackernoon.com/submit',
    'general-directory',
    88,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'alternativeto',
    'AlternativeTo',
    'http://alternativeto.net',
    'http://alternativeto.net/submit',
    'general-directory',
    87,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'sitepoint-forums',
    'SitePoint Forums',
    'https://www.sitepoint.com/community',
    'https://www.sitepoint.com/community/submit',
    'general-directory',
    86,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'yourstory',
    'YourStory',
    'https://yourstory.com',
    'https://yourstory.com/submit',
    'general-directory',
    86,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'infoworld',
    'InfoWorld',
    'https://www.infoworld.com',
    'https://www.infoworld.com/submit',
    'general-directory',
    86,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'instapaper',
    'InstaPaper',
    'https://www.instapaper.com',
    'https://www.instapaper.com/submit',
    'general-directory',
    85,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'goodfirms',
    'GoodFirms',
    'https://www.goodfirms.co',
    'https://www.goodfirms.co/submit',
    'general-directory',
    85,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'addictive-tips',
    'Addictive Tips',
    'https://www.addictivetips.com/tip-us',
    'https://www.addictivetips.com/tip-us/submit',
    'general-directory',
    85,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'android-headlines',
    'Android Headlines',
    'https://www.androidheadlines.com',
    'https://www.androidheadlines.com/submit',
    'general-directory',
    85,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'siliconangle',
    'SiliconANGLE',
    'https://siliconangle.com',
    'https://siliconangle.com/submit',
    'general-directory',
    85,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'towards-data-science',
    'Towards Data Science',
    'https://towardsdatascience.com',
    'https://towardsdatascience.com/submit',
    'general-directory',
    85,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'dev-community',
    'DEV Community',
    'http://dev.to',
    'http://dev.to/submit',
    'social-platform',
    84,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'devpost',
    'Devpost',
    'https://devpost.com/software',
    'https://devpost.com/software/submit',
    'general-directory',
    84,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'get-app',
    'Get App',
    'https://www.getapp.com',
    'https://www.getapp.com/submit',
    'general-directory',
    84,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'codeproject',
    'CodeProject',
    'https://www.codeproject.com',
    'https://www.codeproject.com/submit',
    'general-directory',
    84,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'mac-stories',
    'Mac Stories',
    'http://www.macstories.net',
    'http://www.macstories.net/submit',
    'general-directory',
    82,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tech-co',
    'Tech.co',
    'https://tech.co',
    'https://tech.co/submit',
    'general-directory',
    82,
    'hard',
    'high',
    20000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'media-index-kochava',
    'Media Index Kochava',
    'https://media-index.kochava.com',
    'https://media-index.kochava.com/submit',
    'general-directory',
    80,
    'hard',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'g2',
    'G2',
    'http://g2.com/products/new',
    'http://g2.com/products/new/submit',
    'general-directory',
    80,
    'hard',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'read-cv',
    'Read .cv',
    'http://read.cv',
    'http://read.cv/submit',
    'general-directory',
    80,
    'hard',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'biggerpockets-com',
    'Biggerpockets.com',
    'https://Biggerpockets.com',
    'https://Biggerpockets.com/submit',
    'general-directory',
    79,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'solo-to',
    'solo to',
    'https://solo.to',
    'https://solo.to/submit',
    'general-directory',
    78,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'activesearch',
    'ActiveSearch',
    'https://www.activesearchresults.com',
    'https://www.activesearchresults.com/submit',
    'general-directory',
    78,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'webwiki',
    'WebWiki',
    'https://www.webwiki.com/info/add-website.html',
    'https://www.webwiki.com/info/add-website.html/submit',
    'general-directory',
    78,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'inc42',
    'Inc42',
    'https://inc42.com/startup-submission',
    'https://inc42.com/startup-submission/submit',
    'general-directory',
    78,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'g2crowd-com',
    'G2crowd.com',
    'https://g2.com',
    'https://g2.com/submit',
    'general-directory',
    77,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'e27',
    'e27',
    'https://e27.co',
    'https://e27.co/submit',
    'general-directory',
    77,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'aapsense',
    'Aapsense',
    'https://www.apsense.com',
    'https://www.apsense.com/submit',
    'general-directory',
    76,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'dealroom',
    'DealRoom',
    'https://app.dealroom.co/companies/fintern',
    'https://app.dealroom.co/companies/fintern/submit',
    'general-directory',
    76,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-digest-more-than-just-a-newsletter-techstars',
    'Startup Digest: More Than Just a Newsletter | Techstars',
    'https://www.techstars.com/communities/startup-digest',
    'https://www.techstars.com/communities/startup-digest/submit',
    'general-directory',
    76,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'getting-smart',
    'Getting Smart',
    'https://www.gettingsmart.com',
    'https://www.gettingsmart.com/submit',
    'general-directory',
    75,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'software-world',
    'Software World',
    'https://www.softwareworld.co',
    'https://www.softwareworld.co/submit',
    'general-directory',
    74,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'sitejabber',
    'Sitejabber',
    'https://www.sitejabber.com',
    'https://www.sitejabber.com/submit',
    'general-directory',
    74,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'alternative-me',
    'Alternative Me',
    'https://alternative.me',
    'https://alternative.me/submit',
    'general-directory',
    73,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'alternative-to',
    'Alternative To',
    'https://alternativeto.net',
    'https://alternativeto.net/submit',
    'general-directory',
    73,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'vccircle',
    'Vccircle',
    'https://www.vccircle.com/company/directory',
    'https://www.vccircle.com/company/directory/submit',
    'general-directory',
    73,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'babel-slack',
    'Babel Slack',
    'https://slack.babeljs.io',
    'https://slack.babeljs.io/submit',
    'general-directory',
    73,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'f6s',
    'F6S',
    'https://www.f6s.com',
    'https://www.f6s.com/submit',
    'general-directory',
    72,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'all-top-startups',
    'All top startups',
    'http://alltopstartups.com/submit-startup',
    'http://alltopstartups.com/submit-startup/submit',
    'general-directory',
    72,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'alltopstartups',
    'AllTopStartups',
    'https://alltopstartups.com',
    'https://alltopstartups.com/submit',
    'general-directory',
    72,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'financesonline-com',
    'FinancesOnline.com',
    'https://FinancesOnline.com',
    'https://FinancesOnline.com/submit',
    'general-directory',
    72,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'vator',
    'Vator',
    'https://vator.tv',
    'https://vator.tv/submit',
    'general-directory',
    72,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'crowd-reviews',
    'Crowd Reviews',
    'http://crowdreviews.com',
    'http://crowdreviews.com/submit',
    'review-platform',
    71,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'software-review',
    'Software Review',
    'https://provider.softwarereviews.com',
    'https://provider.softwarereviews.com/submit',
    'review-platform',
    71,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'eu-tech',
    'EU Tech',
    'https://tech.eu',
    'https://tech.eu/submit',
    'general-directory',
    71,
    'medium',
    'high',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'libhunt',
    'Libhunt',
    'https://www.libhunt.com',
    'https://www.libhunt.com/submit',
    'general-directory',
    70,
    'medium',
    'medium',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'built-in-chicago',
    'Built in Chicago',
    'https://www.builtinchicago.org/contact/send_us_tip',
    'https://www.builtinchicago.org/contact/send_us_tip/submit',
    'general-directory',
    70,
    'medium',
    'medium',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cloud-native-computing-foundation',
    'Cloud Native Computing Foundation',
    'https://slack.cncf.io',
    'https://slack.cncf.io/submit',
    'general-directory',
    70,
    'medium',
    'medium',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'trustradius',
    'TrustRadius',
    'http://trustradius.com',
    'http://trustradius.com/submit',
    'general-directory',
    70,
    'medium',
    'medium',
    20000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startups-uk',
    'Startups UK',
    'https://startups.co.uk',
    'https://startups.co.uk/submit',
    'general-directory',
    69,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'all-top',
    'All Top',
    'https://alltop.com',
    'https://alltop.com/submit',
    'general-directory',
    69,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tekpon',
    'Tekpon',
    'http://tekpon.com/get-listed',
    'http://tekpon.com/get-listed/submit',
    'general-directory',
    69,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'site-jabber',
    'Site Jabber',
    'https://sitejabber.com',
    'https://sitejabber.com/submit',
    'general-directory',
    68,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cool-mom-picks',
    'Cool mom picks',
    'https://coolmompicks.com',
    'https://coolmompicks.com/submit',
    'general-directory',
    67,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'dang',
    'Dang',
    'http://dang.ai/submit',
    'http://dang.ai/submit',
    'general-directory',
    67,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'eu-startups-database',
    'EU-Startups Database',
    'https://www.eu-startups.com/directory',
    'https://www.eu-startups.com/directory/submit',
    'general-directory',
    67,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'growth-hackers',
    'Growth hackers',
    'https://community.growthhackers.com',
    'https://community.growthhackers.com/submit',
    'general-directory',
    67,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startupranking',
    'StartupRanking',
    'https://www.startupranking.com',
    'https://www.startupranking.com/submit',
    'general-directory',
    66,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'list-your-software-get-qualified-leads',
    'List Your Software & Get Qualified Leads',
    'https://www.softwareadvice.com/vendors',
    'https://www.softwareadvice.com/vendors/submit',
    'general-directory',
    66,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'springwise',
    'Springwise',
    'https://springwise.com',
    'https://springwise.com/submit',
    'general-directory',
    65,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-grind',
    'Startup Grind',
    'https://www.startupgrind.com',
    'https://www.startupgrind.com/submit',
    'general-directory',
    65,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'bunity',
    'Bunity',
    'https://www.bunity.com',
    'https://www.bunity.com/submit',
    'general-directory',
    64,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'foundr',
    'Foundr',
    'https://Foundr.com',
    'https://Foundr.com/submit',
    'general-directory',
    64,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saastr',
    'SaaStr',
    'https://www.saastr.com',
    'https://www.saastr.com/submit',
    'general-directory',
    63,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'unboxing-startups',
    'Unboxing Startups',
    'https://unboxingstartups.com/contact',
    'https://unboxingstartups.com/contact/submit',
    'general-directory',
    62,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tricky-enough',
    'Tricky Enough',
    'https://www.trickyenough.com',
    'https://www.trickyenough.com/submit',
    'general-directory',
    61,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'appsumo',
    'AppSumo',
    'https://sell.appsumo.com',
    'https://sell.appsumo.com/submit',
    'general-directory',
    61,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cloud-foundry',
    'Cloud Foundry',
    'https://slack.cloudfoundry.org',
    'https://slack.cloudfoundry.org/submit',
    'general-directory',
    61,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'technologyadvice',
    'TechnologyAdvice',
    'https://technologyadvice.com',
    'https://technologyadvice.com/submit',
    'general-directory',
    60,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'killerstartups',
    'Killerstartups',
    'https://killerstartups.com',
    'https://killerstartups.com/submit',
    'general-directory',
    60,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'betalist',
    'Betalist',
    'http://betalist.com',
    'http://betalist.com/submit',
    'general-directory',
    60,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'all-my-faves',
    'All my faves',
    'https://allmyfaves.com',
    'https://allmyfaves.com/submit',
    'general-directory',
    60,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'famous-ai-tools',
    'Famous AI Tools',
    'https://famousaitools.ai',
    'https://famousaitools.ai/submit',
    'general-directory',
    59,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startupxplore',
    'Startupxplore',
    'https://startupxplore.com/en/startups',
    'https://startupxplore.com/en/startups/submit',
    'general-directory',
    59,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'slant',
    'Slant',
    'http://slant.co',
    'http://slant.co/submit',
    'general-directory',
    58,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'uplabs',
    'Uplabs',
    'https://www.uplabs.com/submit',
    'https://www.uplabs.com/submit',
    'general-directory',
    58,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'makerlog',
    'Makerlog',
    'https://getmakerlog.com',
    'https://getmakerlog.com/submit',
    'general-directory',
    58,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'webrazzi',
    'Webrazzi',
    'http://webrazzi.com/en/startup-form',
    'http://webrazzi.com/en/startup-form/submit',
    'general-directory',
    58,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'people-ops-hr-community',
    'People Ops & HR Community',
    'https://lattice.com/community/rfh',
    'https://lattice.com/community/rfh/submit',
    'social-platform',
    58,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saas-tools',
    'SaaS Tools',
    'https://saasaitools.com',
    'https://saasaitools.com/submit',
    'general-directory',
    57,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'eu-startups',
    'EU startups',
    'https://eu-startups.com',
    'https://eu-startups.com/submit',
    'general-directory',
    57,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'hotfrog',
    'hotfrog',
    'https://www.hotfrog.com',
    'https://www.hotfrog.com/submit',
    'general-directory',
    57,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'slant-co',
    'Slant.co',
    'https://www.slant.co',
    'https://www.slant.co/submit',
    'general-directory',
    57,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'stackshare',
    'StackShare',
    'https://stackshare.io',
    'https://stackshare.io/submit',
    'general-directory',
    57,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'devhunt',
    'Devhunt',
    'https://devhunt.org',
    'https://devhunt.org/submit',
    'general-directory',
    56,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'mind-the-product',
    'Mind the product',
    'http://slack.mindtheproduct.com',
    'http://slack.mindtheproduct.com/submit',
    'general-directory',
    56,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'data-quest',
    'Data Quest',
    'https://www.dataquest.io/chat',
    'https://www.dataquest.io/chat/submit',
    'general-directory',
    56,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'all-software-categories-goodfirms',
    'All Software Categories - GoodFirms',
    'https://www.goodfirms.co/directories/software',
    'https://www.goodfirms.co/directories/software/submit',
    'general-directory',
    55,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'wip',
    'WIP',
    'http://wip.co/projects/new',
    'http://wip.co/projects/new/submit',
    'general-directory',
    55,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tech-directory',
    'Tech directory',
    'http://techdirectory.io/get-listed',
    'http://techdirectory.io/get-listed/submit',
    'general-directory',
    55,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'nextbigwhat',
    'NextBigWhat',
    'https://nextbigwhat.com',
    'https://nextbigwhat.com/submit',
    'general-directory',
    55,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'wp-newsify',
    'WP Newsify',
    'https://wpnewsify.com',
    'https://wpnewsify.com/submit',
    'general-directory',
    55,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techdirectory',
    'TechDirectory',
    'https://www.techdirectory.io',
    'https://www.techdirectory.io/submit',
    'general-directory',
    55,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'fivetaco',
    'FiveTaco',
    'http://fivetaco.com/submit',
    'http://fivetaco.com/submit',
    'general-directory',
    54,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'indiehackers',
    'Indiehackers',
    'https://www.indiehackers.com',
    'https://www.indiehackers.com/submit',
    'general-directory',
    54,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'changelog',
    'Changelog',
    'https://changelog.com/news/submit',
    'https://changelog.com/news/submit',
    'general-directory',
    54,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'venture-village',
    'Venture Village',
    'http://venturevillage.eu',
    'http://venturevillage.eu/submit',
    'general-directory',
    54,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'product-school',
    'Product School',
    'https://www.productschool.com/slack-community',
    'https://www.productschool.com/slack-community/submit',
    'general-directory',
    54,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ai-tool-guru',
    'AI TOOL GURU',
    'https://aitoolguru.com',
    'https://aitoolguru.com/submit',
    'general-directory',
    53,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tracxn',
    'Tracxn',
    'https://tracxn.com',
    'https://tracxn.com/submit',
    'general-directory',
    53,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'nocodedevs',
    'NoCodeDevs',
    'https://www.nocodedevs.com',
    'https://www.nocodedevs.com/submit',
    'general-directory',
    52,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'nocodefounders',
    'NoCodeFounders',
    'https://nocodefounders.com',
    'https://nocodefounders.com/submit',
    'general-directory',
    52,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'software-suggest',
    'Software Suggest',
    'https://www.softwaresuggest.com/vendors',
    'https://www.softwaresuggest.com/vendors/submit',
    'general-directory',
    52,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cofounderslab',
    'CoFoundersLab',
    'https://cofounderslab.com',
    'https://cofounderslab.com/submit',
    'general-directory',
    51,
    'medium',
    'medium',
    10000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'devdojo',
    'DevDojo',
    'https://devdojo.com',
    'https://devdojo.com/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    10000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'snap-munk',
    'Snap Munk',
    'https://startups.snapmunk.com',
    'https://startups.snapmunk.com/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    10000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techli',
    'Techli',
    'https://techli.com',
    'https://techli.com/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    10000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'betabound',
    'Betabound',
    'https://betabound.com',
    'https://betabound.com/submit',
    'general-directory',
    49,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'serchen',
    'Serchen',
    'https://www.serchen.com/get-listed',
    'https://www.serchen.com/get-listed/submit',
    'general-directory',
    49,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'netted',
    'Netted',
    'http://netted.net/contact-us',
    'http://netted.net/contact-us/submit',
    'general-directory',
    49,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'designer-news',
    'Designer News',
    'https://designernews.co',
    'https://designernews.co/submit',
    'general-directory',
    48,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'devrant',
    'devRant',
    'https://devrant.com',
    'https://devrant.com/submit',
    'general-directory',
    48,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'web-design-inspiration',
    'Web Design Inspiration',
    'https://webdesign-inspiration.com',
    'https://webdesign-inspiration.com/submit',
    'general-directory',
    48,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'pitchwall',
    'PitchWall',
    'https://pitchwall.co',
    'https://pitchwall.co/submit',
    'general-directory',
    48,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-stash',
    'Startup Stash',
    'https://startupstash.com/add-listing',
    'https://startupstash.com/add-listing/submit',
    'general-directory',
    48,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'starter-story',
    'Starter Story',
    'https://www.starterstory.com',
    'https://www.starterstory.com/submit',
    'general-directory',
    48,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'lobsters',
    'Lobsters',
    'https://lobste.rs',
    'https://lobste.rs/submit',
    'general-directory',
    48,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'elpha',
    'Elpha',
    'https://elpha.com',
    'https://elpha.com/submit',
    'general-directory',
    47,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ecommercefuel',
    'eCommerceFuel',
    'https://www.ecommercefuel.com',
    'https://www.ecommercefuel.com/submit',
    'general-directory',
    47,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'launchingnext',
    'LaunchingNext',
    'https://www.launchingnext.com/submit',
    'https://www.launchingnext.com/submit',
    'general-directory',
    47,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'sideprojectors',
    'SideProjectors',
    'https://www.sideprojectors.com',
    'https://www.sideprojectors.com/submit',
    'general-directory',
    46,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'fastlane-forum',
    'Fastlane Forum',
    'https://www.thefastlaneforum.com/community',
    'https://www.thefastlaneforum.com/community/submit',
    'general-directory',
    45,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'indie-hackers',
    'Indie Hackers',
    'https://indiehackers.com',
    'https://indiehackers.com/submit',
    'general-directory',
    45,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ben-s-bites-news',
    'Ben''s Bites News',
    'http://news.bensbites.co/submit',
    'http://news.bensbites.co/submit',
    'general-directory',
    45,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'bigstartups',
    'BigStartups',
    'https://bigstartups.co',
    'https://bigstartups.co/submit',
    'general-directory',
    45,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'insidr-ai-tools',
    'Insidr AI Tools',
    'http://insidr.ai/submit-tools',
    'http://insidr.ai/submit-tools/submit',
    'general-directory',
    45,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'venture-radar',
    'Venture Radar',
    'https://www.ventureradar.com/database',
    'https://www.ventureradar.com/database/submit',
    'general-directory',
    45,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'workspaces',
    'Workspaces',
    'http://workspaces.xyz/submit-a-workspace-workspaces',
    'http://workspaces.xyz/submit-a-workspace-workspaces/submit',
    'general-directory',
    45,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'thingtesting',
    'Thingtesting',
    'https://thingtesting.com/submit-brand',
    'https://thingtesting.com/submit-brand/submit',
    'general-directory',
    45,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'land-book',
    'Land Book',
    'https://land-book.com',
    'https://land-book.com/submit',
    'general-directory',
    44,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cabinet-m',
    'Cabinet M',
    'https://cabinetm.com',
    'https://cabinetm.com/submit',
    'general-directory',
    44,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'mars-ai-directory',
    'Mars AI Directory',
    'http://marsx.dev/ai-startups',
    'http://marsx.dev/ai-startups/submit',
    'general-directory',
    44,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-buffer',
    'Startup Buffer',
    'http://startupbuffer.com',
    'http://startupbuffer.com/submit',
    'general-directory',
    44,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'there-s-an-ai-for-that',
    'There''s An AI For That',
    'https://theresanaiforthat.com',
    'https://theresanaiforthat.com/submit',
    'general-directory',
    44,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tiny-startups',
    'Tiny Startups',
    'http://tally.so/r/wMzP8X',
    'http://tally.so/r/wMzP8X/submit',
    'general-directory',
    44,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'real-world-beta-testing',
    'Real World Beta Testing',
    'https://betatesting.com/beta-testing',
    'https://betatesting.com/beta-testing/submit',
    'general-directory',
    43,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'remote-tools',
    'Remote Tools',
    'https://www.remote.tools',
    'https://www.remote.tools/submit',
    'general-directory',
    43,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'buffer-apps',
    'Buffer apps',
    'https://www.bufferapps.com',
    'https://www.bufferapps.com/submit',
    'general-directory',
    43,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'product-hq',
    'Product HQ',
    'https://www.productmanagerhq.com/join-the-community',
    'https://www.productmanagerhq.com/join-the-community/submit',
    'general-directory',
    42,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'sidebar-io',
    'Sidebar.io',
    'https://Sidebar.io',
    'https://Sidebar.io/submit',
    'general-directory',
    42,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'webcatalog',
    'webcatalog',
    'https://webcatalog.io/en/apps',
    'https://webcatalog.io/en/apps/submit',
    'general-directory',
    42,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'online-geniuses',
    'Online Geniuses',
    'https://onlinegeniuses.com/marketplace',
    'https://onlinegeniuses.com/marketplace/submit',
    'general-directory',
    42,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'superb-crew',
    'Superb Crew',
    'http://www.superbcrew.com',
    'http://www.superbcrew.com/submit',
    'general-directory',
    41,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'future-startup',
    'Future Startup',
    'https://futurestartup.com',
    'https://futurestartup.com/submit',
    'general-directory',
    41,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'futurepedia',
    'Futurepedia',
    'https://www.futurepedia.io',
    'https://www.futurepedia.io/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'find-gift',
    'Find Gift',
    'https://www.findgift.com',
    'https://www.findgift.com/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'phygital',
    'Phygital',
    'https://library.phygital.plus',
    'https://library.phygital.plus/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saas-hub',
    'SaaS Hub',
    'https://Saashub.com',
    'https://Saashub.com/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saas-worthy',
    'SaaS Worthy',
    'https://www.saasworthy.com',
    'https://www.saasworthy.com/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'landing-folio',
    'Landing Folio',
    'https://www.landingfolio.com',
    'https://www.landingfolio.com/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saashub',
    'SaaSHub',
    'http://saashub.com',
    'http://saashub.com/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tech-pluto',
    'Tech Pluto',
    'https://techpluto.com',
    'https://techpluto.com/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techpluto',
    'TechPluto',
    'http://www.techpluto.com/submit-a-startup',
    'http://www.techpluto.com/submit-a-startup/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'hcilab',
    'Hcilab',
    'http://Hcilab.org/ai-tools-directory',
    'http://Hcilab.org/ai-tools-directory/submit',
    'general-directory',
    40,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'launching-next',
    'Launching Next',
    'http://launchingnext.com',
    'http://launchingnext.com/submit',
    'general-directory',
    39,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'fyple',
    'fyple',
    'https://www.fyple.com',
    'https://www.fyple.com/submit',
    'general-directory',
    39,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'supertools',
    'Supertools',
    'https://supertools.therundown.ai',
    'https://supertools.therundown.ai/submit',
    'general-directory',
    38,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-lister',
    'startup lister',
    'https://startuplister.com',
    'https://startuplister.com/submit',
    'general-directory',
    38,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tech-tools-directory',
    'Tech Tools Directory',
    'https://www.nocode.tech/tools',
    'https://www.nocode.tech/tools/submit',
    'general-directory',
    38,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'buildspace',
    'buildspace',
    'https://sage.buildspace.so',
    'https://sage.buildspace.so/submit',
    'general-directory',
    38,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'web-tools-weekly',
    'Web Tools Weekly',
    'http://webtoolsweekly.com/submit',
    'http://webtoolsweekly.com/submit',
    'general-directory',
    37,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'topai-tools',
    'TopAI.tools',
    'https://topai.tools',
    'https://topai.tools/submit',
    'general-directory',
    37,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'submit-a-startup',
    'Submit A Startup',
    'http://thetechpanda.com/submit-a-startup',
    'http://thetechpanda.com/submit-a-startup/submit',
    'general-directory',
    37,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'openalternative',
    'OpenAlternative',
    'http://openalternative.co/submit',
    'http://openalternative.co/submit',
    'general-directory',
    36,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'classical-finance',
    'Classical Finance',
    'https://www.classicalfinance.com/your-story',
    'https://www.classicalfinance.com/your-story/submit',
    'general-directory',
    36,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'crazy-about-startups',
    'Crazy About Startups',
    'https://www.crazyaboutstartups.com',
    'https://www.crazyaboutstartups.com/submit',
    'general-directory',
    36,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'the-startup-pitch',
    'The Startup Pitch',
    'https://thestartuppitch.com',
    'https://thestartuppitch.com/submit',
    'general-directory',
    36,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'dang-ai',
    'dang ai',
    'https://dang.ai',
    'https://dang.ai/submit',
    'general-directory',
    35,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'admire-the-web',
    'Admire The Web',
    'https://www.admiretheweb.com',
    'https://www.admiretheweb.com/submit',
    'general-directory',
    35,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'aixploria',
    'AIxploria',
    'https://www.aixploria.com/en/add-ai',
    'https://www.aixploria.com/en/add-ai/submit',
    'general-directory',
    35,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'top-apps',
    'Top Apps',
    'https://topapps.ai/submit',
    'https://topapps.ai/submit',
    'general-directory',
    35,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'foundr-ai',
    'Foundr.ai',
    'https://foundr.ai',
    'https://foundr.ai/submit',
    'general-directory',
    35,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'women-in-technology',
    'Women in Technology',
    'http://witchat.github.io',
    'http://witchat.github.io/submit',
    'general-directory',
    35,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techboard',
    'Techboard',
    'https://techboard.com.au',
    'https://techboard.com.au/submit',
    'general-directory',
    35,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'toolify',
    'Toolify',
    'https://www.toolify.ai',
    'https://www.toolify.ai/submit',
    'general-directory',
    34,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ctrl-alt',
    'Ctrl Alt',
    'https://ctrlalt.cc',
    'https://ctrlalt.cc/submit',
    'general-directory',
    34,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'romanian-startups',
    'Romanian Startups',
    'https://www.romanianstartups.com',
    'https://www.romanianstartups.com/submit',
    'general-directory',
    34,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-tracker',
    'Startup Tracker',
    'https://startuptracker.io',
    'https://startuptracker.io/submit',
    'general-directory',
    34,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'future-tools',
    'Future Tools',
    'https://www.futuretools.io',
    'https://www.futuretools.io/submit',
    'general-directory',
    34,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startups-list',
    'Startups List',
    'https://www.startups-list.com',
    'https://www.startups-list.com/submit',
    'general-directory',
    34,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup88',
    'Startup88',
    'https://startup88.com',
    'https://startup88.com/submit',
    'general-directory',
    34,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'top-similar-sites',
    'Top Similar Sites',
    'http://www.topsimilarsites.com/add.aspx',
    'http://www.topsimilarsites.com/add.aspx/submit',
    'general-directory',
    34,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'vic-trays',
    'Vic Trays',
    'https://victrays.com',
    'https://victrays.com/submit',
    'general-directory',
    33,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'promotehour',
    'Promotehour',
    'https://promotehour.com',
    'https://promotehour.com/submit',
    'general-directory',
    33,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'robingood',
    'RobinGood',
    'https://tools.robingood.com',
    'https://tools.robingood.com/submit',
    'general-directory',
    33,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startuplister',
    'Startuplister',
    'http://startuplister.com',
    'http://startuplister.com/submit',
    'general-directory',
    33,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'robin-good-s-tools',
    'Robin Good''s Tools',
    'http://tools.robingood.com',
    'http://tools.robingood.com/submit',
    'general-directory',
    33,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'new-startups',
    'New Startups',
    'http://new-startups.com',
    'http://new-startups.com/submit',
    'general-directory',
    33,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'no-code-founders',
    'No Code Founders',
    'https://nocodefounders.com/startups',
    'https://nocodefounders.com/startups/submit',
    'general-directory',
    33,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'peerlist',
    'Peerlist',
    'https://peerlist.io',
    'https://peerlist.io/submit',
    'general-directory',
    32,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ios-developers',
    'iOS Developers',
    'https://ios-developers.io',
    'https://ios-developers.io/submit',
    'general-directory',
    32,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'product-led-alliance',
    'Product-Led Alliance',
    'https://www.productledalliance.com',
    'https://www.productledalliance.com/submit',
    'general-directory',
    32,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'hive-index',
    'Hive Index',
    'https://thehiveindex.com/submit',
    'https://thehiveindex.com/submit',
    'general-directory',
    31,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'genz-vcs',
    'GenZ VCs',
    'https://www.genzvcs.com/join-us',
    'https://www.genzvcs.com/join-us/submit',
    'general-directory',
    31,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'getworm-com',
    'Getworm.com',
    'https://getworm.com',
    'https://getworm.com/submit',
    'general-directory',
    30,
    'easy',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'allthingsai',
    'AllThingsAI',
    'https://allthingsai.com',
    'https://allthingsai.com/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'creative-tribes',
    'Creative Tribes',
    'http://creativetribes.co',
    'http://creativetribes.co/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'founderio',
    'founderio',
    'https://www.founderio.com',
    'https://www.founderio.com/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'appsthunder',
    'Appsthunder',
    'https://appsthunder.com',
    'https://appsthunder.com/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'digital-marketing-hints',
    'Digital Marketing Hints',
    'https://ads.digitalmarketinghints.com',
    'https://ads.digitalmarketinghints.com/submit',
    'marketplace',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'spectacle',
    'Spectacle',
    'https://spectacle.is/submit',
    'https://spectacle.is/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'webapprater',
    'Webapprater',
    'https://webapprater.com',
    'https://webapprater.com/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-inspiration',
    'Startup inspiration',
    'https://www.startupinspire.com',
    'https://www.startupinspire.com/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'inspiration-gallery-for-startups',
    'Inspiration gallery for startups',
    'http://startupinspire.com/startups',
    'http://startupinspire.com/startups/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startuptabs',
    'Startuptabs',
    'http://startuptabs.com',
    'http://startuptabs.com/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techendo',
    'Techendo',
    'http://techendo.com/beta',
    'http://techendo.com/beta/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'worm',
    'Worm',
    'https://getworm.com/submit-startup',
    'https://getworm.com/submit-startup/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startups-watch',
    'Startups.watch',
    'https://startups.watch',
    'https://startups.watch/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'allthingsai-com',
    'Allthingsai.com',
    'http://Allthingsai.com',
    'http://Allthingsai.com/submit',
    'general-directory',
    29,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'front-end-developers',
    'Front-End Developers',
    'http://frontenddevelopers.org',
    'http://frontenddevelopers.org/submit',
    'general-directory',
    28,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    '9sites-net',
    '9Sites.net',
    'https://www.9sites.net/addurl.php',
    'https://www.9sites.net/addurl.php/submit',
    'general-directory',
    28,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-collections',
    'Startup Collections',
    'http://startupcollections.com',
    'http://startupcollections.com/submit',
    'general-directory',
    28,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'aitools-fyi',
    'aitools.fyi',
    'https://aitools.fyi',
    'https://aitools.fyi/submit',
    'general-directory',
    27,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'easy-with-ai',
    'Easy With AI',
    'https://easywithai.com',
    'https://easywithai.com/submit',
    'general-directory',
    27,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'phygital-plus',
    'Phygital.plus',
    'http://library.phygital.plus',
    'http://library.phygital.plus/submit',
    'general-directory',
    27,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'indiehackerstacks',
    'IndieHackerStacks',
    'http://indiehackerstacks.com',
    'http://indiehackerstacks.com/submit',
    'general-directory',
    27,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-inspire',
    'Startup Inspire',
    'http://startupinspire.com/dashboard/startup/create',
    'http://startupinspire.com/dashboard/startup/create/submit',
    'general-directory',
    27,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'easywithai-com',
    'Easywithai.com',
    'http://Easywithai.com',
    'http://Easywithai.com/submit',
    'general-directory',
    27,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techlondon',
    'TechLondon',
    'https://techlondon.io',
    'https://techlondon.io/submit',
    'general-directory',
    27,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ai-toolkit',
    'AI Toolkit',
    'https://www.aitoolkit.org',
    'https://www.aitoolkit.org/submit',
    'general-directory',
    26,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'landscape',
    'Landscape',
    'https://www.landscape.vc/community',
    'https://www.landscape.vc/community/submit',
    'general-directory',
    26,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ai-scout',
    'AI Scout',
    'https://aiscout.net',
    'https://aiscout.net/submit',
    'general-directory',
    25,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'opentools',
    'OpenTools',
    'https://opentools.ai',
    'https://opentools.ai/submit',
    'general-directory',
    25,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'android-united',
    'Android United',
    'http://android-united.community',
    'http://android-united.community/submit',
    'general-directory',
    25,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'unita',
    'Unita',
    'https://www.unita.co',
    'https://www.unita.co/submit',
    'general-directory',
    25,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ai-mojo',
    'AI Mojo',
    'https://aimojo.pro',
    'https://aimojo.pro/submit',
    'general-directory',
    25,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'owwly',
    'Owwly',
    'https://owwly.com',
    'https://owwly.com/submit',
    'general-directory',
    25,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-spotlight',
    'Startup Spotlight',
    'http://tally.so/r/nrLJRp',
    'http://tally.so/r/nrLJRp/submit',
    'general-directory',
    25,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'the-startup-project',
    'The Startup Project',
    'https://www.startupproject.org',
    'https://www.startupproject.org/submit',
    'general-directory',
    25,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ai-tool-hunt',
    'Ai Tool Hunt',
    'https://www.aitoolhunt.com',
    'https://www.aitoolhunt.com/submit',
    'general-directory',
    24,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'fazier-com',
    'Fazier.com',
    'https://fazier.com',
    'https://fazier.com/submit',
    'general-directory',
    24,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startupbase',
    'Startupbase',
    'https://startupbase.io',
    'https://startupbase.io/submit',
    'general-directory',
    24,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'the-startup-inc',
    'The Startup INC',
    'https://www.thestartupinc.com',
    'https://www.thestartupinc.com/submit',
    'general-directory',
    24,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'remotely-one',
    'Remotely One',
    'https://www.remotelyone.com',
    'https://www.remotelyone.com/submit',
    'general-directory',
    24,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'aitoptools',
    'AITopTools',
    'https://aitoptools.com',
    'https://aitoptools.com/submit',
    'general-directory',
    23,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'aitoptools-com',
    'AItoptools.com',
    'http://AItoptools.com',
    'http://AItoptools.com/submit',
    'general-directory',
    23,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'nocodelist',
    'NoCodeList',
    'https://nocodelist.co',
    'https://nocodelist.co/submit',
    'general-directory',
    23,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ai-center',
    'AI Center',
    'https://aicenter.ai/?',
    'https://aicenter.ai/?/submit',
    'general-directory',
    23,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'toolpilot-ai',
    'ToolPilot AI',
    'https://www.toolpilot.ai',
    'https://www.toolpilot.ai/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techmasters',
    '#TechMasters',
    'https://techmasters.chat',
    'https://techmasters.chat/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'launched',
    'Launched!',
    'https://launched.io',
    'https://launched.io/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'fuse-kiwi',
    'Fuse.kiwi',
    'https://www.fuse.kiwi',
    'https://www.fuse.kiwi/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'nocode-devs',
    'Nocode Devs',
    'https://www.nocodedevs.com/browse-the-directory',
    'https://www.nocodedevs.com/browse-the-directory/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startups-fyi',
    'Startups .fyi',
    'http://tally.so/r/3lOGLk',
    'http://tally.so/r/3lOGLk/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'favird-com',
    'Favird.com',
    'http://favird.com',
    'http://favird.com/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'kernal',
    'Kernal',
    'https://kern.al',
    'https://kern.al/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'findmyaitool',
    'FindMyAITool',
    'https://findmyaitool.com',
    'https://findmyaitool.com/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'alternatives-co',
    'Alternatives.Co',
    'https://alternatives.co/software/ai-tools',
    'https://alternatives.co/software/ai-tools/submit',
    'general-directory',
    22,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ai-finder',
    'AI Finder',
    'https://ai-finder.net',
    'https://ai-finder.net/submit',
    'general-directory',
    21,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'gpte',
    'GPTE',
    'https://gpte.ai',
    'https://gpte.ai/submit',
    'general-directory',
    21,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'seoul-startups',
    'SEOUL Startups',
    'https://www.seoulstartups.com',
    'https://www.seoulstartups.com/submit',
    'general-directory',
    21,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ben-bites-news',
    'Ben Bites News',
    'https://news.bensbites.com',
    'https://news.bensbites.com/submit',
    'general-directory',
    20,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'textify',
    'TEXTIFY',
    'https://textify.ai/directory',
    'https://textify.ai/directory/submit',
    'general-directory',
    20,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tool-scout',
    'Tool Scout',
    'https://toolscout.ai',
    'https://toolscout.ai/submit',
    'general-directory',
    20,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ilib-com',
    'iLib.com',
    'https://www.ilib.com',
    'https://www.ilib.com/submit',
    'general-directory',
    20,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'firebase',
    'Firebase',
    'https://firebase-community.appspot.com',
    'https://firebase-community.appspot.com/submit',
    'general-directory',
    20,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'promote-project',
    'Promote Project',
    'https://promoteproject.com',
    'https://promoteproject.com/submit',
    'general-directory',
    20,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'uneed',
    'Uneed',
    'https://www.uneed.best/submit-a-tool',
    'https://www.uneed.best/submit-a-tool/submit',
    'general-directory',
    20,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'appiod-com',
    'Appiod.com',
    'http://appiod.com/submit-app-for-review',
    'http://appiod.com/submit-app-for-review/submit',
    'general-directory',
    20,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'awesomeindie',
    'AwesomeIndie',
    'https://awesomeindie.com',
    'https://awesomeindie.com/submit',
    'general-directory',
    20,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'uneed-best',
    'Uneed.best',
    'https://www.uneed.best',
    'https://www.uneed.best/submit',
    'general-directory',
    19,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'beta-candy',
    'beta candy',
    'https://betacandy.com',
    'https://betacandy.com/submit',
    'general-directory',
    19,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-europe',
    'Startup Europe',
    'http://startupeurope.net',
    'http://startupeurope.net/submit',
    'general-directory',
    16,
    'easy',
    'medium',
    2000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-chat',
    'Startup Chat',
    'https://community.startup.foundation/c/latest',
    'https://community.startup.foundation/c/latest/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'furlough',
    'Furlough',
    'https://discord.com/invite/UrFqwSwxvN',
    'https://discord.com/invite/UrFqwSwxvN/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'loqol-startup-community',
    'Loqol Startup Community',
    'https://discord.gg/79X3j8NHGE',
    'https://discord.gg/79X3j8NHGE/submit',
    'social-platform',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'makers-community',
    'Makers Community',
    'https://discord.gg/zvE8QjdWaf',
    'https://discord.gg/zvE8QjdWaf/submit',
    'social-platform',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'makers-hq',
    'Makers HQ',
    'https://discord.com/invite/zvE8QjdWaf',
    'https://discord.com/invite/zvE8QjdWaf/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'makerspace',
    'Makerspace',
    'https://discord.gg/GvTmqCZygz',
    'https://discord.gg/GvTmqCZygz/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'openai-discord-server',
    'OpenAI discord Server',
    'https://discord.gg/openai',
    'https://discord.gg/openai/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'retool-discord-server',
    'Retool Discord Server',
    'https://discord.com/invite/aEHwpVd7yF',
    'https://discord.com/invite/aEHwpVd7yF/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-india',
    'Startup India',
    'https://discord.gg/jtESvh9Pg5',
    'https://discord.gg/jtESvh9Pg5/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'stripe-discord-server',
    'Stripe Discord Server',
    'https://discord.gg/stripe',
    'https://discord.gg/stripe/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    '30-technoprenuers',
    '30+ Technoprenuers',
    'https://discord.com/invite/H9sJu2p8R9',
    'https://discord.com/invite/H9sJu2p8R9/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'advertise-your-startup',
    'Advertise Your Startup',
    'https://discord.com/invite/JcGuNVM',
    'https://discord.com/invite/JcGuNVM/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'business-entrepreneur',
    'Business & Entrepreneur',
    'https://discord.gg/ByW7sUB',
    'https://discord.gg/ByW7sUB/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'creatorhub-startups-projects',
    'CreatorHub - Startups & Projects',
    'https://discord.com/invite/yDkR7veK',
    'https://discord.com/invite/yDkR7veK/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'entrepreneurs-startups-and-investors',
    'Entrepreneurs, Startups, and Investors',
    'https://discord.com/invite/CAmm94buck',
    'https://discord.com/invite/CAmm94buck/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'furlough-community',
    'Furlough Community',
    'https://discord.com/invite/furlough',
    'https://discord.com/invite/furlough/submit',
    'social-platform',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-growth-hub-by-projectium',
    'Startup Growth Hub by Projectium',
    'https://discadia.com/projectium-network',
    'https://discadia.com/projectium-network/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startups',
    'Startups',
    'https://discord.gg/9qsrDuEeZS',
    'https://discord.gg/9qsrDuEeZS/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startups-entrepreneurship',
    'Startups & Entrepreneurship',
    'https://discord.gg/wZAjsTp',
    'https://discord.gg/wZAjsTp/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tech-startup-community',
    'Tech Startup Community',
    'https://discord.com/invite/gyUKVDGGC6',
    'https://discord.com/invite/gyUKVDGGC6/submit',
    'social-platform',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saas-founders-build-scale',
    'SaaS Founders - Build & Scale',
    'https://www.facebook.com/groups/saasfoundersnetwork',
    'https://www.facebook.com/groups/saasfoundersnetwork/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saas-growth-hacks',
    'SaaS Growth Hacks',
    'https://www.facebook.com/groups/SaaSgrowthhacking',
    'https://www.facebook.com/groups/SaaSgrowthhacking/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saas-mantra',
    'SaaS Mantra',
    'https://www.facebook.com/groups/saasmantra',
    'https://www.facebook.com/groups/saasmantra/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saas-products-marketing',
    'SaaS Products & Marketing',
    'https://www.facebook.com/groups/saasproductsandmarketing',
    'https://www.facebook.com/groups/saasproductsandmarketing/submit',
    'marketplace',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'scaling-saas-founders',
    'Scaling SaaS Founders',
    'https://www.facebook.com/groups/2044902829088090',
    'https://www.facebook.com/groups/2044902829088090/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'the-startup-chat-mastermind-group',
    'The Startup Chat Mastermind Group',
    'https://www.facebook.com/groups/TheStartupChat',
    'https://www.facebook.com/groups/TheStartupChat/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'band-of-entrepreneurs',
    'Band of Entrepreneurs',
    'https://www.linkedin.com/groups/1789386',
    'https://www.linkedin.com/groups/1789386/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'entrepreneur-s-network',
    'Entrepreneur''s network',
    'https://www.linkedin.com/groups/91749',
    'https://www.linkedin.com/groups/91749/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'executive-suite',
    'Executive Suite',
    'https://www.linkedin.com/groups/1426',
    'https://www.linkedin.com/groups/1426/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'on-startups',
    'On Startups',
    'https://www.linkedin.com/groups/2877',
    'https://www.linkedin.com/groups/2877/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-specialists-group',
    'Startup Specialists Group',
    'https://www.linkedin.com/groups/56766',
    'https://www.linkedin.com/groups/56766/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-advancedentrepreneur',
    '/r/advancedentrepreneur',
    'https://www.reddit.com/r/advancedentrepreneur',
    'https://www.reddit.com/r/advancedentrepreneur/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-alphaandbetausers',
    '/r/alphaandbetausers/',
    'https://www.reddit.com/r/alphaandbetausers',
    'https://www.reddit.com/r/alphaandbetausers/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-entrepreneur',
    '/r/Entrepreneur',
    'https://www.reddit.com/r/Entrepreneur',
    'https://www.reddit.com/r/Entrepreneur/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-growmybusiness',
    '/r/GrowMyBusiness',
    'https://www.reddit.com/r/growmybusiness',
    'https://www.reddit.com/r/growmybusiness/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-ladybusiness',
    '/r/LadyBusiness',
    'https://www.reddit.com/r/ladybusiness',
    'https://www.reddit.com/r/ladybusiness/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-roastmystartup',
    '/r/roastmystartup',
    'https://www.reddit.com/r/roastmystartup',
    'https://www.reddit.com/r/roastmystartup/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-saas',
    '/r/SaaS',
    'https://www.reddit.com/r/SaaS',
    'https://www.reddit.com/r/SaaS/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-sideproject',
    '/r/sideproject',
    'https://www.reddit.com/r/SideProject',
    'https://www.reddit.com/r/SideProject/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-smallbusiness',
    '/r/SmallBusiness',
    'https://www.reddit.com/r/smallbusiness',
    'https://www.reddit.com/r/smallbusiness/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-startup',
    '/r/Startup',
    'https://www.reddit.com/r/startup',
    'https://www.reddit.com/r/startup/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-sweatystartup',
    '/r/sweatystartup/',
    'https://www.reddit.com/r/sweatystartup',
    'https://www.reddit.com/r/sweatystartup/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-plugyourproduct',
    '/r/Plugyourproduct/',
    'https://www.reddit.com/r/plugyourproduct',
    'https://www.reddit.com/r/plugyourproduct/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-thesidehustle',
    '/r/thesidehustle/',
    'https://reddit.com//r/thesidehustle',
    'https://reddit.com//r/thesidehustle/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-advertising',
    'r/Advertising',
    'https://reddit.com/r/Advertising',
    'https://reddit.com/r/Advertising/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-artificialinteligence',
    'r/ArtificialInteligence/',
    'https://www.reddit.com/r/ArtificialInteligence',
    'https://www.reddit.com/r/ArtificialInteligence/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-askmarketing',
    'r/AskMarketing',
    'https://reddit.com/r/AskMarketing',
    'https://reddit.com/r/AskMarketing/submit',
    'marketplace',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-automate',
    'r/Automate',
    'https://www.reddit.com/r/Automate',
    'https://www.reddit.com/r/Automate/submit',
    'automotive',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-betatests',
    'r/betatests',
    'https://www.reddit.com/r/betatests',
    'https://www.reddit.com/r/betatests/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-business-ideas',
    'r/Business_Ideas',
    'https://reddit.com/r/Business_Ideas',
    'https://reddit.com/r/Business_Ideas/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-businessideas',
    'r/Businessideas',
    'https://reddit.com/r/Businessideas',
    'https://reddit.com/r/Businessideas/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-coding',
    'r/coding',
    'https://www.reddit.com/r/coding',
    'https://www.reddit.com/r/coding/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-coupons',
    'r/coupons',
    'https://Reddit.com/r/coupons',
    'https://Reddit.com/r/coupons/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-design',
    'r/design',
    'https://reddit.com/r/design',
    'https://reddit.com/r/design/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-design-critiques',
    'r/design_critiques/',
    'https://www.reddit.com/r/design_critiques',
    'https://www.reddit.com/r/design_critiques/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-devops',
    'r/devops',
    'https://www.reddit.com/r/devops',
    'https://www.reddit.com/r/devops/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-digitalmarketing',
    'r/DigitalMarketing',
    'https://www.reddit.com/r/DigitalMarketing',
    'https://www.reddit.com/r/DigitalMarketing/submit',
    'marketplace',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-dotcom',
    'r/DotCom',
    'https://www.reddit.com/r/DotCom',
    'https://www.reddit.com/r/DotCom/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-ecommerce',
    'r/eCommerce',
    'https://reddit.com/r/eCommerce',
    'https://reddit.com/r/eCommerce/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-emailmarketing',
    'r/EmailMarketing',
    'https://reddit.com/r/EmailMarketing',
    'https://reddit.com/r/EmailMarketing/submit',
    'marketplace',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-entrepreneurridealong',
    'r/EntrepreneurRideAlong',
    'https://www.reddit.com/r/EntrepreneurRideAlong',
    'https://www.reddit.com/r/EntrepreneurRideAlong/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-entrepreneurship',
    'r/entrepreneurship',
    'https://reddit.com/r/entrepreneurship',
    'https://reddit.com/r/entrepreneurship/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-frontend',
    'r/frontend',
    'https://reddit.com/r/frontend',
    'https://reddit.com/r/frontend/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-growinpublic',
    'r/growinpublic',
    'https://www.reddit.com/r/growinpublic',
    'https://www.reddit.com/r/growinpublic/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-growthhacking',
    'r/GrowthHacking',
    'https://reddit.com/r/GrowthHacking',
    'https://reddit.com/r/GrowthHacking/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-imadethis',
    'r/IMadeThis',
    'https://www.reddit.com/r/IMadeThis',
    'https://www.reddit.com/r/IMadeThis/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-indiebiz',
    'r/indiebiz',
    'https://www.reddit.com/r/indiebiz',
    'https://www.reddit.com/r/indiebiz/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-indiehackers',
    'r/indiehackers',
    'https://www.reddit.com/r/indiehackers',
    'https://www.reddit.com/r/indiehackers/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-indieproducts',
    'r/indieproducts',
    'https://www.reddit.com/r/indieproducts',
    'https://www.reddit.com/r/indieproducts/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-internetisbeautiful',
    'r/InternetIsBeautiful/',
    'https://www.reddit.com/r/InternetIsBeautiful',
    'https://www.reddit.com/r/InternetIsBeautiful/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-marketing',
    'r/Marketing',
    'https://reddit.com/r/marketing',
    'https://reddit.com/r/marketing/submit',
    'marketplace',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-microsaas',
    'r/microsaas',
    'https://www.reddit.com/r/microsaas',
    'https://www.reddit.com/r/microsaas/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-nichewebsites',
    'r/NicheWebsites/',
    'https://www.reddit.com/r/NicheWebsites',
    'https://www.reddit.com/r/NicheWebsites/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-nocode',
    'r/nocode/',
    'https://www.reddit.com/r/nocode',
    'https://www.reddit.com/r/nocode/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-nocodesaas',
    'r/NoCodeSaaS/',
    'https://reddit.com/r/NoCodeSaaS',
    'https://reddit.com/r/NoCodeSaaS/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-producthunters',
    'r/ProductHunters/',
    'https://www.reddit.com/r/ProductHunters',
    'https://www.reddit.com/r/ProductHunters/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-productmanagement',
    'r/ProductManagement',
    'https://www.reddit.com/r/ProductManagement',
    'https://www.reddit.com/r/ProductManagement/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-programming',
    'r/programming',
    'https://reddit.com/r/programming',
    'https://reddit.com/r/programming/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-retail',
    'r/Retail',
    'https://reddit.com/r/Retail',
    'https://reddit.com/r/Retail/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-sales',
    'r/Sales',
    'https://reddit.com/r/Sales',
    'https://reddit.com/r/Sales/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-socialpreneur',
    'r/Socialpreneur',
    'https://www.reddit.com/r/Socialpreneur',
    'https://www.reddit.com/r/Socialpreneur/submit',
    'social-platform',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-software',
    'r/software',
    'https://www.reddit.com/r/software',
    'https://www.reddit.com/r/software/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-startup-ideas',
    'r/Startup_Ideas',
    'https://www.reddit.com/r/Startup_Ideas',
    'https://www.reddit.com/r/Startup_Ideas/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-startup-resources',
    'r/startup_resources',
    'https://reddit.com/r/startup_resources',
    'https://reddit.com/r/startup_resources/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-startups',
    'r/startups',
    'https://www.reddit.com/r/startups',
    'https://www.reddit.com/r/startups/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-streetwearstartup',
    'r/streetwearstartup',
    'https://reddit.com/r/streetwearstartup',
    'https://reddit.com/r/streetwearstartup/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-technology',
    'r/technology',
    'https://reddit.com/r/technology',
    'https://reddit.com/r/technology/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-testmyapp',
    'r/testmyapp',
    'https://www.reddit.com/r/TestMyApp',
    'https://www.reddit.com/r/TestMyApp/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-userexperience',
    'r/userexperience',
    'https://reddit.com/r/userexperience',
    'https://reddit.com/r/userexperience/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-venturecapital',
    'r/VentureCapital',
    'https://reddit.com/r/VentureCapital',
    'https://reddit.com/r/VentureCapital/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-venturedcapital',
    'r/VenturedCapital',
    'https://reddit.com/r/VenturedCapital',
    'https://reddit.com/r/VenturedCapital/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-webdesign',
    'r/webdesign',
    'https://reddit.com/r/webdesign',
    'https://reddit.com/r/webdesign/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-webdev',
    'r/webdev',
    'https://www.reddit.com/r/webdev',
    'https://www.reddit.com/r/webdev/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'r-webmarketing',
    'r/WebMarketing',
    'https://reddit.com/r/WebMarketing',
    'https://reddit.com/r/WebMarketing/submit',
    'marketplace',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'all-startups',
    'All Startups',
    'https://www.allstartups.info',
    'https://www.allstartups.info/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'app-rater',
    'App Rater',
    'https://apprater.net/add',
    'https://apprater.net/add/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'awesome-tech-blogs',
    'Awesome Tech Blogs',
    'https://tech-blogs.dev',
    'https://tech-blogs.dev/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'beta-list',
    'Beta List',
    'https://betalist.com',
    'https://betalist.com/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'beta-page',
    'Beta Page',
    'https://betapage.co',
    'https://betapage.co/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'betafy',
    'Betafy',
    'https://betafy.co/home',
    'https://betafy.co/home/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'creatorbase',
    'Creatorbase',
    'https://www.creatorbase.xyz',
    'https://www.creatorbase.xyz/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'crunch-base',
    'Crunch Base',
    'https://www.crunchbase.com/#/home/index',
    'https://www.crunchbase.com/#/home/index/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'founderbeats',
    'FounderBeats',
    'https://founderbeats.com',
    'https://founderbeats.com/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'growth-junkie',
    'Growth Junkie',
    'https://growthjunkie.com',
    'https://growthjunkie.com/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'hackerspad',
    'Hackerspad',
    'https://hackerspad.net',
    'https://hackerspad.net/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'index-co',
    'Index.co',
    'https://index.co',
    'https://index.co/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'killer-startups',
    'Killer Startups',
    'https://www.killerstartups.com/submit-startup',
    'https://www.killerstartups.com/submit-startup/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'make-rs',
    'Make.rs',
    'https://make.rs',
    'https://make.rs/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'makerpad',
    'Makerpad',
    'https://www.makerpad.co',
    'https://www.makerpad.co/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'next-big-product',
    'Next Big Product',
    'http://nextbigproduct.net/product-submission',
    'http://nextbigproduct.net/product-submission/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'next-big-what',
    'Next Big What',
    'http://nextbigwhat.com',
    'http://nextbigwhat.com/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'open-startup',
    'Open Startup',
    'https://openstartup.tm',
    'https://openstartup.tm/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'project-hatch',
    'Project Hatch',
    'https://www.projecthatch.co/your-story',
    'https://www.projecthatch.co/your-story/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'saasified',
    'Saasified',
    'https://saasified.co',
    'https://saasified.co/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'show-hn',
    'Show HN',
    'https://news.ycombinator.com/show',
    'https://news.ycombinator.com/show/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'side-projectors',
    'Side Projectors',
    'https://www.sideprojectors.com/#',
    'https://www.sideprojectors.com/#/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'side-projects',
    'Side Projects',
    'https://sideprojects.net',
    'https://sideprojects.net/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'snapmunk',
    'SnapMunk',
    'https://www.snapmunk.com/submit-your-startup',
    'https://www.snapmunk.com/submit-your-startup/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-deals',
    'Startup Deals',
    'https://www.startupdeals.tech',
    'https://www.startupdeals.tech/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startup-lift',
    'Startup Lift',
    'http://www.startuplift.com',
    'http://www.startuplift.com/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'startupguys',
    'StartupGuys',
    'https://www.startupguys.net',
    'https://www.startupguys.net/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tech-faster',
    'Tech Faster',
    'http://techfaster.com/submit-your-company',
    'http://techfaster.com/submit-your-company/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tools-for-creators',
    'Tools for Creators',
    'https://toolsforcreators.co',
    'https://toolsforcreators.co/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'uses-tech',
    'uses.tech',
    'https://uses.tech',
    'https://uses.tech/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'venturebeat-profiles',
    'VentureBeat Profiles',
    'https://www.vbprofiles.com',
    'https://www.vbprofiles.com/submit',
    'general-directory',
    50,
    'medium',
    'medium',
    5000,
    '1',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'glassdoor',
    'Glassdoor',
    'https://www.glassdoor.com/',
    'https://www.glassdoor.com/employers/post-job',
    'general-directory',
    90,
    'hard',
    'high',
    45000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'bizcommunity',
    'Bizcommunity',
    'https://www.bizcommunity.com/',
    'https://www.bizcommunity.com/SubmitNews.aspx',
    'general-directory',
    77,
    'medium',
    'high',
    25000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'healthgrades',
    'Healthgrades',
    'https://www.healthgrades.com/',
    'https://www.healthgrades.com/provider/join',
    'healthcare',
    85,
    'hard',
    'high',
    30000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'avvo',
    'Avvo',
    'https://www.avvo.com/',
    'https://www.avvo.com/lawyers/join',
    'legal',
    70,
    'medium',
    'high',
    18000,
    '2',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'zillow',
    'Zillow',
    'https://www.zillow.com/',
    'https://www.zillow.com/agent-resources/',
    'real-estate',
    95,
    'hard',
    'high',
    50000,
    '3',
    FALSE,
    'instant',
    'manual',
    '{}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'gust-com',
    'Gust',
    'https://www.gust.com',
    'https://www.gust.com/add-business',
    'general-directory',
    74,
    'hard',
    'high',
    37000,
    'tier1',
    TRUE,
    '24-48 hours',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'owler-com',
    'Owler',
    'https://www.owler.com',
    'https://www.owler.com/add-business',
    'general-directory',
    66,
    'medium',
    'high',
    33000,
    'tier1',
    TRUE,
    '24-48 hours',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'local-com',
    'Local.com',
    'https://www.local.com',
    'https://www.local.com/add-business',
    'general-directory',
    61,
    'medium',
    'high',
    30500,
    'tier1',
    TRUE,
    '24-48 hours',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'yext-com',
    'Yext',
    'https://www.yext.com',
    'https://www.yext.com/add-business',
    'general-directory',
    61,
    'medium',
    'high',
    30500,
    'tier1',
    TRUE,
    '24-48 hours',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'directory-company-com',
    'Company.com Directory',
    'https://directory.company.com',
    'https://directory.company.com/add-business',
    'general-directory',
    60,
    'medium',
    'high',
    30000,
    'tier1',
    TRUE,
    '24-48 hours',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'local-listings-data-axle-com',
    'Data Axle Local Listings',
    'https://local-listings.data-axle.com',
    'https://local-listings.data-axle.com/add-business',
    'general-directory',
    57,
    'medium',
    'medium',
    28500,
    'tier2',
    TRUE,
    '24-48 hours',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ebusinesspages-com',
    'eBusiness Pages',
    'https://www.ebusinesspages.com',
    'https://www.ebusinesspages.com/add-business',
    'general-directory',
    53,
    'medium',
    'medium',
    26500,
    'tier2',
    TRUE,
    '24-48 hours',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cybo-com',
    'Cybo',
    'https://www.cybo.com',
    'https://www.cybo.com/add-business',
    'general-directory',
    51,
    'medium',
    'medium',
    25500,
    'tier2',
    TRUE,
    '24-48 hours',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'finduslocal-com',
    'FindUsLocal',
    'https://www.finduslocal.com',
    'https://www.finduslocal.com/add-business',
    'general-directory',
    45,
    'medium',
    'medium',
    22500,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cityfos-com',
    'CityFos',
    'https://www.cityfos.com',
    'https://www.cityfos.com/add-business',
    'general-directory',
    43,
    'medium',
    'medium',
    21500,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'linkcentre-com',
    'LinkCentre',
    'https://www.linkcentre.com',
    'https://www.linkcentre.com/add-business',
    'general-directory',
    41,
    'medium',
    'medium',
    20500,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'de-biznet-us-com',
    'BizNet US',
    'https://de.biznet-us.com',
    'https://de.biznet-us.com/add-business',
    'general-directory',
    36,
    'easy',
    'medium',
    18000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'getfreelisting-com',
    'GetFreeListing',
    'https://www.getfreelisting.com',
    'https://www.getfreelisting.com/add-business',
    'general-directory',
    32,
    'easy',
    'medium',
    16000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'gomylocal-com',
    'GoMyLocal',
    'https://www.gomylocal.com',
    'https://www.gomylocal.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ecity-com',
    'eCity',
    'https://www.ecity.com',
    'https://www.ecity.com/add-business',
    'general-directory',
    25,
    'easy',
    'low',
    12500,
    'tier3',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'usa-businessdirectory-cc',
    'Business Directory CC',
    'https://usa.businessdirectory.cc',
    'https://usa.businessdirectory.cc/submit',
    'general-directory',
    21,
    'easy',
    'low',
    10500,
    'tier3',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'igotbiz-com',
    'IGotBiz',
    'https://www.igotbiz.com',
    'https://www.igotbiz.com/add-business',
    'general-directory',
    21,
    'easy',
    'low',
    10500,
    'tier3',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'directorycave-com',
    'DirectoryCave',
    'http://directorycave.com',
    'http://directorycave.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'directorytag-com',
    'DirectoryTag',
    'http://directorytag.com',
    'http://directorytag.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'linkroo-com',
    'LinkRoo',
    'http://linkroo.com',
    'http://linkroo.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'd-i-r-com',
    'D-I-R',
    'http://d-i-r.com',
    'http://d-i-r.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'easylinklist-com',
    'EasyLinkList',
    'http://easylinklist.com',
    'http://easylinklist.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'linkdevils-com',
    'LinkDevils',
    'http://linkdevils.com',
    'http://linkdevils.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'linknthink-com',
    'LinkNThink',
    'http://linknthink.com',
    'http://linknthink.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'directorydudes-com',
    'DirectoryDudes',
    'http://directorydudes.com',
    'http://directorydudes.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'alistsites-com',
    'AListSites',
    'http://www.alistsites.com',
    'http://www.alistsites.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'alistdirectory-com',
    'AListDirectory',
    'http://alistdirectory.com',
    'http://alistdirectory.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'baikalglobal-com',
    'BaikalGlobal',
    'http://baikalglobal.com',
    'http://baikalglobal.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    '247webdirectory-com',
    '247WebDirectory',
    'http://www.247webdirectory.com',
    'http://www.247webdirectory.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'pakranks-com',
    'PakRanks',
    'http://pakranks.com',
    'http://pakranks.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'onlinesociety-org',
    'OnlineSociety',
    'http://onlinesociety.org',
    'http://onlinesociety.org/submit',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'loadspy-com',
    'LoadSpy',
    'http://loadspy.com',
    'http://loadspy.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'wldirectory-com',
    'WLDirectory',
    'http://wldirectory.com',
    'http://wldirectory.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'weboworld-com',
    'WebOWorld',
    'http://www.weboworld.com',
    'http://www.weboworld.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'usgeo-org',
    'USGeo',
    'http://www.usgeo.org',
    'http://www.usgeo.org/submit',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'hdvconnect-com',
    'HDVConnect',
    'http://hdvconnect.com',
    'http://hdvconnect.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'usalistingdirectory-com',
    'USAListingDirectory',
    'http://www.usalistingdirectory.com',
    'http://www.usalistingdirectory.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'socialcliff-com',
    'SocialCliff',
    'http://www.socialcliff.com',
    'http://www.socialcliff.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ecctrade-com',
    'ECCTrade',
    'http://www.ecctrade.com',
    'http://www.ecctrade.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'web-directory-site-com',
    'Web Directory Site',
    'http://www.web-directory-site.com',
    'http://www.web-directory-site.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'elephantdirectory-com',
    'ElephantDirectory',
    'http://www.elephantdirectory.com',
    'http://www.elephantdirectory.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'hotnews-org',
    'HotNews',
    'http://www.hotnews.org',
    'http://www.hotnews.org/submit',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'dn2i-com',
    'DN2I',
    'http://www.dn2i.com',
    'http://www.dn2i.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'wincyspider-com',
    'WincySpider',
    'http://www.wincyspider.com',
    'http://www.wincyspider.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'joinsociety-com',
    'JoinSociety',
    'http://www.joinsociety.com',
    'http://www.joinsociety.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'everbestlinks-com',
    'EverBestLinks',
    'http://www.everbestlinks.com',
    'http://www.everbestlinks.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'freeprwebdirectory-com',
    'FreePRWebDirectory',
    'http://www.freeprwebdirectory.com',
    'http://www.freeprwebdirectory.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'zocdoc-com',
    'Zocdoc',
    'https://www.zocdoc.com',
    'https://www.zocdoc.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'doctor-webmd-com',
    'WebMD Provider Directory',
    'https://doctor.webmd.com',
    'https://doctor.webmd.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'vitals-com',
    'Vitals',
    'https://www.vitals.com',
    'https://www.vitals.com/add-business',
    'healthcare',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'ratemds-com',
    'RateMDs',
    'https://www.ratemds.com',
    'https://www.ratemds.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'findatopdoc-com',
    'FindATopDoc',
    'https://www.findatopdoc.com',
    'https://www.findatopdoc.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'docspot-com',
    'DocSpot',
    'https://www.docspot.com',
    'https://www.docspot.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'healthprofs-com',
    'HealthProfs',
    'https://www.healthprofs.com',
    'https://www.healthprofs.com/add-business',
    'healthcare',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'justia-com',
    'Justia',
    'https://www.justia.com',
    'https://www.justia.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'lawyers-findlaw-com',
    'FindLaw',
    'https://lawyers.findlaw.com',
    'https://lawyers.findlaw.com/add-business',
    'legal',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'martindale-com',
    'Martindale-Hubbell',
    'https://www.martindale.com',
    'https://www.martindale.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'superlawyers-com',
    'Super Lawyers',
    'https://www.superlawyers.com',
    'https://www.superlawyers.com/add-business',
    'legal',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'nolo-com',
    'Nolo',
    'https://www.nolo.com/lawyers',
    'https://www.nolo.com/lawyers/submit',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'americanbar-org',
    'LawyerLocator',
    'https://www.americanbar.org/groups/legal_services/flh-home',
    'https://www.americanbar.org/groups/legal_services/flh-home/submit',
    'legal',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'realtor-com',
    'Realtor.com',
    'https://www.realtor.com',
    'https://www.realtor.com/add-business',
    'real-estate',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'trulia-com',
    'Trulia',
    'https://www.trulia.com',
    'https://www.trulia.com/add-business',
    'real-estate',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'redfin-com',
    'Redfin',
    'https://www.redfin.com',
    'https://www.redfin.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'century21-com',
    'Century21',
    'https://www.century21.com',
    'https://www.century21.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'coldwellbanker-com',
    'Coldwell Banker',
    'https://www.coldwellbanker.com',
    'https://www.coldwellbanker.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'remax-com',
    'RE/MAX',
    'https://www.remax.com',
    'https://www.remax.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'angel-co',
    'AngelList',
    'https://angel.co',
    'https://angel.co/submit',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'github-com',
    'GitHub',
    'https://github.com',
    'https://github.com/add-business',
    'technology',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'stackoverflow-com',
    'Stack Overflow Jobs',
    'https://stackoverflow.com/jobs',
    'https://stackoverflow.com/jobs/submit',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'dice-com',
    'Dice',
    'https://www.dice.com',
    'https://www.dice.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'techtarget-com',
    'TechTarget',
    'https://www.techtarget.com',
    'https://www.techtarget.com/add-business',
    'technology',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cars-com',
    'Cars.com',
    'https://www.cars.com',
    'https://www.cars.com/add-business',
    'automotive',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'autotrader-com',
    'AutoTrader',
    'https://www.autotrader.com',
    'https://www.autotrader.com/add-business',
    'automotive',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'cargurus-com',
    'CarGurus',
    'https://www.cargurus.com',
    'https://www.cargurus.com/add-business',
    'automotive',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'edmunds-com',
    'Edmunds',
    'https://www.edmunds.com',
    'https://www.edmunds.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'kbb-com',
    'KBB',
    'https://www.kbb.com',
    'https://www.kbb.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'yellowbot-com',
    'YellowBot',
    'https://www.yellowbot.com',
    'https://www.yellowbot.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'localstack-com',
    'LocalStack',
    'https://www.localstack.com',
    'https://www.localstack.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'chamberofcommerce-com',
    'ChamberofCommerce.com',
    'https://www.chamberofcommerce.com',
    'https://www.chamberofcommerce.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'yellowpagecity-com',
    'YellowPageCity',
    'https://www.yellowpagecity.com',
    'https://www.yellowpagecity.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'localdatabase-com',
    'LocalDatabase',
    'https://www.localdatabase.com',
    'https://www.localdatabase.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'citysearch-com',
    'CitySearch',
    'http://www.citysearch.com',
    'http://www.citysearch.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'merchantcircle-com',
    'MerchantCircle',
    'https://www.merchantcircle.com',
    'https://www.merchantcircle.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'whitepages-com',
    'WhitePages',
    'https://www.whitepages.com',
    'https://www.whitepages.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'superpages-com',
    'Superpages',
    'https://www.superpages.com',
    'https://www.superpages.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'dexknows-com',
    'DexKnows',
    'https://www.dexknows.com',
    'https://www.dexknows.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'theknot-com',
    'The Knot',
    'https://www.theknot.com',
    'https://www.theknot.com/add-business',
    'events',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'weddingwire-com',
    'WeddingWire',
    'https://www.weddingwire.com',
    'https://www.weddingwire.com/add-business',
    'events',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'zola-com',
    'Zola',
    'https://www.zola.com',
    'https://www.zola.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'homeadvisor-com',
    'HomeAdvisor',
    'https://www.homeadvisor.com',
    'https://www.homeadvisor.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'thumbtack-com',
    'Thumbtack',
    'https://www.thumbtack.com',
    'https://www.thumbtack.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'taskrabbit-com',
    'TaskRabbit',
    'https://www.taskrabbit.com',
    'https://www.taskrabbit.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'tripadvisor-com',
    'TripAdvisor',
    'https://www.tripadvisor.com',
    'https://www.tripadvisor.com/add-business',
    'travel',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'booking-com',
    'Booking.com',
    'https://www.booking.com',
    'https://www.booking.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);
INSERT INTO directories (
    id, name, url, submission_url, category, domain_authority,
    difficulty, priority, traffic_potential, tier, requires_registration,
    approval_time, submission_type, field_mapping, last_verified
) VALUES (
    'expedia-com',
    'Expedia',
    'https://www.expedia.com',
    'https://www.expedia.com/add-business',
    'general-directory',
    30,
    'easy',
    'medium',
    15000,
    'tier2',
    FALSE,
    'instant',
    'automated',
    '{"businessName": {"selector": "input[name=''business_name'']", "required": true}, "address": {"selector": "input[name=''address'']", "required": true}, "city": {"selector": "input[name=''city'']", "required": true}, "state": {"selector": "select[name=''state'']", "required": true}, "zip": {"selector": "input[name=''zip'']", "required": true}, "phone": {"selector": "input[name=''phone'']", "required": true}, "website": {"selector": "input[name=''website'']", "required": true}, "description": {"selector": "textarea[name=''description'']", "required": false}, "category": {"selector": "select[name=''category'']", "required": true}, "email": {"selector": "input[name=''email'']", "required": true}}'::jsonb,
    CURRENT_TIMESTAMP
);

-- Statistics
-- Total Directories: 543
-- Categories: {"general-directory": 506, "review-platform": 3, "healthcare": 4, "social-platform": 7, "marketplace": 7, "automotive": 4, "legal": 4, "real-estate": 3, "technology": 2, "events": 2, "travel": 1}
-- Average Domain Authority: 50.1
-- Tier Distribution: {"tier1": 5, "tier2": 87, "tier3": 3, "3": 75, "2": 89, "1": 284}
-- Difficulty Distribution: {"easy": 240, "medium": 224, "hard": 79}

-- Verification Query
SELECT 
    COUNT(*) as total_directories,
    COUNT(DISTINCT category) as unique_categories,
    AVG(domain_authority) as avg_domain_authority,
    COUNT(CASE WHEN tier = 'tier1' THEN 1 END) as tier1_count,
    COUNT(CASE WHEN tier = 'tier2' THEN 1 END) as tier2_count,
    COUNT(CASE WHEN tier = 'tier3' THEN 1 END) as tier3_count
FROM directories;
