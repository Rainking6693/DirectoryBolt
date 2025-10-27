/**
 * Task 1.1: Directory Database Schema Import Test
 * Tests CSV parsing, row count, and query performance
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

describe('Task 1.1: Directory Import', () => {
  test('CSV file exists and is readable', () => {
    const csvPath = path.join(__dirname, '../directories/ENHANCED-DIRECTORIES.csv');
    expect(fs.existsSync(csvPath)).toBe(true);
  });

  test('CSV parsing returns correct number of rows', (done) => {
    const csvPath = path.join(__dirname, '../directories/ENHANCED-DIRECTORIES.csv');
    const rows = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', () => {
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBe(832); // Expected row count
        done();
      });
  });

  test('Database has correct number of directories', async () => {
    const { count, error } = await supabase
      .from('directories')
      .select('*', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBe(832);
  });

  test('Directory schema has all required columns', async () => {
    const { data, error } = await supabase
      .from('directories')
      .select('*')
      .limit(1)
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('correct_submission_url');
    expect(data).toHaveProperty('category');
    expect(data).toHaveProperty('domain_authority');
    expect(data).toHaveProperty('impact_level');
    expect(data).toHaveProperty('tier_level');
    expect(data).toHaveProperty('difficulty');
    expect(data).toHaveProperty('traffic_estimate');
    expect(data).toHaveProperty('time_to_approval');
    expect(data).toHaveProperty('has_captcha');
  });

  test('Query performance is under 100ms', async () => {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('directories')
      .select('*')
      .limit(100);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toHaveLength(100);
    expect(queryTime).toBeLessThan(100);
  });

  test('Indexes are created correctly', async () => {
    // This would require direct database access to check indexes
    // For now, we'll verify that queries using indexed columns are fast
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('directories')
      .select('*')
      .eq('name', 'Product Hunt')
      .single();

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(50); // Should be very fast with index
  });

  test('Constraints are enforced', async () => {
    // Test difficulty constraint (1-10)
    const { error: difficultyError } = await supabase
      .from('directories')
      .insert([
        {
          name: 'Test Directory',
          correct_submission_url: 'https://test.com',
          difficulty: 15, // Invalid - should fail
        },
      ]);

    expect(difficultyError).not.toBeNull();
    expect(difficultyError.message).toContain('difficulty');
  });

  test('Unique constraint on submission URL', async () => {
    // Get an existing URL
    const { data: existing } = await supabase
      .from('directories')
      .select('correct_submission_url')
      .limit(1)
      .single();

    // Try to insert duplicate
    const { error } = await supabase
      .from('directories')
      .insert([
        {
          name: 'Duplicate Test',
          correct_submission_url: existing.correct_submission_url,
        },
      ]);

    expect(error).not.toBeNull();
    expect(error.message).toContain('unique');
  });
});
