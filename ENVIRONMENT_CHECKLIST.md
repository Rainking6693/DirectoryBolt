# ENVIRONMENT CONFIGURATION CHECKLIST

Before Blake's audit, verify these are completed:

## ✅ Required Environment Variables
- [ ] AIRTABLE_ACCESS_TOKEN - Replace with actual PAT token
- [ ] AIRTABLE_BASE_ID - Verify this is correct: appZDNMzebkaOkLXo  
- [ ] AIRTABLE_TABLE_NAME - Verify table name: "Directory Bolt Import"
- [ ] STRIPE_SECRET_KEY - Use live key for production
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Use live key for production
- [ ] JWT_SECRET - Generate secure 32+ character secret

## ✅ Security Verification  
- [ ] No debug endpoints accessible
- [ ] No hardcoded API keys in source code
- [ ] All placeholder values replaced
- [ ] Environment files not committed to git

## ✅ Customer Testing
- [ ] Test customer ID: DIR-202597-recwsFS91NG2O90xi
- [ ] Verify returns: DirectoryBolt business name  
- [ ] Verify returns: Correct package type
- [ ] Verify returns: 100 directory allocation

## ✅ Authentication Flow
- [ ] Extension validation endpoint working
- [ ] Real customer data properly returned
- [ ] Error handling for invalid customers
- [ ] Rate limiting functioning correctly
