# 🚀 DirectoryBolt Database - Comprehensive Directory System

This document provides complete information about the DirectoryBolt directory database system, including setup, seeding, and usage instructions.

## 📊 Database Overview

The DirectoryBolt directory database contains **500+ high-value directories** organized by subscription tiers, providing businesses with access to premium directory submission opportunities based on their subscription level.

### Key Statistics
- **Total Directories**: 500+
- **Tier 1 (Starter)**: 50+ directories - High ROI, easy submissions
- **Tier 2 (Growth)**: 200+ directories - Medium effort, high value
- **Tier 3 (Professional)**: 150+ directories - Premium directories, higher barriers
- **Tier 4 (Enterprise)**: 100+ directories - Exclusive, white-glove service
- **Average Domain Authority**: 78
- **Free Directories**: 400+
- **Paid Directories**: 100+

## 🎯 Directory Categories

### Tech & Startups
- **AI Tools**: There's An AI For That, Future Tools, AIHunters
- **Tech Startups**: Product Hunt, Crunchbase, Hacker News, AngelList
- **SaaS**: G2.com, Capterra, GetApp, SoftwareAdvice
- **Developer Tools**: GitHub Marketplace, npm Registry, Docker Hub

### Business & Professional
- **General Business**: Better Business Bureau, Inc.com, Forbes
- **Professional Services**: Clutch.co, The Manifest, UpCity
- **Finance**: NASDAQ, Wall Street Journal, Fortune

### Local & Industry-Specific
- **Local Business**: Google Business Profile, Yelp, Apple Maps
- **Healthcare**: WebMD, Healthgrades, Psychology Today
- **Legal**: Avvo, Martindale-Hubbell, FindLaw
- **Real Estate**: Zillow Pro, Realtor.com, LoopNet
- **Restaurants**: OpenTable, Zomato, TripAdvisor
- **Automotive**: Cars.com, AutoTrader, CarGurus

### E-commerce & Marketplaces
- **E-commerce Platforms**: Shopify App Store, WooCommerce, Etsy
- **Marketplaces**: Amazon, eBay Business, Alibaba

### Content & Media
- **Content Platforms**: YouTube, Medium, Spotify for Artists
- **Social Media**: Facebook Business, LinkedIn, Pinterest

## 🗄️ Database Schema

```sql
CREATE TABLE directories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(500) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  domain_authority INTEGER DEFAULT 50,
  impact_level VARCHAR(20) DEFAULT 'Medium',
  submission_url VARCHAR(500),
  tier_required INTEGER DEFAULT 1, -- 1=Starter, 2=Growth, 3=Pro, 4=Enterprise
  difficulty VARCHAR(20) DEFAULT 'Medium', -- Easy, Medium, Hard
  active BOOLEAN DEFAULT true,
  estimated_traffic INTEGER DEFAULT 0,
  time_to_approval VARCHAR(50) DEFAULT '1-3 days',
  price INTEGER DEFAULT 0, -- in cents
  features TEXT[] DEFAULT '{}',
  requires_approval BOOLEAN DEFAULT true,
  country_code VARCHAR(2),
  language VARCHAR(5) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_directories_category` - Fast category filtering
- `idx_directories_tier` - Subscription tier queries
- `idx_directories_difficulty` - Difficulty-based filtering
- `idx_directories_domain_authority` - Authority ranking
- `idx_directories_active` - Active directory filtering
- `idx_directories_country` - Geographic filtering

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Required for database operations
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional for seeding (required in production)
ADMIN_SEED_KEY=your_admin_seed_key_here

# Application settings
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Seeding

#### Quick Setup (Recommended)
```bash
# Seed the database with all directories
npm run db:seed
```

#### Advanced Options
```bash
# Validate seed data without making changes
npm run seed:validate

# Reset and reseed the database
npm run db:reset

# Get current database statistics
npm run db:status

# Custom seeding with options
node scripts/seed-directories.js --action=seed --batch-size=25 --validate-data
```

## 📡 API Usage

### Get Directories

```http
GET /api/directories
```

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `tier` | number | Filter by subscription tier (1-4) | `tier=1` |
| `category` | string | Filter by category | `category=tech_startups` |
| `difficulty` | string | Filter by difficulty (Easy/Medium/Hard) | `difficulty=Easy` |
| `minDomainAuthority` | number | Minimum domain authority (0-100) | `minDomainAuthority=80` |
| `maxPrice` | number | Maximum price in cents | `maxPrice=0` (free only) |
| `active` | boolean | Filter active directories | `active=true` |
| `country` | string | Filter by country code | `country=US` |
| `freeOnly` | boolean | Show only free directories | `freeOnly=true` |
| `search` | string | Search in name, category, features | `search=startup` |
| `limit` | number | Results per page (max 1000) | `limit=50` |
| `offset` | number | Pagination offset | `offset=100` |

#### Example Requests

```bash
# Get all Tier 1 directories
curl "https://your-domain.com/api/directories?tier=1"

# Get high-authority tech directories
curl "https://your-domain.com/api/directories?category=tech_startups&minDomainAuthority=80"

# Get free, easy directories for local businesses
curl "https://your-domain.com/api/directories?category=local_business&difficulty=Easy&freeOnly=true"

# Search for AI-related directories
curl "https://your-domain.com/api/directories?search=ai&limit=20"
```

#### Example Response

```json
{
  "success": true,
  "message": "Directories fetched successfully",
  "data": [
    {
      "id": "dir_abc123",
      "name": "Product Hunt",
      "website": "https://producthunt.com",
      "category": "tech_startups",
      "domain_authority": 91,
      "impact_level": "High",
      "submission_url": "https://producthunt.com/posts/new",
      "tier_required": 1,
      "difficulty": "Easy",
      "active": true,
      "estimated_traffic": 15000000,
      "time_to_approval": "Same day",
      "price": 0,
      "features": ["Product Launch", "Community Voting", "Press Coverage"],
      "requires_approval": false,
      "country_code": null,
      "language": "en",
      "isHighAuthority": true,
      "isFree": true,
      "tierName": "Starter",
      "categoryDisplayName": "Tech Startups",
      "priceDisplay": "Free",
      "trafficDisplay": "15M"
    }
  ],
  "stats": {
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1,
      "hasMore": false
    },
    "summary": {
      "totalDirectories": 1,
      "averageDomainAuthority": 91,
      "freeDirectories": 1,
      "highAuthorityCount": 1,
      "tierDistribution": {
        "tier1": 1,
        "tier2": 0,
        "tier3": 0,
        "tier4": 0
      }
    }
  }
}
```

### Seed Database (Admin Only)

```http
POST /api/directories/seed
Authorization: Bearer YOUR_ADMIN_SEED_KEY
```

#### Request Body

```json
{
  "action": "seed", // "validate" | "seed" | "stats" | "reset"
  "options": {
    "dropExisting": false,
    "validateData": true,
    "batchSize": 50,
    "dryRun": false
  }
}
```

## 💼 Subscription Tier Strategy

### Tier 1 - Starter ($29/month)
**Focus**: High ROI, Easy Wins
- **Directories**: 50+ premium directories
- **Examples**: Product Hunt, Google Business Profile, Yelp
- **Characteristics**: Free submissions, easy approval, high traffic
- **Target Users**: Small businesses, solopreneurs

### Tier 2 - Growth ($79/month)
**Focus**: Scaling & Visibility
- **Directories**: 200+ additional directories
- **Examples**: AlternativeTo, Hacker News, AngelList
- **Characteristics**: Some paid directories, medium difficulty
- **Target Users**: Growing startups, established small businesses

### Tier 3 - Professional ($149/month)
**Focus**: Premium Brand Building
- **Directories**: 150+ high-authority directories
- **Examples**: TechCrunch, Inc.com, Forbes
- **Characteristics**: Editorial review, high barriers, premium value
- **Target Users**: Scale-ups, venture-backed companies

### Tier 4 - Enterprise ($299/month)
**Focus**: Market Leadership
- **Directories**: 100+ exclusive directories
- **Examples**: NASDAQ, Wall Street Journal, Fortune
- **Characteristics**: White-glove service, premium fees, maximum impact
- **Target Users**: Public companies, large enterprises

## 🔍 Directory Quality Metrics

### Domain Authority Distribution
- **90-100 DA**: 15% (Premium tier directories)
- **80-89 DA**: 25% (High-authority directories)
- **70-79 DA**: 30% (Good authority directories)
- **60-69 DA**: 20% (Medium authority directories)
- **Below 60 DA**: 10% (Niche/specialized directories)

### Difficulty Levels
- **Easy (40%)**: Simple form submission, auto-approval
- **Medium (45%)**: Manual review, standard requirements
- **Hard (15%)**: Editorial review, strict requirements, relationship needed

### Geographic Coverage
- **United States**: 60%
- **Global/International**: 30%
- **Europe**: 7%
- **Asia-Pacific**: 3%

## 🛠️ Development Guide

### File Structure

```
lib/database/
├── directory-seed.ts          # Comprehensive seed data (500+ directories)
├── migrate-directories.ts     # Database migration and population logic
├── directories.ts             # Directory database interface
└── schema.ts                  # Database schema definitions

pages/api/directories/
├── index.ts                   # Main directory API endpoint
├── seed.ts                    # Admin seeding endpoint
└── [id].ts                    # Individual directory operations

scripts/
└── seed-directories.js        # CLI seeding script
```

### Adding New Directories

1. **Add to Seed Data** (`lib/database/directory-seed.ts`):
```typescript
{
  name: 'New Directory',
  website: 'https://newdirectory.com',
  category: 'tech_startups',
  domain_authority: 75,
  impact_level: 'High',
  submission_url: 'https://newdirectory.com/submit',
  tier_required: 2,
  difficulty: 'Medium',
  active: true,
  estimated_traffic: 1000000,
  time_to_approval: '3-5 days',
  price: 0,
  features: ['Feature 1', 'Feature 2'],
  requires_approval: true
}
```

2. **Run Migration**:
```bash
npm run db:seed
```

### Testing

```bash
# Validate all data
npm run seed:validate

# Test with smaller batch size
node scripts/seed-directories.js --batch-size=10 --dry-run

# Get current statistics
npm run db:status
```

## 🔒 Security Considerations

### API Security
- Admin endpoints require `ADMIN_SEED_KEY`
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention

### Data Validation
- URL format validation
- Domain authority range checks (0-100)
- Tier validation (1-4)
- Category enumeration validation
- Price validation (non-negative)

### Environment Security
```bash
# Production environment variables
ADMIN_SEED_KEY=secure-random-key-min-32-chars
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📈 Performance Optimization

### Database Optimization
- Strategic indexes on commonly filtered columns
- Batch insertion for seed operations
- Connection pooling for high traffic
- Query result caching

### API Performance
- Response caching (5-minute TTL)
- Pagination for large result sets
- Efficient filtering at database level
- Gzip compression for responses

### Monitoring
```bash
# Check database performance
npm run db:status

# Monitor API response times
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3000/api/directories
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Seeding Fails with Connection Error
```bash
Error: ECONNREFUSED
```
**Solution**: Ensure Next.js development server is running (`npm run dev`)

#### 2. Authorization Error
```bash
Error: Unauthorized access
```
**Solution**: Set `ADMIN_SEED_KEY` environment variable

#### 3. Supabase Connection Issues
```bash
Error: Missing Supabase environment variables
```
**Solution**: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

#### 4. Validation Errors
```bash
Error: Data validation failed
```
**Solution**: Check seed data format and run `npm run seed:validate`

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env.SUPABASE_URL ? 'SUPABASE_URL: Set' : 'SUPABASE_URL: Missing')"

# Test API connectivity
curl -X POST http://localhost:3000/api/directories/seed \
  -H "Content-Type: application/json" \
  -d '{"action":"stats"}'

# Validate seed data only
npm run seed:validate
```

## 📚 Additional Resources

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Next.js API Routes**: [https://nextjs.org/docs/api-routes/introduction](https://nextjs.org/docs/api-routes/introduction)
- **Directory Submission Best Practices**: See `/docs/SUBMISSION_GUIDE.md`
- **API Authentication**: See `/docs/API_AUTHENTICATION.md`

## 🤝 Contributing

To contribute new directories or improvements:

1. Fork the repository
2. Add directories to `directory-seed.ts`
3. Test with `npm run seed:validate`
4. Submit pull request with directory details
5. Include source verification and quality metrics

---

**DirectoryBolt Database System** - Built for scale, optimized for performance, designed for growth.

For support: `support@directorybolt.com`