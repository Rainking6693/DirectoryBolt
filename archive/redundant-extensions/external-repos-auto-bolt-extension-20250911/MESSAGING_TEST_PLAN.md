# Chrome Extension Messaging Test Plan
## Auto-Bolt Extension - Popup ↔ Content Script Communication

### Overview
This test plan focuses specifically on verifying the messaging system between the popup and content script, including both successful communication and common failure scenarios.

---

## Quick Start Checklist

### Prerequisites ✅
- [ ] Chrome browser with Developer Mode enabled
- [ ] Extension loaded as unpacked extension with "Allow access to file URLs" enabled
- [ ] Test form page available (use `debug-test-form.html`)
- [ ] Console access for both popup and content page debugging

---

## Test Procedure 1: Basic Messaging Verification

### Step 1: Load Extension with File URL Access
**Time: 2 minutes**

1. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" toggle (top-right)

2. **Load Extension**
   - Click "Load unpacked"
   - Select the `auto-bolt-extension` directory
   - ✅ **Expected:** Extension appears in list

3. **Enable File URL Access** 
   - Click "Details" on Auto-Bolt extension
   - Enable "Allow access to file URLs"
   - ✅ **Expected:** Toggle shows enabled

4. **Verify Extension Status**
   - Extension icon appears in Chrome toolbar
   - No errors in extension console
   - ✅ **Success Criteria:** Icon is clickable and shows "Auto-Bolt - Business Info Manager" tooltip

---

### Step 2: Open Test Form
**Time: 1 minute**

1. **Open Test Page**
   - Open `debug-test-form.html` directly in browser (file:// URL)
   - OR navigate to any web page with forms

2. **Verify Content Script Loading**
   - Open browser console (F12)
   - Look for initialization messages:
     ```
     🚀 AUTO-BOLT CONTENT SCRIPT STARTING!
     ✅ CONTENT SCRIPT FULLY INITIALIZED!
     ```
   - ✅ **Expected:** Content script badge appears (top-left "🤖 AUTO-BOLT ACTIVE")
   - ✅ **Expected:** Green pulsing status indicator if working

3. **Check Visual Indicators**
   - Content script badge should be visible and animated
   - Status indicator (top-right) should be green if active
   - ✅ **Success Criteria:** Both visual indicators present and active

---

### Step 3: Test Popup → Content Script Communication
**Time: 2 minutes**

1. **Open Extension Popup**
   - Click Auto-Bolt extension icon in toolbar
   - ✅ **Expected:** Popup opens showing UI elements

2. **Setup Test Data (if needed)**
   - If no business data loaded, click "Fetch Business Info"
   - OR use the test data injection feature
   - ✅ **Expected:** "Fill Forms" button becomes enabled

3. **Trigger Form Fill**
   - Click "Fill Forms" button in popup
   - Watch both popup AND content page consoles simultaneously

4. **Verify Communication**
   - **In Content Script Console (main page):**
     ```
     📨 MESSAGE RECEIVED!
     🎯 Processing FILL_FORMS request!
     ✅ FORM FILL COMPLETE! X/Y fields filled
     ```
   - **In Popup Console:**
     ```
     📤 Sending message to content script
     ✅ Content script responded successfully
     ```
   - ✅ **Success Criteria:** Both consoles show successful message exchange

---

### Step 4: Verify Form Filling Results
**Time: 1 minute**

1. **Check Form Fields**
   - Form fields should be populated with business data
   - Fields should briefly highlight (blue border, light blue background)
   - ✅ **Expected:** Relevant fields filled with appropriate data

2. **Check Success Notifications**
   - Popup should show: "Form filling completed successfully!"
   - Content page may show notification: "Successfully filled X form fields!"
   - ✅ **Success Criteria:** Success messages in both locations

---

## Common Failure Scenarios & Quick Diagnostics

### ❌ Scenario 1: Content Script Not Loading
**Symptoms:** No console messages, no badge, red status indicator

**Quick Fixes:**
1. **Check Console for Errors**
   ```javascript
   // Look for these in console:
   Uncaught SyntaxError
   Extension context invalidated
   ```

2. **Verify Extension Permissions**
   - Ensure "Allow access to file URLs" is enabled
   - Check extension is not disabled

3. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click refresh button on Auto-Bolt extension
   - Refresh the test page

**Success Check:** Content script initialization messages appear

---

### ❌ Scenario 2: Messaging Timeout
**Symptoms:** Popup shows "Content script may not be responding"

**Diagnostics:**
```javascript
// In content page console, test manually:
chrome.runtime.sendMessage({type: 'PING'}, console.log);

// Expected response:
{success: true, message: "Content script is alive and ready"}
```

**Quick Fixes:**
1. **Check Tab Permissions**
   - Some URLs block content scripts (chrome://, extension://)
   - Test on regular websites or file:// URLs

2. **Verify Extension Context**
   - Extension may have been reloaded/updated
   - Refresh page and try again

3. **Check for JavaScript Errors**
   - Any errors in content script prevent message handling
   - Look for red console errors

---

### ❌ Scenario 3: No Business Data
**Symptoms:** "No business data loaded" message

**Quick Fix:**
```javascript
// In popup console, inject test data:
chrome.storage.local.set({
  businessData: {
    fields: {
      companyName: "Test Company",
      email: "test@example.com",
      phone: "555-123-4567"
    }
  }
}, () => console.log('Test data injected'));
```

---

## Edge Case Testing (5 minutes)

### Test 1: Multiple Tabs
**Time: 2 minutes**

1. **Setup**
   - Open test form in 3 different tabs
   - Open extension popup in each tab

2. **Test**
   - Fill forms in each tab separately
   - Verify each content script responds independently

3. **Success Criteria**
   - Each tab processes messages correctly
   - No cross-tab interference

### Test 2: No Airtable Data
**Time: 2 minutes**

1. **Setup**
   - Clear all stored data: Popup → "Clear Data"
   - Try form filling without fetching data

2. **Expected Behavior**
   - Warning: "No business data loaded. Please fetch data first."
   - No form modification occurs
   - Extension remains stable

### Test 3: Network Issues During Data Fetch
**Time: 1 minute**

1. **Setup**
   - Start fetching data from Airtable
   - Disconnect network mid-request

2. **Expected Behavior**
   - "Network error - please check your internet connection"
   - Loading state clears properly
   - Extension remains functional for retry

---

## Success Criteria Summary

### ✅ Core Messaging Tests Pass When:
1. **Content script initializes** → Console shows startup messages
2. **Popup can communicate** → Messages sent and received successfully  
3. **Forms get filled** → Fields populate with business data
4. **Error handling works** → Graceful failure messages for edge cases
5. **Visual feedback works** → Badges, indicators, and notifications appear

### ✅ Extension is Production Ready When:
- All communication paths work on both file:// and https:// URLs
- Error scenarios are handled gracefully without crashes
- Visual indicators accurately reflect system state
- Performance remains responsive during operations

---

## Quick Troubleshooting Guide

| Problem | Quick Check | Solution |
|---------|-------------|----------|
| No content script badge | Check console for errors | Reload extension + page |
| Popup won't open | Extension icon clickable? | Check manifest.json syntax |
| Messages timeout | Content script responding? | Verify permissions, reload page |
| Forms won't fill | Business data loaded? | Fetch data or inject test data |
| No field detection | Console shows form analysis? | Check field naming patterns |

---

## Debug Commands Reference

### Test Content Script Manually
```javascript
// In content page console:
window.postMessage({type: 'AUTO_BOLT_FILL_FORMS'}, window.location.origin);
```

### Check Extension Storage
```javascript
// In popup console:
chrome.storage.local.get(['businessData'], console.log);
```

### Monitor Message Passing
```javascript
// In background page console:
chrome.runtime.onMessage.addListener((msg, sender, response) => {
  console.log('Message:', msg, 'From:', sender.tab?.url);
  return true;
});
```

### Force Content Script Injection
```javascript
// In popup console (when tab is active):
chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content.js']
  });
});
```

---

**Total Test Time: ~10 minutes**  
**Focus: Practical verification of core messaging functionality**  
**Result: Confidence in popup ↔ content script communication reliability**