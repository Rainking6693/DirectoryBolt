#!/usr/bin/env node

/**
 * DirectoryBolt Form Mapping Extractor
 * Purpose: Extract form selector mappings from JSON directories for AutoBolt automation
 * Focus: High priority directories with detailed form mapping data
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 DirectoryBolt Form Mapping Extraction Starting...');
console.log('================================================');

// Read JSON directories
function loadDirectories() {
  const jsonPath = path.join(__dirname, '../directories/master-directory-list-expanded.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  return jsonData.directories;
}

// Extract form mappings for high-priority directories
function extractFormMappings(directories) {
  console.log('📊 Extracting form mappings from directories...');
  
  const formMappings = [];
  let directoriesWithMappings = 0;
  
  directories.forEach(dir => {
    // Focus on high priority and high DA directories
    const isHighPriority = dir.priority === 'high' || dir.domainAuthority >= 80;
    const hasFormMapping = dir.formMapping && Object.keys(dir.formMapping).length > 0;
    
    if (isHighPriority && hasFormMapping) {
      directoriesWithMappings++;
      
      formMappings.push({
        id: dir.id,
        name: dir.name,
        url: dir.url,
        submissionUrl: dir.submissionUrl || dir.url,
        domainAuthority: dir.domainAuthority,
        priority: dir.priority,
        category: dir.category,
        difficulty: dir.difficulty,
        requiresLogin: dir.requiresLogin || false,
        hasCaptcha: dir.hasCaptcha || false,
        formMapping: dir.formMapping,
        selectors: extractSelectors(dir.formMapping),
        metadata: {
          expectedFields: Object.keys(dir.formMapping || {}),
          totalSelectors: countSelectors(dir.formMapping),
          hasBusinessName: !!(dir.formMapping && dir.formMapping.businessName),
          hasEmail: !!(dir.formMapping && dir.formMapping.email),
          hasPhone: !!(dir.formMapping && dir.formMapping.phone),
          hasWebsite: !!(dir.formMapping && dir.formMapping.website),
          hasDescription: !!(dir.formMapping && dir.formMapping.description)
        }
      });
    }
  });
  
  console.log(`✅ Found ${directoriesWithMappings} directories with form mappings`);
  
  // Sort by priority and domain authority
  formMappings.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (b.priority === 'high' && a.priority !== 'high') return 1;
    return b.domainAuthority - a.domainAuthority;
  });
  
  return formMappings;
}

// Extract selectors from form mapping object
function extractSelectors(formMapping) {
  if (!formMapping) return {};
  
  const selectors = {};
  
  Object.entries(formMapping).forEach(([fieldName, fieldSelectors]) => {
    if (Array.isArray(fieldSelectors)) {
      selectors[fieldName] = {
        primary: fieldSelectors[0] || null,
        alternatives: fieldSelectors.slice(1),
        total: fieldSelectors.length
      };
    } else if (typeof fieldSelectors === 'string') {
      selectors[fieldName] = {
        primary: fieldSelectors,
        alternatives: [],
        total: 1
      };
    }
  });
  
  return selectors;
}

// Count total selectors in form mapping
function countSelectors(formMapping) {
  if (!formMapping) return 0;
  
  return Object.values(formMapping).reduce((total, selectors) => {
    if (Array.isArray(selectors)) {
      return total + selectors.length;
    } else if (typeof selectors === 'string') {
      return total + 1;
    }
    return total;
  }, 0);
}

// Generate AutoBolt-compatible mapping file
function generateAutoBoltMappings(formMappings) {
  console.log('🤖 Generating AutoBolt-compatible mappings...');
  
  const autoBoltMappings = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalDirectories: formMappings.length,
    mappings: {}
  };
  
  formMappings.forEach(dir => {
    const domain = extractDomain(dir.url);
    
    autoBoltMappings.mappings[domain] = {
      name: dir.name,
      url: dir.url,
      submissionUrl: dir.submissionUrl,
      priority: dir.priority,
      domainAuthority: dir.domainAuthority,
      difficulty: dir.difficulty,
      requiresLogin: dir.requiresLogin,
      hasCaptcha: dir.hasCaptcha,
      formSelectors: dir.selectors,
      metadata: dir.metadata
    };
  });
  
  return autoBoltMappings;
}

// Extract domain from URL
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (e) {
    return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

// Generate comprehensive mapping report
function generateMappingReport(formMappings) {
  const report = {
    summary: {
      totalDirectoriesWithMappings: formMappings.length,
      highPriority: formMappings.filter(d => d.priority === 'high').length,
      averageDomainAuthority: (formMappings.reduce((sum, d) => sum + d.domainAuthority, 0) / formMappings.length).toFixed(1),
      categoriesRepresented: [...new Set(formMappings.map(d => d.category))],
      requiresLogin: formMappings.filter(d => d.requiresLogin).length,
      hasCaptcha: formMappings.filter(d => d.hasCaptcha).length,
      averageSelectorsPerDirectory: (formMappings.reduce((sum, d) => sum + d.metadata.totalSelectors, 0) / formMappings.length).toFixed(1)
    },
    fieldCoverage: {
      businessName: formMappings.filter(d => d.metadata.hasBusinessName).length,
      email: formMappings.filter(d => d.metadata.hasEmail).length,
      phone: formMappings.filter(d => d.metadata.hasPhone).length,
      website: formMappings.filter(d => d.metadata.hasWebsite).length,
      description: formMappings.filter(d => d.metadata.hasDescription).length
    },
    topDirectories: formMappings.slice(0, 20).map(d => ({
      name: d.name,
      domain: extractDomain(d.url),
      domainAuthority: d.domainAuthority,
      priority: d.priority,
      fieldsCount: d.metadata.expectedFields.length,
      selectorsCount: d.metadata.totalSelectors
    }))
  };
  
  return report;
}

// Main execution
async function main() {
  try {
    // Load directories
    console.log('📄 Loading directories from JSON file...');
    const directories = loadDirectories();
    console.log(`📊 Loaded ${directories.length} total directories`);
    
    // Extract form mappings
    const formMappings = extractFormMappings(directories);
    
    if (formMappings.length === 0) {
      console.log('⚠️ No directories with form mappings found');
      return;
    }
    
    // Generate AutoBolt mappings
    const autoBoltMappings = generateAutoBoltMappings(formMappings);
    
    // Generate comprehensive report
    const report = generateMappingReport(formMappings);
    
    // Save form mappings file
    const mappingsPath = path.join(__dirname, '../data/form-mappings.json');
    fs.writeFileSync(mappingsPath, JSON.stringify(formMappings, null, 2));
    
    // Save AutoBolt mappings file
    const autoBoltPath = path.join(__dirname, '../data/autobolt-mappings.json');
    fs.writeFileSync(autoBoltPath, JSON.stringify(autoBoltMappings, null, 2));
    
    // Save report
    const reportPath = path.join(__dirname, '../data/form-mapping-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('\n📈 Form Mapping Extraction Summary');
    console.log('==================================');
    console.log(`✅ Directories with mappings: ${report.summary.totalDirectoriesWithMappings}`);
    console.log(`🎯 High priority directories: ${report.summary.highPriority}`);
    console.log(`📊 Average DA: ${report.summary.averageDomainAuthority}`);
    console.log(`🔑 Average selectors per directory: ${report.summary.averageSelectorsPerDirectory}`);
    console.log(`🔐 Require login: ${report.summary.requiresLogin}`);
    console.log(`🤖 Have CAPTCHA: ${report.summary.hasCaptcha}`);
    
    console.log('\n📋 Field Coverage:');
    console.log(`   Business Name: ${report.fieldCoverage.businessName}/${formMappings.length}`);
    console.log(`   Email: ${report.fieldCoverage.email}/${formMappings.length}`);
    console.log(`   Phone: ${report.fieldCoverage.phone}/${formMappings.length}`);
    console.log(`   Website: ${report.fieldCoverage.website}/${formMappings.length}`);
    console.log(`   Description: ${report.fieldCoverage.description}/${formMappings.length}`);
    
    console.log('\n🏆 Top 10 Directories by Priority/DA:');
    report.topDirectories.slice(0, 10).forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.name} (DA: ${dir.domainAuthority}, Fields: ${dir.fieldsCount}, Selectors: ${dir.selectorsCount})`);
    });
    
    console.log(`\n📁 Files generated:`);
    console.log(`   Form mappings: ${mappingsPath}`);
    console.log(`   AutoBolt mappings: ${autoBoltPath}`);
    console.log(`   Report: ${reportPath}`);
    
    // Hudson audit compliance
    if (report.summary.totalDirectoriesWithMappings >= 50) {
      console.log('\n✅ HUDSON AUDIT: 50+ directories with form mappings extracted');
    } else {
      console.log(`\n⚠️ HUDSON AUDIT: Only ${report.summary.totalDirectoriesWithMappings} directories with mappings (target: 50+)`);
    }
    
  } catch (error) {
    console.error('❌ Form mapping extraction failed:', error);
    process.exit(1);
  }
}

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { extractFormMappings, generateAutoBoltMappings };