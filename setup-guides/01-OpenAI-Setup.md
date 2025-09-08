# 🤖 **OpenAI API Setup Guide**

## **Step 1: Create OpenAI Account & Get API Key**

### **1.1 Sign Up for OpenAI**
1. Go to https://platform.openai.com/
2. Click "Sign up" or "Log in" if you have an account
3. Complete account verification

### **1.2 Add Payment Method**
1. Go to https://platform.openai.com/account/billing
2. Click "Add payment method"
3. Add a credit card (required for API access)
4. Add $20-50 credit (should be plenty for testing)

### **1.3 Create API Key**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "DirectoryBolt Development"
4. Copy the key (starts with `sk-proj-` or `sk-`)
5. **IMPORTANT:** Save it immediately - you can't see it again!

### **1.4 Configure in DirectoryBolt**
1. Open your `.env.local` file
2. Replace this line:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   With:
   ```bash
   OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
   ```

### **1.5 Test the Setup**
Run this command to test OpenAI integration:
```bash
npm run test:ai
```

## **Expected Costs**
- **Testing:** $5-10 total
- **Development:** $10-20/month
- **Production:** $50-200/month (depending on usage)

## **Security Notes**
- ✅ Never commit API keys to git
- ✅ Use different keys for development/production
- ✅ Monitor usage at https://platform.openai.com/usage
- ✅ Set usage limits to prevent unexpected charges

## **Troubleshooting**
- **"Invalid API key"** → Check key format and regenerate if needed
- **"Quota exceeded"** → Add more credits to your account
- **"Rate limit"** → Wait a few minutes and try again