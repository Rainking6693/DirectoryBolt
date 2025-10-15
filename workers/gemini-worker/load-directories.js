/**
 * Directory Loader for Gemini Worker
 * Loads and filters the complete directory database (543+ directories)
 */

const fs = require('fs');
const path = require('path');

class DirectoryLoader {
  constructor() {
    this.directories = [];
    this.loaded = false;
  }

  /**
   * Load directories from the complete database
   */
  loadDirectories() {
    try {
      const dbPath = path.join(__dirname, '../../directories/complete-directory-database.json');
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      
      this.directories = data.directories || [];
      this.loaded = true;
      
      console.log(`✅ Loaded ${this.directories.length} directories from database`);
      return this.directories;
    } catch (error) {
      console.error('❌ Failed to load directories:', error.message);
      
      // Fallback to 486 list if complete database fails
      try {
        const fallbackPath = path.join(__dirname, '../../directories/master-directory-list-486.json');
        const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        this.directories = fallbackData.directories || [];
        this.loaded = true;
        
        console.log(`✅ Loaded ${this.directories.length} directories from fallback`);
        return this.directories;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        throw new Error('Could not load any directory database');
      }
    }
  }

  /**
   * Filter directories by difficulty
   * @param {string} difficulty - 'easy', 'medium', or 'hard'
   */
  filterByDifficulty(difficulty) {
    if (!this.loaded) this.loadDirectories();
    
    const difficultyMap = {
      'easy': [1, 2],      // submission_difficulty 1-2
      'medium': [3, 4],    // submission_difficulty 3-4
      'hard': [5]          // submission_difficulty 5
    };
    
    const levels = difficultyMap[difficulty.toLowerCase()] || [];
    
    const filtered = this.directories.filter(dir => {
      // Check submission_difficulty field
      if (dir.submission_difficulty && levels.includes(dir.submission_difficulty)) {
        return true;
      }
      
      // Check difficulty string field
      if (dir.difficulty === difficulty.toLowerCase()) {
        return true;
      }
      
      return false;
    });
    
    console.log(`📊 Filtered ${filtered.length} ${difficulty} directories`);
    return filtered;
  }

  /**
   * Get CAPTCHA-free directories (easy difficulty)
   */
  getCaptchaFreeDirectories() {
    if (!this.loaded) this.loadDirectories();
    
    // Filter for directories without CAPTCHA and not requiring login
    const captchaFree = this.directories.filter(dir => {
      // Check hasCaptcha field
      if (dir.hasCaptcha === false && dir.requiresLogin === false) {
        return true;
      }
      
      // If difficulty is easy and no captcha mentioned
      if (dir.difficulty === 'easy' && !dir.hasCaptcha && !dir.requiresLogin) {
        return true;
      }
      
      return false;
    });
    
    console.log(`🚫 Found ${captchaFree.length} CAPTCHA-free directories`);
    
    // If no explicitly CAPTCHA-free, return easy difficulty ones
    if (captchaFree.length === 0) {
      console.log('⚠️ No explicitly CAPTCHA-free directories, using easy difficulty');
      return this.filterByDifficulty('easy');
    }
    
    return captchaFree;
  }

  /**
   * Get batch of directories for testing
   * @param {number} count - Number of directories to get
   * @param {string} difficulty - Optional difficulty filter
   */
  getTestBatch(count = 10, difficulty = 'easy') {
    const filtered = difficulty ? this.filterByDifficulty(difficulty) : this.getCaptchaFreeDirectories();
    const batch = filtered.slice(0, count);
    
    console.log(`🧪 Test batch: ${batch.length} directories`);
    batch.forEach((dir, i) => {
      console.log(`  ${i + 1}. ${dir.name} (DA: ${dir.domain_authority || 'N/A'})`);
    });
    
    return batch;
  }

  /**
   * Get directories by tier
   * @param {number} tier - 1, 2, or 3
   */
  getByTier(tier) {
    if (!this.loaded) this.loadDirectories();
    
    return this.directories.filter(dir => dir.tier === tier);
  }

  /**
   * Get statistics about loaded directories
   */
  getStats() {
    if (!this.loaded) this.loadDirectories();
    
    const stats = {
      total: this.directories.length,
      byDifficulty: {
        easy: this.filterByDifficulty('easy').length,
        medium: this.filterByDifficulty('medium').length,
        hard: this.filterByDifficulty('hard').length
      },
      byTier: {
        tier1: this.getByTier(1).length,
        tier2: this.getByTier(2).length,
        tier3: this.getByTier(3).length
      },
      captchaFree: this.getCaptchaFreeDirectories().length
    };
    
    return stats;
  }

  /**
   * Print detailed statistics
   */
  printStats() {
    const stats = this.getStats();
    
    console.log('\n📊 Directory Database Statistics:');
    console.log('═'.repeat(50));
    console.log(`Total Directories: ${stats.total}`);
    console.log('\nBy Difficulty:');
    console.log(`  Easy:   ${stats.byDifficulty.easy} (${Math.round(stats.byDifficulty.easy/stats.total*100)}%)`);
    console.log(`  Medium: ${stats.byDifficulty.medium} (${Math.round(stats.byDifficulty.medium/stats.total*100)}%)`);
    console.log(`  Hard:   ${stats.byDifficulty.hard} (${Math.round(stats.byDifficulty.hard/stats.total*100)}%)`);
    console.log('\nBy Tier:');
    console.log(`  Tier 1: ${stats.byTier.tier1}`);
    console.log(`  Tier 2: ${stats.byTier.tier2}`);
    console.log(`  Tier 3: ${stats.byTier.tier3}`);
    console.log(`\n🚫 CAPTCHA-Free: ${stats.captchaFree} directories`);
    console.log('═'.repeat(50) + '\n');
  }

  /**
   * Get directory by name
   */
  getByName(name) {
    if (!this.loaded) this.loadDirectories();
    
    return this.directories.find(dir => 
      dir.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Search directories
   */
  search(query) {
    if (!this.loaded) this.loadDirectories();
    
    const lowerQuery = query.toLowerCase();
    return this.directories.filter(dir => 
      dir.name.toLowerCase().includes(lowerQuery) ||
      (dir.description && dir.description.toLowerCase().includes(lowerQuery))
    );
  }
}

module.exports = DirectoryLoader;

