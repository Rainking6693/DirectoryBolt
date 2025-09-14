# 🚨 CRITICAL DOMAIN FIX - BLAKE IMMEDIATE ASSIGNMENT

**Mission Commander:** Emily  
**Error Type:** Wrong Domain References in AutoBolt Extension  
**Priority:** CRITICAL - Blocking Extension Loading  
**Agent:** Blake (Build Detective) - IMMEDIATE EXECUTION REQUIRED

---

## 🔍 CRITICAL ERROR IDENTIFIED

### **Wrong Domain References:**
- **Current (WRONG):** `auto-bolt.netlify.app`
- **Correct (REQUIRED):** `directorybolt.com`
- **Impact:** Extension manifest validation failing
- **Locations:** Multiple sections in manifest.json

### **Affected Sections:**
1. **web_accessible_resources[0].matches** - Line ~290
2. **content_security_policy.extension_pages** - Line ~295
3. **externally_connectable.matches** - Line ~300

---

## 🏗️ BLAKE - IMMEDIATE FIX REQUIRED

### **Fix 1: web_accessible_resources matches**
**REPLACE:**
```json
"https://auto-bolt.netlify.app/*"
```
**WITH:**
```json
"https://directorybolt.com/*"
```

### **Fix 2: content_security_policy**
**REPLACE:**
```json
"connect-src 'self' https://auto-bolt.netlify.app https://api.airtable.com;"
```
**WITH:**
```json
"connect-src 'self' https://directorybolt.com https://api.airtable.com;"
```

### **Fix 3: externally_connectable**
**REPLACE:**
```json
"matches": ["https://auto-bolt.netlify.app/*"]
```
**WITH:**
```json
"matches": ["https://directorybolt.com/*"]
```

---

## 🎯 EXPECTED RESULT

After fixes:
- ✅ Extension loads without manifest errors
- ✅ Proper domain communication with directorybolt.com
- ✅ Customer validation functional
- ✅ API integration working

**BLAKE - EXECUTE IMMEDIATELY**