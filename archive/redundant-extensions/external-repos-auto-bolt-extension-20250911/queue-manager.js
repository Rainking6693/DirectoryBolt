/**
 * DirectoryBolt Queue Manager - Extension Integration
 * Handles customer queue monitoring and processing coordination
 */

class DirectoryBoltQueueManager {
  constructor() {
    this.apiBase = 'https://directorybolt.com/api/autobolt';
    this.pollInterval = 30000; // 30 seconds
    this.isProcessing = false;
    this.currentCustomer = null;
    this.processingResults = [];
    this.retryAttempts = 3;
    this.maxConcurrentTabs = 5;
    this.activeTabs = new Set();
    
    console.log('🚀 DirectoryBolt Queue Manager initialized');
  }

  async startQueueMonitoring() {
    console.log('📡 Starting queue monitoring...');
    
    // Initial check
    await this.checkForPendingCustomers();
    
    // Set up periodic polling
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.checkForPendingCustomers();
      }
    }, this.pollInterval);
    
    console.log(`✅ Queue monitoring active (polling every ${this.pollInterval/1000}s)`);
  }

  async checkForPendingCustomers() {
    try {
      console.log('🔍 Checking for pending customers...');
      
      const response = await fetch(`${this.apiBase}/queue/pending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.customers && data.customers.length > 0) {
        console.log(`📋 Found ${data.customers.length} pending customers`);
        
        // Process highest priority customer
        const nextCustomer = data.customers[0];
        await this.processCustomer(nextCustomer);
      } else {
        console.log('📭 No pending customers found');
      }
      
    } catch (error) {
      console.error('❌ Queue check failed:', error);
      
      // Retry with exponential backoff
      setTimeout(() => {
        if (!this.isProcessing) {
          this.checkForPendingCustomers();
        }
      }, Math.min(this.pollInterval * 2, 300000)); // Max 5 minutes
    }
  }

  async processCustomer(customer) {
    if (this.isProcessing) {
      console.log('⏳ Already processing a customer, skipping...');
      return;
    }

    this.isProcessing = true;
    this.currentCustomer = customer;
    this.processingResults = [];

    console.log(`🎯 Starting processing for customer: ${customer.customerId}`);
    console.log(`📦 Package: ${customer.packageType} (${customer.directoryLimits} directories)`);

    try {
      // Update status to in-progress
      await this.updateCustomerStatus(customer.customerId, 'in-progress', {
        progress: {
          totalDirectories: customer.directoryLimits,
          completed: 0,
          successful: 0,
          failed: 0
        }
      });

      // Get directory list for this package
      const directories = await this.getDirectoriesForPackage(customer.packageType);
      
      if (!directories || directories.length === 0) {
        throw new Error('No directories available for processing');
      }

      console.log(`📂 Processing ${directories.length} directories for ${customer.businessData.companyName}`);

      // Process directories in batches
      const results = await this.processDirectoriesInBatches(customer, directories);

      // Calculate final statistics
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const successRate = (successful / results.length) * 100;

      console.log(`📊 Processing complete: ${successful}/${results.length} successful (${successRate.toFixed(1)}%)`);

      // Update final status
      await this.updateCustomerStatus(customer.customerId, 'completed', {
        progress: {
          totalDirectories: results.length,
          completed: results.length,
          successful: successful,
          failed: failed
        },
        results: results
      });

      console.log(`✅ Customer ${customer.customerId} processing completed successfully`);

    } catch (error) {
      console.error(`❌ Customer processing failed:`, error);
      
      await this.updateCustomerStatus(customer.customerId, 'failed', {
        error: error.message,
        results: this.processingResults
      });
    } finally {
      this.isProcessing = false;
      this.currentCustomer = null;
      this.processingResults = [];
      
      // Clean up any remaining tabs
      await this.cleanupTabs();
    }
  }

  async processDirectoriesInBatches(customer, directories) {
    const results = [];
    const batchSize = 3; // Process 3 directories at a time
    
    for (let i = 0; i < directories.length; i += batchSize) {
      const batch = directories.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(directories.length/batchSize)}`);
      
      // Process batch concurrently
      const batchPromises = batch.map(directory => 
        this.processDirectory(customer, directory)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach((result, index) => {
        const directory = batch[index];
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`❌ Directory ${directory.name} failed:`, result.reason);
          results.push({
            directoryId: directory.id,
            directoryName: directory.name,
            status: 'failed',
            error: result.reason?.message || 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Update progress
      await this.updateCustomerStatus(customer.customerId, 'in-progress', {
        progress: {
          totalDirectories: directories.length,
          completed: results.length,
          successful: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'failed').length
        },
        currentDirectory: batch[batch.length - 1]?.name
      });

      // Add delay between batches
      if (i + batchSize < directories.length) {
        console.log('⏳ Waiting before next batch...');
        await this.sleep(5000); // 5 second delay
      }
    }

    return results;
  }

  async processDirectory(customer, directory) {
    console.log(`🌐 Processing directory: ${directory.name}`);
    
    try {
      // Create new tab for directory
      const tab = await this.createDirectoryTab(directory.url);
      this.activeTabs.add(tab.id);

      // Wait for tab to load
      await this.waitForTabLoad(tab.id);

      // Inject customer data and process form
      const result = await this.fillDirectoryForm(tab.id, customer.businessData, directory);

      // Close tab
      await chrome.tabs.remove(tab.id);
      this.activeTabs.delete(tab.id);

      console.log(`✅ ${directory.name} processed successfully`);
      
      return {
        directoryId: directory.id,
        directoryName: directory.name,
        status: 'success',
        submissionUrl: result.submissionUrl || directory.url,
        filledFields: result.filledFields || 0,
        timestamp: new Date().toISOString(),
        notes: result.notes || 'Successfully submitted'
      };

    } catch (error) {
      console.error(`❌ ${directory.name} processing failed:`, error);
      
      return {
        directoryId: directory.id,
        directoryName: directory.name,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async createDirectoryTab(url) {
    try {
      const tab = await chrome.tabs.create({
        url: url,
        active: false // Don't focus the tab
      });
      
      console.log(`📄 Created tab for: ${url}`);
      return tab;
      
    } catch (error) {
      throw new Error(`Failed to create tab: ${error.message}`);
    }
  }

  async waitForTabLoad(tabId, maxWait = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkTab = () => {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Tab error: ${chrome.runtime.lastError.message}`));
            return;
          }
          
          if (tab.status === 'complete') {
            resolve(tab);
            return;
          }
          
          if (Date.now() - startTime > maxWait) {
            reject(new Error('Tab load timeout'));
            return;
          }
          
          setTimeout(checkTab, 500);
        });
      };
      
      checkTab();
    });
  }

  async fillDirectoryForm(tabId, businessData, directory) {
    try {
      // Inject content script if needed
      await this.ensureContentScript(tabId);

      // Send business data to content script
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'AUTOBOLT_FILL_DIRECTORY',
        businessData: businessData,
        directory: directory,
        timestamp: Date.now()
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Form filling failed');
      }

      return response;

    } catch (error) {
      throw new Error(`Form filling failed: ${error.message}`);
    }
  }

  async ensureContentScript(tabId) {
    try {
      // Test if content script is present
      await chrome.tabs.sendMessage(tabId, { action: 'PING' });
      
    } catch (error) {
      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content-core.js']
      });
      
      // Wait for initialization
      await this.sleep(1000);
    }
  }

  async getDirectoriesForPackage(packageType) {
    try {
      const response = await fetch(`${this.apiBase}/directories?packageType=${packageType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch directories: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.directories) {
        return data.directories;
      }
      
      throw new Error('No directories returned from API');
      
    } catch (error) {
      console.error('❌ Failed to get directories:', error);
      
      // Fallback to default directory list
      return this.getDefaultDirectories(packageType);
    }
  }

  getDefaultDirectories(packageType) {
    const allDirectories = [
      {
        id: 'google-business',
        name: 'Google Business Profile',
        url: 'https://business.google.com',
        category: 'Local Search',
        difficulty: 'easy',
        priority: 1
      },
      {
        id: 'yelp',
        name: 'Yelp Business',
        url: 'https://business.yelp.com',
        category: 'Local Search',
        difficulty: 'medium',
        priority: 2
      },
      {
        id: 'facebook-business',
        name: 'Facebook Business',
        url: 'https://business.facebook.com',
        category: 'Social Media',
        difficulty: 'medium',
        priority: 3
      }
      // Add more default directories
    ];

    const limits = {
      'Starter': 25,
      'Growth': 100,
      'Pro': 150,
      'Enterprise': 200
    };

    const limit = limits[packageType] || 50;
    return allDirectories.slice(0, Math.min(limit, allDirectories.length));
  }

  async updateCustomerStatus(customerId, status, data = {}) {
    try {
      const response = await fetch(`${this.apiBase}/customer/${customerId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          ...data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Status update failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Status update failed');
      }

      console.log(`📊 Customer ${customerId} status updated: ${status}`);
      
    } catch (error) {
      console.error('❌ Status update failed:', error);
      // Don't throw - status updates shouldn't break processing
    }
  }

  async cleanupTabs() {
    try {
      for (const tabId of this.activeTabs) {
        try {
          await chrome.tabs.remove(tabId);
        } catch (error) {
          // Tab might already be closed
        }
      }
      this.activeTabs.clear();
      console.log('🧹 Cleaned up active tabs');
    } catch (error) {
      console.error('❌ Tab cleanup failed:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for status checking
  getProcessingStatus() {
    return {
      isProcessing: this.isProcessing,
      currentCustomer: this.currentCustomer?.customerId || null,
      currentCustomerName: this.currentCustomer?.businessData?.companyName || null,
      resultsCount: this.processingResults.length,
      activeTabs: this.activeTabs.size
    };
  }

  stopProcessing() {
    console.log('⏹️ Stopping queue processing...');
    this.isProcessing = false;
    this.cleanupTabs();
  }
}

// Export for use in background script
if (typeof globalThis !== 'undefined') {
  globalThis.DirectoryBoltQueueManager = DirectoryBoltQueueManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DirectoryBoltQueueManager };
}