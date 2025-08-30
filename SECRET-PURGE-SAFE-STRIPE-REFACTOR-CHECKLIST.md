# 🔒 SECRET-PURGE & SAFE-STRIPE REFACTOR OPERATION CHECKLIST

**Project:** DirectoryBolt  
**Repository:** https://github.com/Rainking6693/DirectoryBolt.git  
**Date:** August 30, 2025  
**Issue:** Exposed Stripe keys flagged by GitHub secret scanners  

---

## 🚨 CRITICAL SECURITY BREACH IDENTIFIED

### Exposed Files with Hardcoded Secrets:
1. **`COMPREHENSIVE_STRIPE_CHECKOUT_QA_REPORT.md`** (Line 61) - Contains live Stripe secret key
2. **`pages/api/checkout-session-details.js`** (Line 4) - Contains live Stripe secret key

### Exposed Key Pattern:
```
sk_live_[REDACTED_FOR_SECURITY]
```

---

## 📋 PHASE 1: IMMEDIATE CODE FIXES (DO FIRST)

### ✅ 1.1 Remove Hardcoded Secrets from Current Files

**Files to Fix:**

- [ ] **`C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt\COMPREHENSIVE_STRIPE_CHECKOUT_QA_REPORT.md`**
  ```bash
  # Find and replace the exposed key with placeholder
  # Line 61: Replace actual key with "[REDACTED]" or "sk_live_[REDACTED]"
  ```

- [ ] **`C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt\pages\api\checkout-session-details.js`**
  ```bash
  # Line 4: Remove fallback with hardcoded key
  # BEFORE: 
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_live_51RyJPc...', {
  
  # AFTER:
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  ```

- [ ] **Add proper environment variable validation:**
  ```javascript
  // Add this after the Stripe initialization in checkout-session-details.js
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  ```

### ✅ 1.2 Search for Additional Exposed Secrets

**Commands to run:**
```bash
cd "C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt"

# Search for all Stripe patterns
grep -r "sk_live_" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "sk_test_" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "pk_live_" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "pk_test_" . --exclude-dir=node_modules --exclude-dir=.git

# Search for the specific exposed key
grep -r "51RyJPcPQdMywmVkHrXA1zCAXaHt8RUVIaaaThycEmR9jaWjdIqe3kPdGR83foHV7HTPLNhaNPXhamAtZNFecJaRm00B9AS5yvY" . --exclude-dir=node_modules --exclude-dir=.git
```

### ✅ 1.3 Verify Environment Configuration

- [ ] **Check existing environment files:**
  ```bash
  # These files exist in your project:
  cat .env.example
  cat .env.local
  cat .env.production
  ```

- [ ] **Update environment files with proper patterns:**
  ```bash
  # Add to .env.example
  STRIPE_SECRET_KEY=sk_test_your_test_key_here
  STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
  
  # Add to .env.local (for development)
  STRIPE_SECRET_KEY=sk_test_[your_test_key]
  STRIPE_PUBLISHABLE_KEY=pk_test_[your_test_key]
  
  # Add to .env.production (reference only - actual values in Netlify/Vercel)
  STRIPE_SECRET_KEY=sk_live_[production_key_from_environment]
  STRIPE_PUBLISHABLE_KEY=pk_live_[production_key_from_environment]
  ```

---

## 📋 PHASE 2: GIT HISTORY SCRUBBING (CRITICAL)

### ✅ 2.1 Install git-filter-repo

**For Windows:**
```bash
# Install via pip (if you have Python)
pip install git-filter-repo

# OR install manually
curl -O https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo
mv git-filter-repo /usr/local/bin/
chmod +x /usr/local/bin/git-filter-repo

# OR use git-filter-branch (fallback)
# Note: git-filter-repo is preferred as it's faster and safer
```

### ✅ 2.2 Create Backup Before History Rewrite

```bash
cd "C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt"

# Create full backup
cp -r . ../DirectoryBolt-BACKUP-$(date +%Y%m%d-%H%M%S)

# Create separate git backup
git clone --bare . ../DirectoryBolt-git-backup.git
```

### ✅ 2.3 Purge Secrets from Git History

**Method 1: Using git-filter-repo (Recommended)**
```bash
cd "C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt"

# Remove the specific exposed secret key from all history
git filter-repo --replace-text <(echo "sk_live_[REDACTED_FOR_SECURITY]==>sk_live_[REDACTED]")

# Alternative: More comprehensive pattern replacement
git filter-repo --replace-text <(cat <<EOF
sk_live_[REDACTED_FOR_SECURITY]==>***REMOVED***
regex:sk_live_[a-zA-Z0-9]{99}==>sk_live_***REMOVED***
regex:sk_test_[a-zA-Z0-9]{99}==>sk_test_***REMOVED***
regex:pk_live_[a-zA-Z0-9]{99}==>pk_live_***REMOVED***
regex:pk_test_[a-zA-Z0-9]{99}==>pk_test_***REMOVED***
EOF
)
```

**Method 2: Using git-filter-branch (Fallback)**
```bash
# If git-filter-repo is not available
git filter-branch --tree-filter '
  find . -type f -name "*.js" -o -name "*.md" -o -name "*.json" -o -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/sk_live_[REDACTED_FOR_SECURITY]/sk_live_[REDACTED]/g"
' --all

# Clean up filter-branch backup refs
git for-each-ref --format="delete %(refname)" refs/original/ | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### ✅ 2.4 Verify History Cleanup

```bash
# Search cleaned history for any remaining secrets
git log --all --grep="sk_live_" --oneline
git log --all --grep="sk_test_" --oneline
git log -p --all | grep -n "sk_live_\|sk_test_\|pk_live_\|pk_test_"

# Check specific files in history
git log --follow -p -- pages/api/checkout-session-details.js | grep "sk_live_"
git log --follow -p -- COMPREHENSIVE_STRIPE_CHECKOUT_QA_REPORT.md | grep "sk_live_"
```

---

## 📋 PHASE 3: KEY ROTATION & ENVIRONMENT SETUP

### ✅ 3.1 Rotate Compromised Stripe Keys

**In Stripe Dashboard:**
- [ ] **Login to Stripe Dashboard** → https://dashboard.stripe.com/
- [ ] **Navigate to Developers → API keys**
- [ ] **Deactivate/Delete the exposed key:** `sk_live_51RyJPc...`
- [ ] **Create new live secret key**
- [ ] **Create new live publishable key**
- [ ] **Update webhook endpoint secrets** (if using webhooks)

### ✅ 3.2 Configure Production Environment Variables

**For Netlify (based on your netlify.toml):**
```bash
# Using Netlify CLI
netlify env:set STRIPE_SECRET_KEY "sk_live_NEW_SECURE_KEY_HERE"
netlify env:set STRIPE_PUBLISHABLE_KEY "pk_live_NEW_SECURE_KEY_HERE"

# Or via Netlify Dashboard:
# Site settings → Environment variables → Add new variables
```

**For Vercel (alternative deployment):**
```bash
# Using Vercel CLI
vercel env add STRIPE_SECRET_KEY production
# Enter: sk_live_NEW_SECURE_KEY_HERE

vercel env add STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_NEW_SECURE_KEY_HERE
```

### ✅ 3.3 Update Local Development Environment

```bash
cd "C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt"

# Update .env.local with new test keys
cat > .env.local << EOF
STRIPE_SECRET_KEY=sk_test_YOUR_NEW_TEST_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_NEW_TEST_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_NEW_TEST_KEY
EOF

# Ensure .env.local is in .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

---

## 📋 PHASE 4: PRE-PUSH SCANNING SETUP

### ✅ 4.1 Install and Configure git-secrets

**Install git-secrets:**
```bash
# For Windows with Git Bash/WSL
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# Add to PATH if needed
export PATH="$PATH:/usr/local/bin"
```

**Configure for Stripe secrets:**
```bash
cd "C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt"

# Initialize git-secrets
git secrets --install

# Add Stripe secret patterns
git secrets --register-aws  # Basic AWS patterns
git secrets --add 'sk_live_[a-zA-Z0-9]{99}'
git secrets --add 'sk_test_[a-zA-Z0-9]{99}'
git secrets --add 'pk_live_[a-zA-Z0-9]{99}'
git secrets --add 'pk_test_[a-zA-Z0-9]{99}'

# Add the specific compromised pattern
git secrets --add '51RyJPcPQdMywmVkHrXA1zCAXaHt8RUVIaaaThycEmR9jaWjdIqe3kPdGR83foHV7HTPLNhaNPXhamAtZNFecJaRm00B9AS5yvY'

# Test current repository
git secrets --scan
```

### ✅ 4.2 Setup Pre-commit Hooks

**Create `.pre-commit-config.yaml`:**
```yaml
# File: .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: check-json
      - id: check-yaml
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: detect-private-key
  
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package-lock.json
  
  - repo: local
    hooks:
      - id: stripe-secrets
        name: Check for Stripe secrets
        entry: bash -c 'git diff --cached --name-only | xargs grep -l "sk_live_\|sk_test_\|pk_live_\|pk_test_" && exit 1 || exit 0'
        language: system
        stages: [commit]
```

**Install pre-commit:**
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Initialize secrets baseline
detect-secrets scan --baseline .secrets.baseline
```

### ✅ 4.3 Setup TruffleHog for CI/CD

**Create `.github/workflows/security-scan.yml`:**
```yaml
name: Security Scan

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  trufflehog:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: TruffleHog OSS
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
        extra_args: --debug --only-verified
```

---

## 📋 PHASE 5: SECURITY GUARDRAILS IMPLEMENTATION

### ✅ 5.1 Code-Level Security Patterns

**Update all API files to use secure patterns:**

**File: `lib/stripe-config.js`** (Create centralized config)
```javascript
// lib/stripe-config.js
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') && process.env.NODE_ENV !== 'production') {
  throw new Error('Live Stripe keys should only be used in production environment');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const isProduction = process.env.NODE_ENV === 'production';
export const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Validate key format
const keyPattern = /^sk_(live|test)_[a-zA-Z0-9]{99}$/;
if (!keyPattern.test(process.env.STRIPE_SECRET_KEY)) {
  console.warn('Stripe secret key format may be invalid');
}
```

**Update existing API files:**
```javascript
// pages/api/checkout-session-details.js
import { stripe } from '../../lib/stripe-config';

// Remove the old Stripe initialization
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'hardcoded_key', {
//   apiVersion: '2023-10-16',
// });
```

### ✅ 5.2 Environment Validation Middleware

**Create `middleware/validate-env.js`:**
```javascript
// middleware/validate-env.js
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
];

const dangerousPatterns = [
  /sk_live_[REDACTED_FOR_SECURITY]/,
  /sk_test_.*dummy.*|sk_live_.*dummy.*/i,
  /your.*key.*here/i
];

export function validateEnvironment() {
  // Check required variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Check for dangerous patterns
  for (const [key, value] of Object.entries(process.env)) {
    if (key.includes('STRIPE') && value) {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          throw new Error(`Dangerous pattern detected in ${key}`);
        }
      }
    }
  }

  console.log('Environment validation passed');
}
```

### ✅ 5.3 Runtime Secret Detection

**Create `lib/security-monitor.js`:**
```javascript
// lib/security-monitor.js
const FORBIDDEN_PATTERNS = [
  /sk_live_[REDACTED_FOR_SECURITY]/,
  /sk_(live|test)_[a-zA-Z0-9]{99}/,
  /pk_(live|test)_[a-zA-Z0-9]{99}/
];

export function scanForSecrets(text) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      console.error('🚨 SECRET DETECTED:', pattern);
      throw new Error('Secret pattern detected in runtime');
    }
  }
}

// Override console.log in development to catch accidental logging
if (process.env.NODE_ENV === 'development') {
  const originalLog = console.log;
  console.log = (...args) => {
    args.forEach(arg => {
      if (typeof arg === 'string') {
        scanForSecrets(arg);
      }
    });
    originalLog(...args);
  };
}
```

---

## 📋 PHASE 6: TESTING & VALIDATION

### ✅ 6.1 Test Secret Removal

```bash
cd "C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt"

# Run comprehensive secret scan
git log --all -p | grep -E "sk_(live|test)_[a-zA-Z0-9]{99}" || echo "No secrets found in history"

# Test with multiple tools
trufflehog filesystem . --only-verified
detect-secrets scan --all-files

# Check specific files
grep -r "51RyJPc" . --exclude-dir=node_modules --exclude-dir=.git || echo "Specific key not found"
```

### ✅ 6.2 Test Environment Configuration

```bash
# Test development environment
npm run dev
# Verify no hardcoded keys are used

# Test build process
npm run build
# Ensure build succeeds with environment variables only

# Test API endpoints with test keys
curl -X POST http://localhost:3000/api/create-checkout-session-v3 \
  -H "Content-Type: application/json" \
  -d '{"plan": "starter", "addons": []}'
```

### ✅ 6.3 Test Pre-commit Hooks

```bash
# Create test file with secret
echo "const key = 'sk_live_test123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'" > test-secret.js

# Try to commit (should fail)
git add test-secret.js
git commit -m "test commit"

# Clean up
rm test-secret.js
git reset HEAD
```

---

## 📋 PHASE 7: FORCE PUSH & REPOSITORY UPDATE

### ⚠️ 7.1 Coordinate Team Communication

**Before force push:**
- [ ] **Notify all team members** about the upcoming history rewrite
- [ ] **Ensure all team members have committed their work**
- [ ] **Schedule maintenance window** if this affects production
- [ ] **Create final backup** of current state

### ⚠️ 7.2 Force Push Cleaned History

```bash
cd "C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt"

# Verify remote repository
git remote -v

# Force push the cleaned history (DANGER: This rewrites public history)
git push --force-with-lease origin --all
git push --force-with-lease origin --tags

# Alternative safer approach (if working alone):
git push --force origin main

# Verify push succeeded
git log --oneline -10
```

### ⚠️ 7.3 Team Repository Re-sync

**For team members:**
```bash
# Each team member needs to do this after the force push
cd path/to/DirectoryBolt

# Backup local changes
git stash

# Reset to match the new history
git fetch origin
git reset --hard origin/main

# Restore local changes (if any)
git stash pop
```

---

## 📋 PHASE 8: ONGOING SECURITY MONITORING

### ✅ 8.1 GitHub Security Features

**Enable in Repository Settings:**
- [ ] **Secret scanning alerts** (GitHub → Settings → Security → Code security and analysis)
- [ ] **Dependency scanning** (Dependabot alerts)
- [ ] **Code scanning** with CodeQL
- [ ] **Private vulnerability reporting**

### ✅ 8.2 Automated Security Scans

**Add to `package.json`:**
```json
{
  "scripts": {
    "security:scan": "detect-secrets scan --all-files",
    "security:audit": "npm audit --audit-level high",
    "security:trufflehog": "trufflehog filesystem . --only-verified",
    "pre-deploy": "npm run security:scan && npm run security:audit"
  }
}
```

**Update CI/CD Pipeline:**
```yaml
# Add to existing workflows or create new one
- name: Security Audit
  run: |
    npm run security:scan
    npm run security:audit
    
- name: Fail on High Severity
  run: npm audit --audit-level high
```

### ✅ 8.3 Key Rotation Schedule

**Quarterly Security Review:**
```markdown
# Security Checklist (Every 3 months)
- [ ] Rotate Stripe API keys
- [ ] Review environment variables
- [ ] Update security scanning tools
- [ ] Audit access logs
- [ ] Review team access permissions
- [ ] Test secret scanning effectiveness
```

---

## 🎯 EXECUTION TIMELINE

### **Day 1 (CRITICAL - Do Today):**
- ✅ Phase 1: Remove hardcoded secrets from current files
- ✅ Phase 2: Git history scrubbing
- ✅ Phase 3: Rotate compromised Stripe keys

### **Day 2:**
- ✅ Phase 4: Setup pre-push scanning
- ✅ Phase 5: Implement security guardrails
- ✅ Phase 6: Testing & validation

### **Day 3:**
- ✅ Phase 7: Force push cleaned history
- ✅ Phase 8: Setup ongoing monitoring

---

## 🚨 EMERGENCY ROLLBACK PLAN

If something goes wrong during git history rewrite:

```bash
# Restore from backup
cd ../DirectoryBolt-BACKUP-[timestamp]
cp -r . ../DirectoryBolt-RECOVERY/
cd ../DirectoryBolt-RECOVERY

# Or restore git history from bare backup
git clone ../DirectoryBolt-git-backup.git DirectoryBolt-RESTORED
```

---

## ✅ SUCCESS CRITERIA

**Before considering this operation complete:**
- [ ] No Stripe secrets found in current codebase
- [ ] No Stripe secrets found in git history
- [ ] Pre-commit hooks prevent future secret commits  
- [ ] New Stripe keys configured in production
- [ ] All API endpoints work with environment variables only
- [ ] Team members have re-synced repositories
- [ ] Security monitoring is active
- [ ] Documentation updated

---

## 📞 SUPPORT CONTACTS

**If you encounter issues:**
- **Stripe Support:** https://support.stripe.com/
- **GitHub Support:** https://support.github.com/
- **Git Filter-Repo Issues:** https://github.com/newren/git-filter-repo/issues

---

**⚠️ CRITICAL REMINDER:** This operation involves rewriting git history. Coordinate with your team and ensure everyone understands the impact before proceeding with Phase 7 (Force Push).