const fs = require('fs');
const path = require('path');

console.log('HUDSON SQL DIRECTORY ANALYSIS - Emergency Audit\n');

// Read the SQL file
const sqlPath = path.join(__dirname, '..', 'migrations', '025_import_all_directories.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Extract INSERT statements for directories
const directoryInserts = sqlContent.match(/INSERT INTO directories[^;]+;/gs) || [];

console.log(`Found ${directoryInserts.length} INSERT statements\n`);

let totalDirectories = 0;
let templateEntries = [];
let fakeUrls = [];
let missingFormMappings = 0;
let premiumDirectories = [];
let allDirectories = [];

// Define premium directories that customers expect
const premiumExpected = [
  'google', 'yelp', 'facebook', 'linkedin', 'instagram', 'twitter', 'youtube',
  'tripadvisor', 'foursquare', 'yellowpages', 'bbb', 'angie', 'thumbtack',
  'nextdoor', 'glassdoor', 'indeed', 'apple', 'amazon', 'walmart', 'target',
  'expedia', 'booking', 'airbnb', 'uber', 'lyft', 'doordash', 'grubhub'
];

directoryInserts.forEach((insertStatement, index) => {
  // Extract VALUES section
  const valuesMatch = insertStatement.match(/VALUES\s*([\s\S]+?)(?=;)/);
  if (!valuesMatch) return;
  
  const valuesSection = valuesMatch[1];
  
  // Parse individual directory entries (simplified parsing)
  const entries = valuesSection.split(/\),\s*\(/);
  
  entries.forEach((entry, entryIndex) => {
    totalDirectories++;
    
    // Clean up the entry
    entry = entry.replace(/^\(/, '').replace(/\)$/, '');
    
    // Extract values (this is a simplified parser)
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0;
    
    for (let i = 0; i < entry.length; i++) {
      const char = entry[i];
      
      if ((char === "'" || char === '"') && entry[i-1] !== '\\\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        }
      }
      
      if (char === '(' && !inQuotes) parenDepth++;
      if (char === ')' && !inQuotes) parenDepth--;
      
      if (char === ',' && !inQuotes && parenDepth === 0) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    if (values.length >= 4) {
      const name = values[0].replace(/^'|'$/g, '').replace(/\\'/g, "'");
      const website = values[1].replace(/^'|'$/g, '');
      
      const directory = {
        name: name,
        website: website,
        index: totalDirectories
      };
      
      allDirectories.push(directory);
      
      // Check for template/fake indicators
      const hasTemplateText = name.toLowerCase().includes('template') || 
                             name.toLowerCase().includes('example') || 
                             name.toLowerCase().includes('sample') ||
                             name.toLowerCase().includes('test') ||
                             name.toLowerCase().includes('placeholder') ||
                             name.toLowerCase().includes('demo');
      
      // Check for fake URLs
      const hasFakeUrl = website.includes('example.com') || 
                        website.includes('placeholder') ||
                        website.includes('fake') ||
                        website.includes('test.com') ||
                        website.includes('demo.com') ||
                        website === 'https://example.com' ||
                        website === 'http://example.com' ||
                        !website.startsWith('http');
      
      // Check if it's a premium directory
      const isPremium = premiumExpected.some(premium => 
        name.toLowerCase().includes(premium) || 
        website.toLowerCase().includes(premium)
      );
      
      if (hasTemplateText) {
        templateEntries.push({name, website, reason: 'template_text'});
      }
      
      if (hasFakeUrl) {
        fakeUrls.push({name, website, reason: 'fake_url'});
      }
      
      if (isPremium) {
        premiumDirectories.push({name, website});
      }
      
      // Basic form mapping check (this is simplified)
      const hasFormFields = entry.includes('form_fields') && entry.includes('[') && !entry.includes('[]');
      if (!hasFormFields) {
        missingFormMappings++;
      }
    }
  });
});

console.log('HUDSON ANALYSIS RESULTS:');
console.log(`Total directories in SQL: ${totalDirectories}`);
console.log(`Template/fake entries: ${templateEntries.length}`);
console.log(`Fake URLs: ${fakeUrls.length}`);
console.log(`Missing form mappings: ${missingFormMappings}`);
console.log(`Form mapping rate: ${((totalDirectories - missingFormMappings) / totalDirectories * 100).toFixed(1)}%`);
console.log(`Premium directories found: ${premiumDirectories.length}`);

console.log('\\nTEMPLATE/FAKE ENTRIES TO REMOVE:');
[...templateEntries, ...fakeUrls].slice(0, 20).forEach(entry => {
  console.log(`- ${entry.name} (${entry.website}) - ${entry.reason}`);
});

console.log('\\nPREMIUM DIRECTORIES STATUS:');
premiumDirectories.slice(0, 15).forEach(dir => {
  console.log(`- ${dir.name} (${dir.website})`);
});

// Calculate projected clean data
const problematicCount = new Set([
  ...templateEntries.map(e => e.name),
  ...fakeUrls.map(e => e.name)
]).size;

const cleanCount = totalDirectories - problematicCount;
const projectedMappingRate = ((cleanCount - (missingFormMappings * 0.7)) / cleanCount * 100);

console.log('\\nPROJECTED AFTER CLEANUP:');
console.log(`Clean directories: ${cleanCount}`);
console.log(`Projected form mapping rate: ${projectedMappingRate.toFixed(1)}%`);

// Generate report for Hudson
const hudsonReport = {
  analysis_timestamp: new Date().toISOString(),
  sql_file_analyzed: '025_import_all_directories.sql',
  total_directories: totalDirectories,
  problematic_entries: {
    template_fake_count: templateEntries.length,
    fake_urls_count: fakeUrls.length,
    total_to_remove: problematicCount
  },
  form_mappings: {
    missing_count: missingFormMappings,
    current_rate: ((totalDirectories - missingFormMappings) / totalDirectories * 100),
    projected_rate: projectedMappingRate
  },
  premium_directories: {
    found_count: premiumDirectories.length,
    expected_count: premiumExpected.length,
    coverage: (premiumDirectories.length / premiumExpected.length * 100)
  },
  template_entries: templateEntries.slice(0, 50),
  fake_urls: fakeUrls.slice(0, 50),
  premium_found: premiumDirectories,
  projected_clean_data: {
    directory_count: cleanCount,
    mapping_rate: projectedMappingRate,
    meets_hudson_requirements: cleanCount >= 200 && projectedMappingRate >= 90
  }
};

// Save report
fs.writeFileSync(
  path.join(__dirname, 'hudson-sql-analysis-report.json'),
  JSON.stringify(hudsonReport, null, 2)
);

console.log('\\nHUDSON RE-AUDIT PROJECTION:');
console.log(`Meets 200+ directory requirement: ${cleanCount >= 200 ? 'YES' : 'NO'}`);
console.log(`Meets 90%+ mapping requirement: ${projectedMappingRate >= 90 ? 'YES' : 'NO'}`);
console.log(`\\nDetailed report saved to: hudson-sql-analysis-report.json`);