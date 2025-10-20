const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Normalize URL to handle /submit differences
function normalizeUrl(url) {
  return url
    .replace(/\/submit.*$/, '') // Remove /submit and everything after
    .replace(/\/$/, ''); // Remove trailing slash
}

// Map CSV categories to database categories
function mapCategory(csvCategory) {
  const categoryMap = {
    'AI Tools': 'ai_tools',
    'Tech Startups': 'tech_startups',
    'SaaS': 'saas',
    'Social Media': 'social_media',
    'Content Media': 'content_media',
    'Ecommerce': 'ecommerce',
    'Local Business': 'local_business',
    'Business General': 'business_general'
  };
  return categoryMap[csvCategory] || 'business_general';
}

// Map impact level to standardized format
function mapImpactLevel(impactLevel) {
  const levelMap = {
    'Low-Medium': 'Medium',
    'Medium-High': 'High',
    'Low': 'Low',
    'Medium': 'Medium',
    'High': 'High'
  };
  return levelMap[impactLevel] || 'Medium';
}

// Map difficulty to standardized format
function mapDifficulty(difficulty) {
  const difficultyMap = {
    'Easy': 'Easy',
    'Easy-Medium': 'Medium',
    'Medium': 'Medium',
    'Medium-Hard': 'Hard',
    'Hard': 'Hard'
  };
  return difficultyMap[difficulty] || 'Medium';
}

// Parse traffic estimate to number
function parseTrafficEstimate(trafficStr) {
  if (!trafficStr || trafficStr === '<5K') return 5000;
  if (trafficStr === '5K-10K') return 7500;
  if (trafficStr === '10K-50K') return 30000;
  if (trafficStr === '50K-100K') return 75000;
  if (trafficStr === '100K-500K') return 300000;
  if (trafficStr === '500K-1M') return 750000;
  if (trafficStr === '1M+') return 1500000;
  return 10000;
}

// Determine if captcha means requires approval
function requiresApproval(hasCaptcha, difficulty) {
  return hasCaptcha === 'Yes' || difficulty === 'Hard' || difficulty === 'Medium-Hard';
}

// Parse CSV manually
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const match = line.match(/^([^,]+),"([^"]+)",([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^,]+)$/);
    if (!match) {
      console.warn(`⚠️  Skipping malformed line ${i + 1}`);
      continue;
    }
    
    const [, id, name, url, category, da, impactLevel, tier, difficulty, traffic, timeToApproval, hasCaptcha] = match;
    
    rows.push({
      id: id.trim(),
      name: name.trim(),
      submissionUrl: url.trim(), // Keep original URL for submission_url
      websiteUrl: normalizeUrl(url.trim()), // Normalized URL for matching
      category: category.trim(),
      domainAuthority: parseInt(da.trim()) || 50,
      impactLevel: impactLevel.trim(),
      tierLevel: parseInt(tier.trim()) || 4,
      difficulty: difficulty.trim(),
      trafficEstimate: traffic.trim(),
      timeToApproval: timeToApproval.trim(),
      hasCaptcha: hasCaptcha.trim()
    });
  }
  
  return rows;
}

// Transform CSV row to database format
function transformToDatabase(row) {
  return {
    name: row.name,
    website: row.websiteUrl,
    category: mapCategory(row.category),
    domain_authority: row.domainAuthority,
    impact_level: mapImpactLevel(row.impactLevel),
    submission_url: row.submissionUrl, // Use the full submission URL
    tier_required: row.tierLevel,
    difficulty: mapDifficulty(row.difficulty),
    active: true,
    estimated_traffic: parseTrafficEstimate(row.trafficEstimate),
    time_to_approval: row.timeToApproval,
    price: 0,
    features: JSON.stringify([]),
    requires_approval: requiresApproval(row.hasCaptcha, row.difficulty),
    country_code: 'US',
    language: 'en',
    description: `${row.name} is a ${row.category.toLowerCase()} directory with a domain authority of ${row.domainAuthority}.`
  };
}

async function main() {
  console.log('📖 Starting smart directory import...\n');
  
  const csvPath = path.join(__dirname, 'directories', 'NEW VERIFIED DIRECTORIES-641.csv');
  
  // Parse CSV
  console.log('📊 Parsing CSV file...');
  const rows = parseCSV(csvPath);
  console.log(`✅ Parsed ${rows.length} directories\n`);
  
  // Check existing directories
  console.log('🔍 Checking existing directories in database...');
  const { data: existing, error: fetchError } = await supabase
    .from('directories')
    .select('id, website, name, submission_url');
  
  if (fetchError) {
    console.error('❌ Error fetching existing directories:', fetchError);
    process.exit(1);
  }
  
  console.log(`📊 Found ${existing.length} existing directories in database\n`);
  
  // Create normalized lookup map
  const existingByNormalizedUrl = new Map();
  const existingByName = new Map();
  
  existing.forEach(dir => {
    const normalizedUrl = normalizeUrl(dir.website);
    existingByNormalizedUrl.set(normalizedUrl, dir);
    existingByName.set(dir.name.toLowerCase(), dir);
  });
  
  // Prepare data for import
  const toInsert = [];
  const toUpdateUrl = []; // Update submission_url for existing directories
  const stats = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  for (const row of rows) {
    const dbRow = transformToDatabase(row);
    const existingByUrl = existingByNormalizedUrl.get(row.websiteUrl);
    const existingByNameMatch = existingByName.get(row.name.toLowerCase());
    
    if (existingByUrl) {
      // Update submission_url if it's different and more specific
      if (!existingByUrl.submission_url || existingByUrl.submission_url === existingByUrl.website) {
        toUpdateUrl.push({
          id: existingByUrl.id,
          name: existingByUrl.name,
          submission_url: row.submissionUrl,
          domain_authority: dbRow.domain_authority,
          tier_required: dbRow.tier_required,
          difficulty: dbRow.difficulty,
          estimated_traffic: dbRow.estimated_traffic,
          time_to_approval: dbRow.time_to_approval
        });
      } else {
        stats.skipped++;
      }
    } else if (existingByNameMatch) {
      // Same name but different URL - skip to avoid conflicts
      stats.skipped++;
    } else {
      toInsert.push(dbRow);
    }
  }
  
  console.log('📋 Import Summary:');
  console.log(`   To Insert: ${toInsert.length} new directories`);
  console.log(`   To Update: ${toUpdateUrl.length} existing directories (add submission URLs)`);
  console.log(`   Skipped: ${stats.skipped} already complete\n`);
  
  // Insert new directories in batches
  if (toInsert.length > 0) {
    console.log('💾 Inserting new directories...');
    const batchSize = 50;
    
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('directories')
        .insert(batch)
        .select('name');
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        stats.errors++;
      } else {
        stats.inserted += data.length;
        console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toInsert.length / batchSize)} (${stats.inserted} total)`);
      }
    }
    console.log(`\n✅ Successfully inserted ${stats.inserted} new directories\n`);
  }
  
  // Update existing directories with submission URLs
  if (toUpdateUrl.length > 0) {
    console.log('🔄 Updating existing directories with submission URLs...');
    
    for (const dir of toUpdateUrl) {
      const { error } = await supabase
        .from('directories')
        .update({
          submission_url: dir.submission_url,
          domain_authority: dir.domain_authority,
          tier_required: dir.tier_required,
          difficulty: dir.difficulty,
          estimated_traffic: dir.estimated_traffic,
          time_to_approval: dir.time_to_approval
        })
        .eq('id', dir.id);
      
      if (error) {
        console.error(`❌ Error updating ${dir.name}:`, error.message);
        stats.errors++;
      } else {
        stats.updated++;
        if (stats.updated % 50 === 0) {
          console.log(`   Updated ${stats.updated}/${toUpdateUrl.length}...`);
        }
      }
    }
    console.log(`\n✅ Successfully updated ${stats.updated} directories\n`);
  }
  
  // Final summary
  console.log('📊 Final Summary:');
  console.log(`   ✅ Inserted: ${stats.inserted}`);
  console.log(`   🔄 Updated: ${stats.updated}`);
  console.log(`   ⏭️  Skipped: ${stats.skipped}`);
  console.log(`   ❌ Errors: ${stats.errors}`);
  
  // Get final count
  const { count } = await supabase
    .from('directories')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Total directories in database: ${count}\n`);
  
  console.log('🎉 Smart directory import complete!');
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

