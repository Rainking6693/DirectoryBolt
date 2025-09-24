const fs = require('fs');
const path = require('path');

// Load directory data
const dataPath = path.join(__dirname, '..', 'lib', 'data', 'master-directory-list.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('EMERGENCY DIRECTORY AUDIT - Hudson Requirements Check\n');

let templateCount = 0;
let fakeUrls = 0;
let noFormMapping = 0;
let problematicEntries = [];
let highValueDirectories = [];

// Define high-value directories that premium customers expect
const premiumExpected = [
  'google', 'yelp', 'facebook', 'linkedin', 'instagram', 'twitter', 'youtube',
  'tripadvisor', 'foursquare', 'yellowpages', 'bbb', 'angie', 'thumbtack',
  'nextdoor', 'glassdoor', 'indeed', 'apple', 'amazon', 'walmart', 'target'
];

data.directories.forEach((dir, index) => {
  // Check for template/fake indicators
  const hasTemplateText = dir.name.toLowerCase().includes('template') || 
                         dir.name.toLowerCase().includes('example') || 
                         dir.name.toLowerCase().includes('sample') ||
                         (dir.description && (
                           dir.description.toLowerCase().includes('example') || 
                           dir.description.toLowerCase().includes('template') ||
                           dir.description.toLowerCase().includes('sample') ||
                           dir.description.toLowerCase().includes('placeholder')
                         ));
  
  // Check for fake URLs
  const hasFakeUrl = dir.url.includes('example.com') || 
                    dir.url.includes('placeholder') ||
                    dir.url.includes('fake') ||
                    dir.url.includes('test.com') ||
                    dir.url === 'https://example.com' ||
                    dir.url === 'http://example.com' ||
                    !dir.url.startsWith('http');
  
  // Check for missing form mappings
  const hasFormMapping = dir.formMapping && Object.keys(dir.formMapping).length > 0;
  
  // Check if it's a high-value directory
  const isHighValue = premiumExpected.some(premium => 
    dir.name.toLowerCase().includes(premium) || 
    dir.url.toLowerCase().includes(premium)
  );
  
  if (hasTemplateText) templateCount++;
  if (hasFakeUrl) fakeUrls++;
  if (!hasFormMapping) noFormMapping++;
  
  // Track problematic entries for removal
  if (hasTemplateText || hasFakeUrl) {
    problematicEntries.push({
      index,
      name: dir.name,
      url: dir.url,
      issues: [
        ...(hasTemplateText ? ['template_text'] : []),
        ...(hasFakeUrl ? ['fake_url'] : [])
      ]
    });
  }
  
  // Track high-value directories
  if (isHighValue) {
    highValueDirectories.push({
      name: dir.name,
      url: dir.url,
      hasFormMapping,
      isActive: dir.isActive !== false
    });
  }
});

console.log('HUDSON REJECTION ANALYSIS:');
console.log(`Total directories: ${data.directories.length}`);
console.log(`Template/fake entries to remove: ${templateCount}`);
console.log(`Fake URLs to remove: ${fakeUrls}`);
console.log(`Missing form mappings: ${noFormMapping}`);
console.log(`Current form mapping rate: ${((data.directories.length - noFormMapping) / data.directories.length * 100).toFixed(1)}%`);
console.log(`High-value directories found: ${highValueDirectories.length}`);

console.log('\nPROBLEMATIC ENTRIES TO REMOVE:');
problematicEntries.slice(0, 20).forEach(entry => {
  console.log(`- ${entry.name} (${entry.url}) - Issues: ${entry.issues.join(', ')}`);
});

if (problematicEntries.length > 20) {
  console.log(`... and ${problematicEntries.length - 20} more problematic entries`);
}

console.log('\nHIGH-VALUE DIRECTORIES STATUS:');
highValueDirectories.forEach(dir => {
  console.log(`- ${dir.name}: ${dir.hasFormMapping ? 'HAS MAPPING' : 'MISSING MAPPING'} | ${dir.isActive ? 'ACTIVE' : 'INACTIVE'}`);
});

// Calculate what the clean data would look like
const cleanCount = data.directories.length - problematicEntries.length;
const cleanMappingRate = ((cleanCount - (noFormMapping - problematicEntries.filter(p => p.issues.includes('template_text')).length)) / cleanCount * 100);

console.log('\nPROJECTED AFTER CLEANUP:');
console.log(`Clean directories: ${cleanCount}`);
console.log(`Projected form mapping rate: ${cleanMappingRate.toFixed(1)}%`);

// Export results for processing
const auditResults = {
  totalDirectories: data.directories.length,
  problematicEntries,
  highValueDirectories,
  cleanProjection: {
    count: cleanCount,
    mappingRate: cleanMappingRate
  }
};

fs.writeFileSync(
  path.join(__dirname, 'emergency-audit-results.json'),
  JSON.stringify(auditResults, null, 2)
);

console.log('\nAudit results saved to emergency-audit-results.json');