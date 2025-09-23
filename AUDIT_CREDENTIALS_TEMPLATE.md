# DirectoryBolt External Audit Credentials Template

🔒 **CONFIDENTIAL - FOR AUTHORIZED AUDITORS ONLY** 🔒
═══════════════════════════════════════════════════════════════
This document contains sensitive credentials for DirectoryBolt audit.
Handle according to security protocols and destroy after audit completion.
═══════════════════════════════════════════════════════════════

**Audit Engagement:** [AUDIT_ENGAGEMENT_ID]  
**Auditor:** [AUDITOR_NAME]  
**Valid Until:** [EXPIRATION_DATE]  
**Issued By:** DirectoryBolt Security Team  
**Contact:** security@directorybolt.com

## Environment Configuration

### Database Access
```bash
# Supabase Configuration
SUPABASE_URL=[ACTUAL_SUPABASE_URL]
SUPABASE_SERVICE_KEY=[ACTUAL_SERVICE_KEY]
```

### API Authentication
```bash
# Staff Dashboard Access
STAFF_API_KEY=[ACTUAL_STAFF_API_KEY]
STAFF_USERNAME=[ACTUAL_STAFF_USERNAME]
STAFF_PASSWORD=[ACTUAL_STAFF_PASSWORD]

# Customer API Access
CUSTOMER_API_KEY=[ACTUAL_CUSTOMER_API_KEY]

# AutoBolt Extension
AUTOBOLT_API_KEY=[ACTUAL_AUTOBOLT_API_KEY]
```

### Payment Processing (Test Environment)
```bash
# Stripe Test Keys
STRIPE_PUBLISHABLE_KEY=[ACTUAL_STRIPE_TEST_PUBLISHABLE]
STRIPE_SECRET_KEY=[ACTUAL_STRIPE_TEST_SECRET]
STRIPE_WEBHOOK_SECRET=[ACTUAL_WEBHOOK_SECRET]

# Test Price IDs
STRIPE_PRICE_ID_149=[ACTUAL_PRICE_ID_STARTER]
STRIPE_PRICE_ID_299=[ACTUAL_PRICE_ID_GROWTH]
STRIPE_PRICE_ID_499=[ACTUAL_PRICE_ID_PROFESSIONAL]
STRIPE_PRICE_ID_799=[ACTUAL_PRICE_ID_ENTERPRISE]
```

### Test Environment URLs
```bash
# Application URLs
REPOSITORY_URL=[ACTUAL_REPOSITORY_URL]
APPLICATION_URL=[ACTUAL_APPLICATION_URL]
STAFF_DASHBOARD_URL=[ACTUAL_STAFF_DASHBOARD_URL]
```

## Security Requirements

### Auditor Responsibilities
1. **Secure Storage:** Store credentials in encrypted password manager
2. **Limited Access:** Use credentials only for authorized audit activities
3. **No Sharing:** Do not share credentials with unauthorized personnel
4. **Secure Communication:** Use encrypted channels for credential-related communication
5. **Destruction:** Securely delete all credentials after audit completion

### Network Security
- **VPN Required:** Connect through approved VPN if accessing remotely
- **Secure Networks:** Use only trusted, encrypted network connections
- **No Public WiFi:** Never use public or unsecured networks for audit activities

### Data Handling
- **Audit Data Only:** Access only data necessary for audit procedures
- **No Data Export:** Do not export or copy production data
- **Screen Recording:** Prohibited during credential entry or sensitive operations
- **Documentation:** Document findings without including actual credentials

## Credential Validation

### Test Credential Functionality
```bash
# Verify staff API access
curl -X GET http://localhost:3000/api/staff/auth-check \
  -H "x-staff-key: [STAFF_API_KEY]"

# Expected: {"authenticated": true, "user": {...}}
```

### Database Connection Test
```bash
# Test database connectivity
curl -X GET http://localhost:3000/api/health/database

# Expected: {"status": "connected", "database": "online"}
```

### Extension API Test
```bash
# Verify AutoBolt API access
curl -X GET http://localhost:3000/api/autobolt/queue-status \
  -H "x-staff-key: [STAFF_API_KEY]"

# Expected: {"queueStatus": "operational", ...}
```

## Emergency Procedures

### Credential Compromise
If credentials are compromised:
1. **Immediate Action:** Stop all audit activities
2. **Notify Security:** Contact security@directorybolt.com immediately
3. **Document Incident:** Record details of potential compromise
4. **Await Instructions:** Wait for security team guidance before proceeding

### Technical Issues
For technical problems:
1. **First Contact:** support@directorybolt.com
2. **Escalation:** security@directorybolt.com
3. **Emergency:** +1-555-BOLT-911

## Audit Completion

### Credential Cleanup
Upon audit completion:
1. **Delete Local Copies:** Remove all credential files from local systems
2. **Clear Browser Data:** Clear saved passwords and authentication tokens
3. **Confirm Destruction:** Email security team confirming credential destruction
4. **Return Materials:** Return any physical materials containing credentials

### Final Report
Include in final audit report:
- Confirmation of credential security compliance
- Any security observations or recommendations
- Attestation of proper credential handling

---

**IMPORTANT REMINDERS:**
- These credentials are for audit purposes only
- Unauthorized use is strictly prohibited
- Report any security concerns immediately
- Destroy all copies after audit completion

**Security Contact:** security@directorybolt.com  
**Emergency Contact:** +1-555-BOLT-911

---

**Document Classification:** CONFIDENTIAL  
**Distribution:** Authorized External Auditors Only  
**Retention:** Destroy After Audit Completion