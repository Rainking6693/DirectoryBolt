const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function importDirectories() {
  const csvPath = path.join(__dirname, '../directories/ENHANCED-DIRECTORIES.csv');
  const directories = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      directories.push({
        name: row.name,
        correct_submission_url: row.correct_submission_url,
        category: row.category,
        domain_authority: parseInt(row.domain_authority) || null,
        impact_level: row.impact_level,
        tier_level: row.tier_level,
        difficulty: parseInt(row.difficulty) || null,
        traffic_estimate: parseInt(row.traffic_estimate) || null,
        time_to_approval: parseInt(row.time_to_approval) || null,
        has_captcha: row.has_captcha === 'true' || null
      });
    })
    .on('end', async () => {
      console.log(`Parsed ${directories.length} directories`);

      const { error } = await supabase
        .from('directories')
        .upsert(directories, { onConflict: 'correct_submission_url' });

      if (error) {
        console.error('Error importing directories:', error);
      } else {
        console.log('Successfully imported/updated directories');
      }
    });
}

importDirectories();
