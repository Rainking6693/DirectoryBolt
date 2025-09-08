# 🔧 **CUSTOMER ID PREFIX FIX: DB → DIR**

## 🚨 **ISSUE IDENTIFIED**

You mentioned Airtable is creating Customer IDs with "DB" prefix, but I found:
- **Airtable service** generates `DIR-YYYY-XXXXXX` ✅
- **AutoBolt integration** generates `DIR-YYYYMMDD-XXXX` ✅
- **Extension** expects `DIR-` prefix ✅

## 🔍 **POSSIBLE CAUSES OF "DB" PREFIX**

### **1. Manual Entry in Airtable**
- Someone manually entered Customer IDs with "DB-" prefix
- Airtable formula or automation creating "DB-" IDs

### **2. Different Service/Script**
- Another script or service generating Customer IDs
- Import from external system using "DB-" format

### **3. Typo in Code**
- Possible typo somewhere changing "DIR" to "DB"

## ✅ **SOLUTIONS PROVIDED**

### **1. Extension Updated (Backward Compatibility)**
I've updated the extension to accept **both** prefixes:
- ✅ `DIR-2024-123456` (preferred)
- ✅ `DB-2024-123456` (backward compatible)

### **2. Standardize Customer ID Generation**

If you want to change the prefix from "DIR" to "DB", update the generators:

#### **Option A: Change DIR → DB in Airtable Service**
```typescript
// In lib/services/airtable.ts, line 85
generateCustomerId(): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `DB-${year}-${timestamp}${randomSuffix}` // Changed DIR to DB
}
```

#### **Option B: Change DIR → DB in AutoBolt Integration**
```javascript
// In lib/services/autobolt-integration.js, line 119
static generateCustomerId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `DB-${year}${month}${day}-${random}`; // Changed DIR to DB
}
```

## 🎯 **RECOMMENDED APPROACH**

### **Keep DIR Prefix (Recommended)**
1. **Check your Airtable** for any manually entered "DB-" Customer IDs
2. **Update them to "DIR-"** for consistency
3. **Use existing Customer IDs** that start with "DIR-"

### **Or Change to DB Prefix**
1. **Update both generators** to use "DB-" prefix
2. **Update extension** to expect "DB-" primarily
3. **Migrate existing "DIR-" IDs** to "DB-" format

## 🔧 **QUICK FIX FOR TESTING**

### **Use Any Existing Customer ID**
1. **Check your Airtable base**
2. **Look for any Customer ID** (DIR- or DB-)
3. **Use that ID in the extension**

### **Create Test Customer ID**
Try these formats in your extension:
```
DIR-2024-123456
DB-2024-123456
DIR-20241207-1234
DB-20241207-1234
```

## 🎯 **IMMEDIATE ACTION**

### **Step 1: Check Your Airtable**
1. **Open your Airtable base**
2. **Look at Customer ID column**
3. **See what prefix is actually being used**

### **Step 2: Test Extension**
The extension now accepts both formats, so try:
- Any existing Customer ID from your Airtable
- Test format: `DB-2024-TEST01`

### **Step 3: Standardize (Optional)**
If you want all IDs to use "DB-" prefix:
1. Update the generator functions
2. Migrate existing "DIR-" IDs
3. Update documentation

## 🚨 **IMPORTANT NOTES**

### **Extension Now Supports Both:**
- ✅ `DIR-2024-123456`
- ✅ `DB-2024-123456`

### **Customer ID Must Exist:**
- The ID must be in your Airtable database
- Extension validates against DirectoryBolt.com API
- Test IDs won't work unless they're real records

## 🎯 **BOTTOM LINE**

**The extension is now fixed to accept both DIR- and DB- prefixes.** 

**To test immediately:**
1. **Check your Airtable** for any existing Customer ID
2. **Use that Customer ID** in the extension
3. **It should work regardless of DIR- or DB- prefix**

**The real issue is likely that you need a Customer ID that actually exists in your database, not the prefix format.**