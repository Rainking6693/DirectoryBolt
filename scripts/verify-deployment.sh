#!/bin/bash

# DirectoryBolt Deployment Verification Script
# Verifies both Netlify frontend and worker deployments

set -e

echo "🚀 DirectoryBolt Deployment Verification"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NETLIFY_SITE="${NETLIFY_SITE_URL:-https://directorybolt.netlify.app}"
WORKER_HEALTH_CHECK="${WORKER_HEALTH_URL:-http://localhost:8080/health}"

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    echo -e "${YELLOW}   $3${NC}"
  fi
}

# 1. Verify Netlify Frontend
echo "1️⃣  Verifying Netlify Frontend..."
echo "   Site: $NETLIFY_SITE"

if curl -s -I "$NETLIFY_SITE" | grep -q "HTTP/[12] 200"; then
  print_status 0 "Netlify frontend is live"
else
  print_status 1 "Netlify frontend is down" "Check deployment status at netlify.com"
  exit 1
fi

# 2. Verify API Health Endpoint
echo ""
echo "2️⃣  Verifying API Health Endpoint..."

if curl -s "$NETLIFY_SITE/api/health" | grep -q "ok"; then
  print_status 0 "API health endpoint responding"
else
  print_status 1 "API health endpoint failed" "Check Netlify functions logs"
fi

# 3. Verify Supabase Connection (via API)
echo ""
echo "3️⃣  Verifying Supabase Connection..."

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  print_status 1 "Supabase URL not configured" "Set NEXT_PUBLIC_SUPABASE_URL environment variable"
else
  if curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" | grep -q "OpenAPI"; then
    print_status 0 "Supabase connection successful"
  else
    print_status 1 "Supabase connection failed" "Check Supabase project status"
  fi
fi

# 4. Verify Worker (if running)
echo ""
echo "4️⃣  Verifying Worker Service..."

if [ "$SKIP_WORKER_CHECK" = "true" ]; then
  echo -e "${YELLOW}⏭️  Worker check skipped${NC}"
else
  if curl -s "$WORKER_HEALTH_CHECK" 2>/dev/null | grep -q "healthy"; then
    print_status 0 "Worker service is healthy"
  else
    print_status 1 "Worker service unavailable" "Worker may not be deployed yet (optional)"
  fi
fi

# 5. Run TypeScript Type Check
echo ""
echo "5️⃣  Running TypeScript Type Check..."

if npm run type-check > /dev/null 2>&1; then
  print_status 0 "TypeScript compilation successful"
else
  print_status 1 "TypeScript errors detected" "Run 'npm run type-check' for details"
  exit 1
fi

# 6. Verify Build
echo ""
echo "6️⃣  Verifying Production Build..."

if [ -d ".next" ]; then
  print_status 0 "Production build exists"
else
  echo "   Running production build..."
  if npm run build > /dev/null 2>&1; then
    print_status 0 "Production build successful"
  else
    print_status 1 "Production build failed" "Run 'npm run build' for details"
    exit 1
  fi
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ Deployment verification complete!${NC}"
echo ""
echo "📊 Next Steps:"
echo "   1. Check Netlify dashboard for build status"
echo "   2. Deploy worker to Railway/Heroku (if not done)"
echo "   3. Run smoke tests: npm run test:smoke"
echo ""

