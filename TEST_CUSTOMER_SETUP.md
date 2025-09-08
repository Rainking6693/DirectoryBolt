# 🔑 **TEST CUSTOMER ID FOR EXTENSION**

## 🎯 **CUSTOMER ID FORMAT**

Based on your Airtable service, Customer IDs are generated in this format:
```
DIR-{YEAR}-{TIMESTAMP}{RANDOM}
```

## 🧪 **TEST CUSTOMER IDS YOU CAN USE**

### **Option 1: Create Test Customer ID**
```
DIR-2024-123456ABCD
```

### **Option 2: Generate Current Format**
```
DIR-2024-$(date +%s | tail -c 6)$(openssl rand -hex 2 | tr '[:lower:]' '[:upper:]')
```

## 🔧 **HOW TO CREATE A TEST CUSTOMER**

### **Method 1: Use DirectoryBolt.com (Recommended)**

1. **Go to your website checkout**
2. **Complete a test purchase** (use Stripe test mode)
3. **Fill out business information form**
4. **Customer ID will be generated automatically**
5. **Use that Customer ID in extension**

### **Method 2: Create Test Record Directly**

You can create a test customer record by calling your API:

```javascript
// Test customer data
const testCustomer = {
  firstName: "Test",
  lastName: "Customer", 
  businessName: "Test Business LLC",
  email: "test@example.com",
  phone: "(555) 123-4567",
  website: "https://testbusiness.com",
  address: "123 Test Street",
  city: "Test City",
  state: "CA",
  zip: "90210",
  description: "A test business for extension testing",
  packageType: "growth",
  submissionStatus: "pending"
}
```

### **Method 3: Use Specific Test ID**

Try this test Customer ID:
```
DIR-2024-TEST01
```

## 🎯 **QUICK TEST SETUP**

### **Step 1: Create Test Customer**
1. **Open browser console** on DirectoryBolt.com
2. **Run this code:**
```javascript
fetch('/api/business-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: "Test",
    lastName: "Customer",
    businessName: "Test Business LLC", 
    email: "test@example.com",
    phone: "(555) 123-4567",
    website: "https://testbusiness.com",
    address: "123 Test Street",
    city: "Test City", 
    state: "CA",
    zip: "90210",
    description: "Test business for extension",
    packageType: "growth",
    sessionId: "test_session_123"
  })
}).then(r => r.json()).then(console.log)
```

### **Step 2: Get Customer ID**
The response will include the generated Customer ID.

### **Step 3: Test Extension**
Use the Customer ID in your extension.

## 🔍 **CHECKING EXISTING CUSTOMERS**

### **Check Your Airtable**
1. **Open your Airtable base**
2. **Look for existing Customer IDs**
3. **Use any existing Customer ID for testing**

### **Check via API**
```javascript
// Get pending customers
fetch('/api/autobolt/pending-customers')
  .then(r => r.json())
  .then(data => {
    console.log('Available Customer IDs:', 
      data.customers?.map(c => c.customerId)
    )
  })
```

## 🎯 **RECOMMENDED TEST CUSTOMER ID**

Try this format first:
```
DIR-2024-123456TEST
```

If that doesn't work, you'll need to:
1. **Create a real test customer** through your website
2. **Use the generated Customer ID**
3. **Test the extension with real data**

## 🚨 **IMPORTANT NOTES**

### **Customer ID Must Exist**
- The extension validates Customer IDs against your Airtable
- You need a real Customer ID that exists in your database
- Test IDs won't work unless they're in Airtable

### **Customer Status Must Be Valid**
- Customer status must be: `pending`, `in-progress`, or `completed`
- Customer must have a `packageType`
- Customer record must be complete

## 🎯 **EASIEST SOLUTION**

**Create a test purchase on your own website:**
1. Go to DirectoryBolt.com
2. Choose a package (use Stripe test mode)
3. Complete checkout with test data
4. Fill out business information form
5. Use the generated Customer ID in extension

This ensures you have a valid Customer ID that will work with the extension!