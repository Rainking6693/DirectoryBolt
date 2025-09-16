/**
 * AutoBolt Extension Popup Script
 * 
 * Handles customer validation and package tier management
 */

// Initialize PackageTierEngine
const packageEngine = new PackageTierEngine();

document.addEventListener('DOMContentLoaded', function() {
  const customerIdInput = document.getElementById('customerId');
  const validateBtn = document.getElementById('validateBtn');
  const statusDiv = document.getElementById('status');
  const packageInfoDiv = document.getElementById('packageInfo');

  // Load saved customer ID
  chrome.storage.local.get(['customerId'], function(result) {
    if (result.customerId) {
      customerIdInput.value = result.customerId;
    }
  });

  validateBtn.addEventListener('click', validateCustomer);
  customerIdInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      validateCustomer();
    }
  });

  async function validateCustomer() {
    const customerId = customerIdInput.value.trim();
    
    if (!customerId) {
      showStatus('Please enter a Customer ID', 'error');
      return;
    }

    // Validate format
    if (!customerId.match(/^(DIR-|TEST-|DB-)/)) {
      showStatus('Invalid Customer ID format. Must start with DIR-, TEST-, or DB-', 'error');
      return;
    }

    showStatus('Validating customer...', 'loading');
    validateBtn.disabled = true;

    try {
      // Call DirectoryBolt validation API
      const response = await fetch('https://directorybolt.com/api/extension/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          extensionVersion: '3.0.1',
          timestamp: Date.now()
        })
      });

      const result = await response.json();

      if (result.valid) {
        // Save customer ID
        chrome.storage.local.set({ 
          customerId: customerId,
          customerName: result.customerName,
          packageType: result.packageType
        });

        showStatus(`✅ Validated: ${result.customerName}`, 'success');
        showPackageInfo(result.packageType);
      } else {
        showStatus(`❌ ${result.error}`, 'error');
        hidePackageInfo();
      }

    } catch (error) {
      console.error('Validation error:', error);
      showStatus('❌ Connection failed. Please try again.', 'error');
      hidePackageInfo();
    } finally {
      validateBtn.disabled = false;
    }
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
  }

  function showPackageInfo(packageType) {
    const packageInfo = packageEngine.formatPackageDisplay(packageType);
    
    packageInfoDiv.innerHTML = `
      <strong>${packageInfo.name} Package</strong><br>
      Max Directories: ${packageInfo.maxDirectories}<br>
      Priority: ${packageInfo.priority}<br>
      Features: ${packageInfo.features.join(', ')}
    `;
    packageInfoDiv.style.display = 'block';
  }

  function hidePackageInfo() {
    packageInfoDiv.style.display = 'none';
  }
});