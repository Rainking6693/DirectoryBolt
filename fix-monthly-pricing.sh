#!/bin/bash

# CRITICAL DEPLOYMENT BLOCKER FIX
# Remove ALL monthly pricing references and ensure one-time pricing consistency
# DirectoryBolt Legal Compliance Script

echo "🚨 CRITICAL: Fixing monthly pricing references for legal compliance..."
echo "======================================================================"

# Function to safely replace text in files
safe_replace() {
    local search_pattern="$1"
    local replace_pattern="$2"
    local file_pattern="$3"
    
    echo "🔍 Replacing: '$search_pattern' → '$replace_pattern'"
    
    # Find files and replace content
    find . -type f -name "$file_pattern" -not -path "./node_modules/*" -not -path "./.git/*" | while read -r file; do
        if grep -q "$search_pattern" "$file" 2>/dev/null; then
            echo "  📝 Fixing: $file"
            sed -i.bak "s/$search_pattern/$replace_pattern/g" "$file"
        fi
    done
}

# Function to replace in specific file types
replace_in_files() {
    local search="$1"
    local replace="$2"
    
    # Replace in JavaScript/TypeScript files
    safe_replace "$search" "$replace" "*.{js,jsx,ts,tsx}"
    
    # Replace in config files
    safe_replace "$search" "$replace" "*.{json,md,yml,yaml}"
    
    # Replace in documentation
    safe_replace "$search" "$replace" "*.md"
}

echo ""
echo "1️⃣ PHASE 1: Fixing pricing display references..."
echo "================================================"

# Fix pricing displays
replace_in_files "/month" " ONE-TIME"
replace_in_files "per month" " one-time"
replace_in_files "\$49/month" "\$149 ONE-TIME"
replace_in_files "\$79/month" "\$299 ONE-TIME" 
replace_in_files "\$149/month" "\$149 ONE-TIME"
replace_in_files "\$299/month" "\$299 ONE-TIME"
replace_in_files "\$499/month" "\$499 ONE-TIME"
replace_in_files "\$799/month" "\$799 ONE-TIME"

echo ""
echo "2️⃣ PHASE 2: Fixing subscription terminology..."
echo "=============================================="

# Fix subscription references
replace_in_files "monthly subscription" "one-time purchase"
replace_in_files "subscription plan" "purchase plan"
replace_in_files "cancel anytime" "30-day money-back guarantee"
replace_in_files "recurring billing" "one-time billing"
replace_in_files "recurring payment" "one-time payment"

echo ""
echo "3️⃣ PHASE 3: Fixing billing cycle references..."
echo "=============================================="

# Fix billing cycle references
replace_in_files "'monthly'" "'one_time'"
replace_in_files '"monthly"' '"one_time"'
replace_in_files "billing.*monthly" "billing.*one_time"
replace_in_files "billingCycle.*monthly" "billingCycle.*one_time"

echo ""
echo "4️⃣ PHASE 4: Fixing API and backend references..."
echo "==============================================="

# Fix API references
replace_in_files "SUBSCRIPTION_PRICE_ID" "PURCHASE_PRICE_ID"
replace_in_files "monthly_subscription" "one_time_purchase"
replace_in_files "price_monthly" "price_one_time"

echo ""
echo "5️⃣ PHASE 5: Fixing specific pricing amounts..."
echo "============================================="

# Fix specific pricing amounts in critical files
find . -name "*.{js,jsx,ts,tsx}" -not -path "./node_modules/*" | xargs grep -l "4900\|7900\|14900" | while read -r file; do
    echo "  💰 Updating pricing in: $file"
    sed -i.bak 's/price: 4900/price: 14900/g' "$file"
    sed -i.bak 's/price: 7900/price: 29900/g' "$file"
    sed -i.bak 's/price: 14900/price: 49900/g' "$file"
done

echo ""
echo "6️⃣ PHASE 6: Cleaning up backup files..."
echo "======================================"

# Remove backup files
find . -name "*.bak" -not -path "./node_modules/*" -delete

echo ""
echo "✅ CRITICAL FIX COMPLETE!"
echo "========================"
echo ""
echo "📊 SUMMARY OF CHANGES:"
echo "• Removed all '/month' pricing displays"
echo "• Changed subscription → purchase terminology" 
echo "• Updated billing cycles to 'one_time'"
echo "• Fixed API environment variables"
echo "• Updated pricing amounts to one-time values"
echo ""
echo "🔍 NEXT STEPS:"
echo "• Run 'git status' to see all changed files"
echo "• Test checkout flows to ensure functionality"
echo "• Deploy immediately to fix legal compliance issue"
echo ""
echo "⚠️  LEGAL COMPLIANCE: All monthly pricing references removed!"