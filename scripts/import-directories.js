#!/usr/bin/env node

/**
 * DirectoryBolt Directory Import Script
 * Purpose: Parse and import 599+ directories from JSON and Markdown files
 * Files: master-directory-list-expanded.json (489) + additional_free_directories_for_directorybolt.md (110)
 */

const fs = require('fs');
const path = require('path');

// Category mapping for directories
const CATEGORY_MAPPING = {
  'general-directory': 'business_general',
  'review-platform': 'review_platforms',
  'healthcare': 'healthcare',
  'social-platform': 'social_media',
  'marketplace': 'business_general',
  'automotive': 'professional_services',
  'legal': 'legal',
  'real-estate': 'real_estate',
  'default': 'business_general'
};

// Domain Authority mapping for markdown directories
const DA_MAPPING = {
  'glassdoor.com': 90,
  'bizcommunity.com': 77,
  'gust.com': 74,
  'owler.com': 66,
  'local.com': 61,
  'yext.com': 61,
  'healthgrades.com': 85,
  'zocdoc.com': 82,
  'webmd.com': 89,
  'vitals.com': 65,
  'avvo.com': 70,
  'justia.com': 75,
  'zillow.com': 94,
  'realtor.com': 89,
  'trulia.com': 82,
  'redfin.com': 78,
  'techcrunch.com': 91,
  'angel.co': 83,
  'producthunt.com': 87,
  'github.com': 96,
  'stackoverflow.com': 93,
  'cars.com': 79,
  'autotrader.com': 76,
  'theknot.com': 72,
  'weddingwire.com': 68,
  'angi.com': 74,
  'homeadvisor.com': 71,
  'thumbtack.com': 73,
  'tripadvisor.com': 88
};

// Extract domain from URL
function extractDomain(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch (e) {
    return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

// Get domain authority for URL
function getDomainAuthority(url) {
  const domain = extractDomain(url);
  return DA_MAPPING[domain] || 50; // Default DA
}

// Map category from JSON to SQL category
function mapCategory(jsonCategory) {
  return CATEGORY_MAPPING[jsonCategory] || CATEGORY_MAPPING.default;
}

// Clean and validate URL
function cleanUrl(url) {
  if (!url) return null;
  
  // Handle URLs without protocol
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  
  // Clean up common issues
  url = url.trim().replace(/\/$/, ''); // Remove trailing slash
  
  return url;
}

// Generate priority tier based on DA
function getPriorityTier(da) {
  if (da >= 80) return 'High';
  if (da >= 60) return 'Medium';
  return 'Low';
}

// Generate difficulty score based on DA and category
function getDifficulty(da, category, originalDifficulty = null) {
  // If original difficulty is a string, convert to number
  if (originalDifficulty) {
    const difficultyMap = {
      'easy': 1,
      'medium': 3,
      'hard': 5
    };
    if (typeof originalDifficulty === 'string' && difficultyMap[originalDifficulty]) {
      return difficultyMap[originalDifficulty];
    }
    if (typeof originalDifficulty === 'number') {
      return Math.min(5, Math.max(1, originalDifficulty));
    }
  }
  
  // Calculate based on DA and category
  let base = 3;
  if (da >= 90) base += 2;
  else if (da >= 70) base += 1;
  
  if (category === 'legal' || category === 'healthcare') base += 1;
  if (category === 'finance') base += 1;
  
  return Math.min(5, Math.max(1, base));
}

// Generate SQL-safe string
function sqlSafe(str) {
  if (!str) return 'NULL';
  return "'" + str.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Parse JSON directories
function parseJsonDirectories() {
  console.log('📊 Parsing JSON directories...');
  
  const jsonPath = path.join(__dirname, '../directories/master-directory-list-expanded.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  const directories = jsonData.directories.map(dir => {
    const category = mapCategory(dir.category);
    const cleanedUrl = cleanUrl(dir.url);
    const da = dir.domainAuthority || getDomainAuthority(cleanedUrl);
    
    return {
      id: dir.id || `json-${dir.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: dir.name,
      website: cleanedUrl,
      submissionUrl: cleanUrl(dir.submissionUrl) || cleanedUrl,
      category: category,
      domainAuthority: da,
      priority: dir.priority || getPriorityTier(da),
      difficulty: getDifficulty(da, category, dir.difficulty),
      description: dir.description || `${dir.name} directory listing`,
      features: dir.features || [],
      businessTypes: dir.businessTypes || [],
      pricing: dir.pricing || 'free',
      trafficPotential: dir.trafficPotential || 1000,
      submissionRequirements: dir.submissionRequirements || {},
      formFields: dir.formFields || [],
      source: 'json'
    };
  });
  
  console.log(`✅ Parsed ${directories.length} directories from JSON`);
  return directories;
}

// Parse markdown directories
function parseMarkdownDirectories() {
  console.log('📊 Parsing Markdown directories...');
  
  const mdPath = path.join(__dirname, '../additional_free_directories_for_directorybolt.md');
  const content = fs.readFileSync(mdPath, 'utf8');
  
  const directories = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match pattern: number. **Name** - URL (DA: XX)
    const match = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*-\s*(https?:\/\/[^\s]+)(?:\s*\(DA:\s*(\d+)\))?/);
    
    if (match) {
      const [, name, url, daString] = match;
      const cleanedUrl = cleanUrl(url);
      const da = daString ? parseInt(daString) : getDomainAuthority(cleanedUrl);
      
      // Determine category based on context
      let category = 'business_general';
      if (name.toLowerCase().includes('health') || name.toLowerCase().includes('medical')) {
        category = 'healthcare';
      } else if (name.toLowerCase().includes('legal') || name.toLowerCase().includes('law')) {
        category = 'legal';
      } else if (name.toLowerCase().includes('real estate') || name.toLowerCase().includes('zillow')) {
        category = 'real_estate';
      } else if (name.toLowerCase().includes('tech') || name.toLowerCase().includes('startup')) {
        category = 'tech_startups';
      } else if (name.toLowerCase().includes('review') || name.toLowerCase().includes('rating')) {
        category = 'review_platforms';
      } else if (name.toLowerCase().includes('social') || name.toLowerCase().includes('community')) {
        category = 'social_media';
      }
      
      directories.push({
        id: `md-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: name,
        website: cleanedUrl,
        submissionUrl: cleanedUrl,
        category: category,
        domainAuthority: da,
        priority: getPriorityTier(da),
        difficulty: getDifficulty(da, category, null),
        description: `${name} directory listing`,
        features: [],
        businessTypes: [],
        pricing: 'free',
        trafficPotential: Math.max(100, da * 10),
        submissionRequirements: {},
        formFields: [],
        source: 'markdown'
      });
    }
  }
  
  console.log(`✅ Parsed ${directories.length} directories from Markdown`);
  return directories;
}

// Generate SQL insert statements
function generateSqlInserts(directories) {
  console.log('🔧 Generating SQL insert statements...');
  
  const sqlStatements = [];
  
  // Add header comment
  sqlStatements.push(`-- DirectoryBolt Directory Import`);
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
  sqlStatements.push(`-- Total directories: ${directories.length}`);
  sqlStatements.push(`-- Sources: JSON (489) + Markdown (${directories.filter(d => d.source === 'markdown').length})`);
  sqlStatements.push('');
  
  // Generate insert statements in batches
  const batchSize = 50;
  for (let i = 0; i < directories.length; i += batchSize) {
    const batch = directories.slice(i, i + batchSize);
    
    sqlStatements.push(`-- Batch ${Math.floor(i / batchSize) + 1}: Directories ${i + 1}-${Math.min(i + batchSize, directories.length)}`);
    sqlStatements.push('INSERT INTO directories (');
    sqlStatements.push('    name, website, category_id, da_score, priority_tier,');
    sqlStatements.push('    success_rate, description, submission_requirements,');
    sqlStatements.push('    form_fields, submission_difficulty, business_types,');
    sqlStatements.push('    pricing_model, features, metadata');
    sqlStatements.push(') VALUES');
    
    const values = batch.map((dir, index) => {
      const isLast = index === batch.length - 1;
      
      return `    (
        ${sqlSafe(dir.name)},
        ${sqlSafe(dir.website)},
        get_category_id('${dir.category}'),
        ${dir.domainAuthority},
        '${dir.priority}',
        0.70,
        ${sqlSafe(dir.description)},
        '${JSON.stringify(dir.submissionRequirements)}'::jsonb,
        '${JSON.stringify(dir.formFields)}'::jsonb,
        ${dir.difficulty},
        '${JSON.stringify(dir.businessTypes)}'::jsonb,
        '${dir.pricing}',
        '${JSON.stringify(dir.features)}'::jsonb,
        '{"source": "${dir.source}", "id": "${dir.id}", "traffic_potential": ${dir.trafficPotential}}'::jsonb
    )${isLast ? ';' : ','}`;
    });
    
    sqlStatements.push(...values);
    sqlStatements.push('');
  }
  
  // Add verification query
  sqlStatements.push('-- Verification query');
  sqlStatements.push('SELECT ');
  sqlStatements.push('    COUNT(*) as total_directories,');
  sqlStatements.push('    COUNT(CASE WHEN metadata->>"source" = \'json\' THEN 1 END) as json_directories,');
  sqlStatements.push('    COUNT(CASE WHEN metadata->>"source" = \'markdown\' THEN 1 END) as markdown_directories,');
  sqlStatements.push('    AVG(da_score) as average_da,');
  sqlStatements.push('    COUNT(CASE WHEN priority_tier = \'High\' THEN 1 END) as high_priority,');
  sqlStatements.push('    COUNT(CASE WHEN priority_tier = \'Medium\' THEN 1 END) as medium_priority,');
  sqlStatements.push('    COUNT(CASE WHEN priority_tier = \'Low\' THEN 1 END) as low_priority');
  sqlStatements.push('FROM directories WHERE metadata->>"source" IN (\'json\', \'markdown\');');
  
  return sqlStatements.join('\n');
}

// Main execution
async function main() {
  console.log('🚀 DirectoryBolt Directory Import Starting...');
  console.log('=====================================');
  
  try {
    // Parse both sources
    const jsonDirectories = parseJsonDirectories();
    const markdownDirectories = parseMarkdownDirectories();
    
    // Combine all directories
    const allDirectories = [...jsonDirectories, ...markdownDirectories];
    
    console.log('\n📈 Import Summary:');
    console.log(`   JSON directories: ${jsonDirectories.length}`);
    console.log(`   Markdown directories: ${markdownDirectories.length}`);
    console.log(`   Total directories: ${allDirectories.length}`);
    
    // Category breakdown
    const categoryStats = {};
    allDirectories.forEach(dir => {
      categoryStats[dir.category] = (categoryStats[dir.category] || 0) + 1;
    });
    
    console.log('\n📊 Category Breakdown:');
    Object.entries(categoryStats).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
    
    // Generate SQL
    const sqlContent = generateSqlInserts(allDirectories);
    
    // Write SQL file
    const outputPath = path.join(__dirname, '../migrations/025_import_all_directories.sql');
    fs.writeFileSync(outputPath, sqlContent);
    
    console.log('\n✅ Import Complete!');
    console.log(`📁 SQL file generated: ${outputPath}`);
    console.log(`🎯 Ready to import ${allDirectories.length} directories into database`);
    
    // Generate summary file
    const summaryPath = path.join(__dirname, '../migrations/directory-import-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalDirectories: allDirectories.length,
      sources: {
        json: jsonDirectories.length,
        markdown: markdownDirectories.length
      },
      categories: categoryStats,
      averageDomainAuthority: allDirectories.reduce((sum, d) => sum + d.domainAuthority, 0) / allDirectories.length,
      priorityDistribution: {
        high: allDirectories.filter(d => d.priority === 'High').length,
        medium: allDirectories.filter(d => d.priority === 'Medium').length,
        low: allDirectories.filter(d => d.priority === 'Low').length
      }
    }, null, 2));
    
    console.log(`📊 Summary saved: ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { parseJsonDirectories, parseMarkdownDirectories, generateSqlInserts };