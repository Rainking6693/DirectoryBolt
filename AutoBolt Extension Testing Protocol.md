# AutoBolt Extension Testing Protocol
**Project:** DirectoryBolt AutoBolt Chrome Extension Integration
**Extension Location:** C:\Users\Ben\auto-bolt-extension
**Website Location:** C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt
**Testing Focus:** Customer submission to directory automation workflow

---

## TESTING OVERVIEW

**Test Objective:** Validate complete workflow from customer business information submission on DirectoryBolt.com through automated directory submissions via AutoBolt Chrome extension

**Critical Success Criteria:**
- Customer data flows correctly from website to extension
- Extension processes customer queue properly
- Directory submissions execute automatically with customer data
- Success/failure tracking updates correctly
- Customer receives accurate progress reports

---

## PRE-TESTING SETUP REQUIREMENTS

### Extension Setup Validation
- [ ] AutoBolt extension installed in Chrome from C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt\auto-bolt-extension
- [ ] Extension permissions granted for all directory domains
- [ ] Extension can access DirectoryBolt API endpoints
- [ ] Extension manifest.json configured for production use
- [ ] Background script and content scripts loading properly

### DirectoryBolt Website Setup
- [ ] Customer onboarding flow functional (payment → business form)
- [ ] Google Sheets integration storing customer data correctly
- [ ] Queue management API endpoints operational
- [ ] Customer status tracking system working
- [ ] Environment variables configured properly

### Data Flow Validation
- [ ] Google Shetts contains customer records with submissionStatus="pending"
- [ ] Customer data includes all required fields for directory submissions
- [ ] API endpoints accessible to AutoBolt extension
- [ ] Authentication/API keys working between systems

---

## PHASE 1: CUSTOMER DATA SUBMISSION TESTING

### Section 1.1: Business Information Form Testing

**Complete Customer Onboarding Flow:**
- [ ] Customer completes payment for Growth plan ($299)
- [ ] Redirected to business information collection form
- [ ] Form accepts all required business data:
  - firstName, lastName, businessName
  - email, phone, address, city, state, zip
  - website, description
  - facebook, instagram, linkedin
  - logo upload
- [ ] Form validation prevents submission with missing required fields
- [ ] Form submission creates record in Airtable
- [ ] Record assigned unique customerId (DIR-2025-XXXXXX format)
- [ ] submissionStatus set to "pending"
- [ ] packageType correctly mapped to pricing tier

**Data Quality Validation:**
- [ ] All customer data stored without corruption
- [ ] Special characters in business name/description handled properly
- [ ] Phone numbers formatted consistently
- [ ] URLs validated and formatted correctly
- [ ] File uploads (logos) stored and accessible
- [ ] Data structure matches extension expectations

### Section 1.2: Queue System Integration Testing

**Google Sheets Queue Management:**
- [ ] Customer record appears in Google Sheets with correct structure
- [ ] submissionStatus="pending" for new customers
- [ ] packageType determines directory limit (Growth=100 directories)
- [ ] Priority system works (Pro>Growth>Starter>Subscription)
- [ ] Creation timestamp enables proper queue ordering

**API Endpoint Testing:**
- [ ] GET /api/queue/pending returns customer records
- [ ] Customer data includes all necessary fields for form filling
- [ ] API response format matches extension expectations
- [ ] Authentication prevents unauthorized access
- [ ] Rate limiting protects against abuse

---

## PHASE 2: AUTOBOLT EXTENSION QUEUE PROCESSING TESTING

### Section 2.1: Extension Initialization Testing

**Extension Startup Validation:**
- [ ] Extension loads and initializes properly on Chrome startup
- [ ] Background script connects to DirectoryBolt API
- [ ] Extension retrieves pending customer queue successfully
- [ ] Customer data parsed and validated correctly
- [ ] Directory list loaded from master-directory-list.json
- [ ] Form mappings initialized for target directories

**Queue Processing Logic:**
- [ ] Extension processes customers in correct priority order
- [ ] Package type limits respected (Growth plan = 100 directories max)
- [ ] Customer record status updates to "in-progress"
- [ ] Extension handles multiple customers in queue
- [ ] Error handling prevents queue corruption

### Section 2.2: Directory Submission Automation Testing

**Form Filling Automation:**
- [ ] Extension opens new tab for each target directory
- [ ] Form fields correctly mapped using directory-specific selectors
- [ ] Customer business data pre-filled accurately:
  - Business name appears in correct fields
  - Contact information (phone, email, address) filled properly
  - Business description adapted for directory requirements
  - Social media links populated where applicable
- [ ] Form validation errors handled gracefully
- [ ] Required fields not in customer data flagged appropriately

**Submission Process Validation:**
- [ ] Extension detects and skips login-required directories
- [ ] CAPTCHA-protected sites identified and skipped
- [ ] Form submission attempted automatically where possible
- [ ] Success indicators detected properly
- [ ] Failure conditions identified and logged
- [ ] Submission results recorded with timestamps

### Section 2.3: Progress Tracking and Status Updates

**Real-time Status Updates:**
- [ ] Google Sheets records updated during processing
- [ ] Directory submission attempts logged individually
- [ ] Success/failure counts maintained accurately
- [ ] Processing timestamps recorded for each directory
- [ ] Overall progress percentage calculated correctly

**Error Handling and Recovery:**
- [ ] Failed submissions logged with error reasons
- [ ] Retry logic attempts failed submissions appropriately
- [ ] Timeout scenarios handled without breaking queue
- [ ] Network errors don't corrupt customer data
- [ ] Extension continues processing other customers on individual failures

---

## PHASE 3: DIRECTORY-SPECIFIC TESTING

### Section 3.1: High-Priority Directory Testing

**Test with Key Directories:**
- [ ] Google Business Profile submission process
- [ ] Yelp business listing automation
- [ ] Facebook Business Page creation/updating
- [ ] LinkedIn Company Directory submission
- [ ] Crunchbase company profile automation
- [ ] Better Business Bureau listing process
- [ ] Bing Places for Business submission
- [ ] Apple Business Connect automation

**Form Mapping Validation:**
- [ ] Business name maps to correct fields across directories
- [ ] Contact information populates appropriate form fields
- [ ] Business description adapts to character limits
- [ ] Category/industry selections made appropriately
- [ ] Address information formatted for directory requirements
- [ ] Website URLs submitted correctly

### Section 3.2: Edge Case Directory Testing

**Difficult Directory Scenarios:**
- [ ] Multi-step submission processes handled correctly
- [ ] Email verification requirements identified and flagged
- [ ] Manual review processes marked as "pending approval"
- [ ] Geographic restrictions respected
- [ ] Industry-specific requirements validated
- [ ] Premium listing options handled appropriately

**Form Complexity Testing:**
- [ ] Dynamic form fields populated correctly
- [ ] Conditional form logic handled properly
- [ ] File upload requirements (logos) processed when possible
- [ ] Multi-page forms navigated successfully
- [ ] AJAX form submissions detected and handled

---

## PHASE 4: CUSTOMER COMMUNICATION TESTING

### Section 4.1: Progress Reporting Testing

**Customer Dashboard Updates:**
- [ ] Customer can view real-time submission progress
- [ ] Directory submission status visible per directory
- [ ] Success/failure breakdown displayed accurately
- [ ] Timeline estimates provided and updated
- [ ] Completion percentage reflects actual progress

**Notification System Testing:**
- [ ] Email notifications sent at key milestones
- [ ] Progress reports generated automatically
- [ ] Error notifications alert customers to issues
- [ ] Completion confirmation sent when finished
- [ ] Follow-up instructions provided for manual verifications

### Section 4.2: Results Delivery Testing

**Final Report Generation:**
- [ ] Comprehensive submission report created
- [ ] Successfully submitted directories listed with URLs
- [ ] Failed submissions explained with reasons
- [ ] Pending approvals identified with next steps
- [ ] Manual verification requirements clearly communicated
- [ ] Export functionality (PDF/CSV) works properly

**Quality Assurance Validation:**
- [ ] All claimed submissions actually completed
- [ ] Directory URLs accessible and correct
- [ ] Business information appears correctly on directories
- [ ] No duplicate or incorrect submissions
- [ ] Customer data privacy maintained throughout process

---

## PHASE 5: SYSTEM INTEGRATION TESTING

### Section 5.1: End-to-End Workflow Testing

**Complete Customer Journey:**
1. [ ] Customer pays for Growth plan ($299) on DirectoryBolt.com
2. [ ] Completes business information form with comprehensive data
3. [ ] Data stored in Airtable with submissionStatus="pending"
4. [ ] AutoBolt extension detects new customer in queue
5. [ ] Extension processes customer with correct priority
6. [ ] Submits business to 100 directories based on package type
7. [ ] Updates Airtable with individual directory results
8. [ ] Customer receives progress updates during processing
9. [ ] Final report delivered with comprehensive results
10. [ ] Customer status updated to "completed"

**Data Integrity Throughout Workflow:**
- [ ] Customer data maintains accuracy from form to final submission
- [ ] No data corruption during API transfers
- [ ] File uploads (logos) accessible throughout process
- [ ] Timestamps accurate for audit trail
- [ ] Status updates reflect actual processing state

### Section 5.2: Scale and Performance Testing

**Multiple Customer Processing:**
- [ ] Extension handles queue of 10+ customers efficiently
- [ ] Processing doesn't slow down with queue size
- [ ] Memory usage remains stable during extended operation
- [ ] Network resources managed efficiently
- [ ] Browser performance not significantly impacted

**Concurrent Operations Testing:**
- [ ] Multiple directory submissions process simultaneously
- [ ] Browser tab management prevents crashes
- [ ] Rate limiting prevents directory blocking
- [ ] Resource cleanup prevents memory leaks
- [ ] Extension recovery after browser restart

---

## PHASE 6: ERROR HANDLING AND RECOVERY TESTING

### Section 6.1: Failure Scenario Testing

**Network and Connectivity Issues:**
- [ ] Internet connection loss handled gracefully
- [ ] API timeout scenarios don't corrupt data
- [ ] Directory site downtime detected and handled
- [ ] Partial submission failures logged correctly
- [ ] Recovery process resumes where stopped

**Browser and Extension Issues:**
- [ ] Browser crash recovery restores queue state
- [ ] Extension update doesn't lose processing data
- [ ] Chrome security restrictions handled properly
- [ ] Pop-up blockers don't break submission process
- [ ] Extension permissions changes detected

### Section 6.2: Data Validation and Security Testing

**Customer Data Protection:**
- [ ] Customer data encrypted during transmission
- [ ] No sensitive information logged in plain text
- [ ] API authentication prevents unauthorized access
- [ ] Customer data purged after processing completion
- [ ] Directory credentials (if any) stored securely

**Submission Validation:**
- [ ] Duplicate submissions prevented automatically
- [ ] Invalid directory URLs rejected
- [ ] Malformed customer data flagged before submission
- [ ] Business information validated before form filling
- [ ] Success verification confirms actual submission completion

---

## SUCCESS METRICS AND VALIDATION

### Quantitative Success Criteria:
- [ ] 95%+ directory submission success rate for processable directories
- [ ] 90%+ customer data accuracy from form to final submission
- [ ] <10% failure rate due to technical issues
- [ ] Average processing time <60 minutes per customer
- [ ] Zero critical data loss incidents

### Qualitative Success Criteria:
- [ ] Customer receives professional, comprehensive service
- [ ] Directory submissions appear legitimate and high-quality
- [ ] Process feels automated and efficient from customer perspective
- [ ] Error handling provides clear guidance for resolution
- [ ] Final results justify premium pricing and service positioning

### Launch Readiness Checklist:
- [ ] Complete end-to-end workflow functions flawlessly
- [ ] All directory mappings accurate and current
- [ ] Customer communication system provides transparency
- [ ] Error handling prevents service disruption
- [ ] Results delivery meets professional standards
- [ ] System capable of handling production customer volume

**Final Validation:** AutoBolt extension successfully transforms DirectoryBolt from manual service to automated business intelligence platform, justifying premium pricing through consistent, professional directory submission automation.