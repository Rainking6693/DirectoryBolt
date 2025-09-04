#!/usr/bin/env python3
"""
Update all references from 500+ to 480+ directories across the codebase
"""

import os
import re

def update_file(filepath, old_pattern, new_pattern):
    """Update pattern in file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_pattern in content:
            updated_content = content.replace(old_pattern, new_pattern)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            return True
        return False
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
        return False

# Files to update based on grep results
files_to_update = [
    './components/InteractiveDemo.tsx',
    './components/OnboardingFlow.tsx',
    './components/PricingPage.tsx',
    './components/PackageSelector.tsx',
    './components/PricingPageOld.jsx',
    './components/seo/StandardizedSEO.tsx',
    './components/WebsiteAnalyzer.tsx',
    './pages/onboarding.tsx',
    './pages/index.tsx',
    './pages/pricing.tsx',
    './public/site.webmanifest',
    './pages/api/create-checkout-session.js',
    './pages/api-backup/create-checkout-session.js'
]

# Patterns to replace
replacements = [
    ('500+ directories', '480+ directories'),
    ('500+ directory', '480+ directory'),
    ('Submit Your Business to 500+ Directories', 'Submit Your Business to 480+ Directories'),
    ('Get listed in 500+ directories', 'Get listed in 480+ directories'),
    ('listed in 500+ directories', 'listed in 480+ directories'),
    ('listings on 500+ directories', 'listings on 480+ directories'),
    ('across 500+ directories', 'across 480+ directories'),
    ('Submit to 500+ premium directories', 'Submit to 480+ premium directories')
]

print("Updating directory count references from 500+ to 480+...\n")

total_updates = 0
for filepath in files_to_update:
    if os.path.exists(filepath):
        file_updated = False
        for old, new in replacements:
            if update_file(filepath, old, new):
                file_updated = True
                total_updates += 1
        if file_updated:
            print(f"[UPDATED] {filepath}")
    else:
        print(f"[WARNING] File not found: {filepath}")

print(f"\n[SUCCESS] Total updates made: {total_updates}")
print("[SUCCESS] Marketing messaging updated to reflect actual directory count (484 -> marketed as 480+)")