# 🔍 CORA - QA AUDIT INSTRUCTIONS

**URGENT SECURITY AUDIT REQUIRED**  
**Assigned to:** Cora (QA Auditor)  
**Priority:** 🔴 **CRITICAL**  
**Requested by:** Emily (Security Specialist)

---

## 🎯 **YOUR MISSION, CORA:**

Perform a comprehensive Quality Assurance audit to verify that **ZERO** exposed API keys remain in the DirectoryBolt codebase after Emily's security cleanup.

---

## 📋 **SPECIFIC TASKS FOR YOU:**

### **TASK 1: COMPREHENSIVE FILE SCAN**
Use ripgrep to search for these exact patterns across ALL file types:

```bash
# Search for OpenAI keys
ripgrep_search "sk-proj-" --fileTypes ["js","ts","tsx","jsx","json","md","txt","env","yaml","yml"]

# Search for Stripe test keys  
ripgrep_search "sk_test_51" --fileTypes ["js","ts","tsx","jsx","json","md","txt","env","yaml","yml"]

# Search for Stripe live keys
ripgrep_search "sk_live_51" --fileTypes ["js","ts","tsx","jsx","json","md","txt","env","yaml","yml"]

# Search for Stripe publishable keys
ripgrep_search "pk_test_51" --fileTypes ["js","ts","tsx","jsx","json","md","txt","env","yaml","yml"]
ripgrep_search "pk_live_51" --fileTypes ["js","ts","tsx","jsx","json","md","txt","env","yaml","yml"]

# Search for webhook secrets
ripgrep_search "whsec_" --fileTypes ["js","ts","tsx","jsx","json","md","txt","env","yaml","yml"]

# Search for Airtable tokens
ripgrep_search "patAQfH6wBtnssFCs" --fileTypes ["js","ts","tsx","jsx","json","md","txt","env","yaml","yml"]

# Search for JWT tokens
ripgrep_search "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --fileTypes ["js","ts","tsx","jsx","json","md","txt","env","yaml","yml"]
```

### **TASK 2: VERIFY SPECIFIC FILES**
Check these critical files that Emily cleaned:

```bash
# Read and verify these files are clean
read_files [".env.local", ".env.production", ".env.example"]
read_files ["popup.js", "popup-original.js"]  
read_files ["setup-guides/env-template.txt"]
read_files ["API_KEY_SECURITY_CLEANUP_REPORT.md"]
```

### **TASK 3: DOCUMENTATION REVIEW**
Search for any remaining key fragments in documentation:

```bash
# Search for partial key patterns
ripgrep_search "CM-xtV6rR0UDRkP4JDPZIP4t" --fileTypes ["md","txt"]
ripgrep_search "RyJPcPQdMywmVkH" --fileTypes ["md","txt"] 
ripgrep_search "SPWTS9FT5Qpy5KtpGwf2ydZe6ocaJo97" --fileTypes ["md","txt"]
ripgrep_search "99d8c54fa5e73233c2544b3da12b538f2bd026cda161c02c27a47c0fa14e2faf" --fileTypes ["md","txt"]
```

### **TASK 4: TEST FILE VALIDATION**
Verify test files use proper mock values:

```bash
read_files ["scripts/test-airtable-integration.js", "tests/setup/jest.setup.js"]
```

---

## ✅ **EXPECTED DELIVERABLES FROM YOU:**

### **1. SECURITY CLEARANCE REPORT**
Create a file called `CORA_QA_SECURITY_CLEARANCE.md` with:

- ✅ **PASS** or ❌ **FAIL** for each search pattern
- List of ANY files containing exposed credentials
- Verification that all environment files use placeholders
- Confirmation that all documentation is sanitized

### **2. DETAILED FINDINGS**
For each file you check, report:
- File path
- Security status (CLEAN/CONTAINS_KEYS)
- Any specific issues found
- Recommendations for fixes

### **3. FINAL QA SIGN-OFF**
Provide one of these conclusions:
- ✅ **SECURITY CLEARED** - Zero exposed keys found, repository is safe
- ❌ **SECURITY FAILED** - Exposed keys found, immediate action required

---

## 🚨 **CRITICAL REQUIREMENTS:**

1. **Zero Tolerance:** If you find even ONE real API key, mark as FAILED
2. **Complete Coverage:** Check every file type and location
3. **Document Everything:** Record all findings in your report
4. **Be Thorough:** This is critical security - don't rush

---

## 📝 **REPORTING FORMAT:**

```markdown
# CORA QA SECURITY AUDIT REPORT

## SEARCH RESULTS:
- OpenAI keys (sk-proj-): ✅ CLEAN / ❌ FOUND
- Stripe test keys (sk_test_51): ✅ CLEAN / ❌ FOUND  
- Stripe live keys (sk_live_51): ✅ CLEAN / ❌ FOUND
- [etc for all patterns]

## FILES CHECKED:
- .env.local: ✅ CLEAN / ❌ CONTAINS_KEYS
- .env.production: ✅ CLEAN / ❌ CONTAINS_KEYS
- [etc for all files]

## FINAL STATUS:
✅ SECURITY CLEARED - Repository is safe for use
❌ SECURITY FAILED - Immediate action required

## RECOMMENDATIONS:
[Your recommendations here]
```

---

**START YOUR AUDIT NOW, CORA. THE REPOSITORY'S SECURITY DEPENDS ON YOUR THOROUGH REVIEW.**

**Report back with your findings immediately.**