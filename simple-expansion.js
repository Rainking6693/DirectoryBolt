// Simple inline execution of the directory expansion
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting inline directory expansion...');

// Read existing master directory list
const existingDataPath = path.join('directories', 'master-directory-list-486.json');
console.log('📖 Reading existing data from:', existingDataPath);

if (!fs.existsSync(existingDataPath)) {
  console.error('❌ File not found:', existingDataPath);
  process.exit(1);
}

const existingData = JSON.parse(fs.readFileSync(existingDataPath, 'utf8'));
console.log(`📊 Existing directories: ${existingData.directories.length}`);

// Sample of new directories to add (first 20 from our research)
const newDirectories = [
  {
    id: "glassdoor",
    name: "Glassdoor",
    url: "https://www.glassdoor.com/",
    submissionUrl: "https://www.glassdoor.com/employers/post-job",
    category: "general-directory",
    domainAuthority: 90,
    difficulty: "hard",
    priority: "high",
    trafficPotential: 45000,
    requiresLogin: true,
    hasCaptcha: true,
    tier: 3
  },
  {
    id: "bizcommunity",
    name: "Bizcommunity",
    url: "https://www.bizcommunity.com/",
    submissionUrl: "https://www.bizcommunity.com/SubmitNews.aspx",
    category: "general-directory",
    domainAuthority: 77,
    difficulty: "medium",
    priority: "high",
    trafficPotential: 25000,
    requiresLogin: true,
    hasCaptcha: false,
    tier: 2
  },
  {
    id: "healthgrades",
    name: "Healthgrades",
    url: "https://www.healthgrades.com/",
    submissionUrl: "https://www.healthgrades.com/provider/join",
    category: "healthcare",
    domainAuthority: 85,
    difficulty: "hard",
    priority: "high",
    trafficPotential: 30000,
    requiresLogin: true,
    hasCaptcha: true,
    tier: 3
  },
  {
    id: "avvo",
    name: "Avvo",
    url: "https://www.avvo.com/",
    submissionUrl: "https://www.avvo.com/lawyers/join",
    category: "legal",
    domainAuthority: 70,
    difficulty: "medium",
    priority: "high",
    trafficPotential: 18000,
    requiresLogin: true,
    hasCaptcha: false,
    tier: 2
  },
  {
    id: "zillow",
    name: "Zillow",
    url: "https://www.zillow.com/",
    submissionUrl: "https://www.zillow.com/agent-resources/",
    category: "real-estate",
    domainAuthority: 95,
    difficulty: "hard",
    priority: "high",
    trafficPotential: 50000,
    requiresLogin: true,
    hasCaptcha: true,
    tier: 3
  }
];

// Standard form mapping
const standardFormMapping = {
  businessName: ["#business-name", "input[name='business_name']", "input[name='company']", "input[name='name']"],
  email: ["#email", "input[name='email']", "input[type='email']"],
  phone: ["#phone", "input[name='phone']", "input[type='tel']"],
  website: ["#website", "input[name='website']", "input[name='url']"],
  address: ["#address", "input[name='address']", "#street-address"],
  city: ["#city", "input[name='city']"],
  state: ["#state", "select[name='state']"],
  zip: ["#zip", "input[name='zip']", "input[name='postal_code']"],
  category: ["#category", "select[name='category']"],
  description: ["#description", "textarea[name='description']"]
};

// Process new directories
const processedNewDirectories = newDirectories.map((dir, index) => ({
  ...dir,
  formMapping: standardFormMapping,
  submitSelector: "#submit-btn, button[type='submit'], .submit-button",
  successIndicators: [".success-message", "h1:contains('Success')", ".confirmation"],
  features: ["Business listing", "Contact information", "Business description"],
  timeToApproval: dir.difficulty === "easy" ? "1-3 days" : dir.difficulty === "medium" ? "3-7 days" : "7-14 days",
  isActive: true,
  requiresApproval: dir.difficulty !== "easy",
  originalExcelRow: 500 + index
}));

// Combine directories
const allDirectories = [...existingData.directories, ...processedNewDirectories];

// Calculate metadata
const categoryCount = {};
allDirectories.forEach(dir => {
  categoryCount[dir.category] = (categoryCount[dir.category] || 0) + 1;
});

// Create expanded list
const expandedList = {
  metadata: {
    ...existingData.metadata,
    version: "5.0.0",
    lastUpdated: "2025-09-07",
    totalDirectories: allDirectories.length,
    description: `Expanded DirectoryBolt database with ${allDirectories.length} directories including industry-specific categories`,
    categories: categoryCount,
    expansionDetails: {
      originalDirectories: existingData.directories.length,
      newDirectoriesAdded: processedNewDirectories.length,
      newCategories: ["healthcare", "legal", "real-estate"]
    }
  },
  directories: allDirectories
};

// Save the expanded list
const outputPath = path.join('directories', 'master-directory-list-expanded.json');
fs.writeFileSync(outputPath, JSON.stringify(expandedList, null, 2));

console.log(`✅ Successfully created expanded directory list!`);
console.log(`📊 Total directories: ${allDirectories.length}`);
console.log(`📈 Added ${processedNewDirectories.length} new directories`);
console.log(`📁 File saved as: ${outputPath}`);
console.log(`📋 New categories added: healthcare, legal, real-estate`);

// Verify the file was created
if (fs.existsSync(outputPath)) {
  const stats = fs.statSync(outputPath);
  console.log(`📊 File size: ${Math.round(stats.size / 1024)} KB`);
} else {
  console.error('❌ Failed to create output file');
}