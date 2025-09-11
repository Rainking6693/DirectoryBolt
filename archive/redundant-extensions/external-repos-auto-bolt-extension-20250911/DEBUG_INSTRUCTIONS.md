# 🤖 Auto-Bolt Extension Debug Guide

## 🚀 Quick Start Guide

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `auto-bolt-extension` folder
4. The extension should now appear in your extensions list

### 2. Open the Debug Test Page
1. Navigate to the debug test form: `file:///path/to/auto-bolt-extension/debug-test-form.html`
2. You should see:
   - 🤖 **AUTO-BOLT ACTIVE** badge in top-left corner (animated)
   - 🔍 **Debug Console** with real-time logs
   - Status indicator in top-right corner (🔴 → 🟢 when active)

### 3. Testing Steps

#### Step 1: Verify Content Script is Active
- Click **🧪 Test Content Script** button
- Watch the debug console for messages
- Status indicator should turn green ✅
- Badge should be pulsing and clickable

#### Step 2: Inject Test Business Data
- Click **💉 Inject Test Data** button
- This loads sample business data into Chrome storage
- Console will show: "🎯 Test business data injected into Chrome storage!"

#### Step 3: Analyze Forms
- Click **📊 Analyze Page** button
- Console will show all detected forms and fields
- You'll see field mapping attempts

#### Step 4: Fill Forms
- Click **🎯 Fill Forms** button
- Watch as form fields get automatically filled
- Fields will highlight briefly in blue when filled
- Success notification will appear

## 🔍 What You Should See in Console

### When Content Script Loads:
```
🚀 [AUTO-BOLT 10:30:15] 🚀 AUTO-BOLT CONTENT SCRIPT STARTING!
📍 [AUTO-BOLT 10:30:15] 📝 Initializing on: localhost/debug-test-form.html
🌐 [AUTO-BOLT 10:30:15] 📝 Full URL: file:///path/to/debug-test-form.html
📄 [AUTO-BOLT 10:30:15] 📝 Document ready state: complete
```

### When Forms Are Detected:
```
🔍 [AUTO-BOLT 10:30:16] 📊 SCANNING PAGE: Found 2 forms
📋 [AUTO-BOLT 10:30:16] 📝 Analyzing form #1...
📊 [AUTO-BOLT 10:30:16] 📝 Found 15 total input elements in form #1
📝 [AUTO-BOLT 10:30:16] 📝 Field #1: companyName (text)
✅ [AUTO-BOLT 10:30:16] 🎯 Mapped field "companyName" to business data "companyName"
```

### When Messages Are Received:
```
📨 [AUTO-BOLT 10:30:20] 📬 MESSAGE RECEIVED!
📋 [AUTO-BOLT 10:30:20] 📝 Message details: {"type":"FILL_FORMS","timestamp":1620000000}
🎯 [AUTO-BOLT 10:30:20] 🎯 Processing FILL_FORMS request!
```

### When Fields Are Filled:
```
🎯 [AUTO-BOLT 10:30:21] 🚀 STARTING FORM FILL OPERATION!
✅ [AUTO-BOLT 10:30:21] 📝 Business data available, proceeding with form fill...
📝 [AUTO-BOLT 10:30:21] ✍️ Filling field: companyName = "TechFlow Solutions LLC"
✅ [AUTO-BOLT 10:30:21] ✅ Successfully filled: companyName
```

## 🎯 Visual Indicators

### 🤖 Content Script Badge
- **Location**: Top-left corner
- **Active**: Animated blue gradient badge
- **Clickable**: Shows debug info popup
- **Missing**: Content script failed to load

### 🟢 Status Indicator  
- **Location**: Top-right corner
- **Green**: Content script is responsive
- **Red**: Content script not responding
- **Pulsing**: Normal operation

### 🎨 Field Highlighting
- **Blue Border**: Field is being filled
- **Light Blue Background**: Field was successfully filled
- **Duration**: 2 seconds

## 🛠️ Troubleshooting

### No Badge or Red Status Indicator
**Problem**: Content script not loading
**Solutions**:
1. Refresh the page
2. Check Chrome DevTools Console for errors
3. Verify extension is loaded in `chrome://extensions/`
4. Try reloading the extension

### No Debug Messages
**Problem**: Console logging issues
**Solutions**:
1. Open Chrome DevTools (F12)
2. Check Console tab for errors
3. Look for styled blue messages starting with `[AUTO-BOLT]`

### Forms Not Getting Filled
**Problem**: No business data or mapping issues
**Solutions**:
1. Click "💉 Inject Test Data" button first
2. Check console for mapping messages
3. Verify form fields have recognizable names/IDs

### Extension Popup Not Working
**Problem**: Communication between popup and content script
**Solutions**:
1. Test using the debug page buttons instead
2. Check background.js for errors in DevTools > Extensions

## 📊 Debug Categories

The debug system uses color-coded categories:

- **🚀 init**: Initialization and setup
- **📡 messaging**: Message passing and communication
- **💾 storage**: Chrome storage operations  
- **🔍 forms**: Form detection and analysis
- **🎯 filling**: Form filling operations
- **🎨 ui**: User interface updates
- **👨‍⚕️ health**: Periodic health checks

## 🎮 Interactive Testing

### Manual Commands in Console:
```javascript
// Inject test data manually
autoBoltTestData.inject();

// Clear test data  
autoBoltTestData.clear();

// View test data structure
console.log(autoBoltTestData.data);

// Send message to content script
chrome.runtime.sendMessage({type: 'PING'});
```

### Expected Form Fill Results:
- **Company Name**: "TechFlow Solutions LLC"
- **Email**: "contact@techflowsolutions.com" 
- **Phone**: "(555) 123-4567"
- **Address**: "123 Innovation Drive"
- **City**: "San Francisco"
- **State**: "CA"
- **ZIP**: "94105"

## 🚨 Common Issues

### Issue: "Chrome runtime not available"
**Cause**: Page loaded outside extension context
**Fix**: Make sure you loaded the extension first

### Issue: No fields getting filled
**Cause**: Field names don't match mapping logic
**Fix**: Check console for mapping attempts, update field mappings if needed

### Issue: Badge appears but no functionality  
**Cause**: Extension permissions or manifest issues
**Fix**: Check manifest.json permissions, reload extension

## 🎉 Success Indicators

✅ **Working Correctly When You See**:
- Animated blue badge in corner
- Green status indicator  
- Detailed console logs with emojis
- Forms getting filled with test data
- Success notifications appearing
- Field highlighting during fill operations

The debug system provides comprehensive visibility into every operation, making it easy to identify exactly where issues occur in the content script injection and form filling process.