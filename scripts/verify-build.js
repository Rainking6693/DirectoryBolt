#!/usr/bin/env node

/**
 * Build Verification Script
 * Ensures the correct components are being built
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build components...');

// Check if NewLandingPage component exists and has correct content
const landingPagePath = path.join(process.cwd(), 'components', 'NewLandingPage.tsx');

if (!fs.existsSync(landingPagePath)) {
  console.error('❌ LandingPage.tsx not found!');
  process.exit(1);
}

const landingPageContent = fs.readFileSync(landingPagePath, 'utf8');

// Check for key content markers
const requiredContent = [
  'AI-Powered Business Intelligence',
  '$4,300 Worth of Business Intelligence',
  '$299 ONE-TIME',
  'Save 93% vs. consultant project fees'
];

let allContentFound = true;

requiredContent.forEach(content => {
  if (!landingPageContent.includes(content)) {
    console.error(`❌ Missing content: ${content}`);
    allContentFound = false;
  } else {
    console.log(`✅ Found: ${content}`);
  }
});

if (!allContentFound) {
  console.error('❌ Build verification failed - missing required content');
  process.exit(1);
}

console.log('✅ Build verification passed - all required content found');
console.log('🚀 Build timestamp:', new Date().toISOString());