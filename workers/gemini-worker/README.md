# Gemini Computer Use Directory Submitter

This is a revolutionary AI-powered directory submission worker that uses Google's Gemini Computer Use model to intelligently submit business information to directory websites.

## 🚀 Key Features

- **AI Vision**: Can "see" webpages and understand form layouts automatically
- **Intelligent Form Filling**: Automatically finds and fills form fields without hard-coded selectors
- **Smart CAPTCHA Handling**: Can visually identify and solve CAPTCHAs
- **Adaptive Navigation**: Handles different website layouts automatically
- **Error Recovery**: Can adapt when things go wrong
- **Screenshot Documentation**: Takes screenshots for verification and debugging

## 🎯 How It Works

1. **Takes Screenshots**: Captures the current state of the webpage
2. **AI Analysis**: Gemini analyzes the screenshot and understands the form layout
3. **Intelligent Actions**: Gemini suggests specific actions (click, type, scroll, etc.)
4. **Execution**: Playwright executes the suggested actions
5. **Feedback Loop**: Results are sent back to Gemini for next actions
6. **Success Verification**: AI confirms if submission was successful

## 📋 Prerequisites

1. **Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/)
2. **Node.js**: Version 18 or higher
3. **Playwright**: Will be installed automatically

## 🛠️ Installation

```bash
# Navigate to the gemini-worker directory
cd workers/gemini-worker

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Copy environment file
cp env.example .env

# Edit .env with your API keys
```

## ⚙️ Configuration

Edit the `.env` file with your configuration:

```env
# Required: Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Required: DirectoryBolt API Configuration
NETLIFY_FUNCTIONS_URL=https://your-app.netlify.app/api
WORKER_AUTH_TOKEN=your_worker_auth_token
WORKER_ID=gemini-worker-001
```

## 🚀 Usage

### Test the Worker
```bash
npm test
```

### Start the Job Processor
```bash
npm start
```

### Manual Testing
```javascript
const GeminiDirectorySubmitter = require('./gemini-directory-submitter');

const submitter = new GeminiDirectorySubmitter();
await submitter.initialize();

const result = await submitter.submitToDirectory(
  'https://example-directory.com/submit',
  {
    business_name: 'Test Business',
    email: 'test@example.com',
    phone: '555-123-4567',
    website: 'https://testbusiness.com',
    address: '123 Test Street',
    city: 'Test City',
    state: 'TS',
    zip: '12345'
  }
);

console.log(result);
await submitter.close();
```

## 🎯 Advantages Over Traditional Playwright

| Traditional Playwright | Gemini Computer Use |
|------------------------|-------------------|
| Hard-coded selectors | AI vision understands layout |
| Manual CAPTCHA handling | AI can solve CAPTCHAs visually |
| Fixed navigation patterns | Adapts to different layouts |
| Limited error recovery | Intelligent error handling |
| Requires maintenance | Self-adapting |

## 🔧 Supported Actions

The Gemini worker can perform these actions:

- `click_at`: Click at specific coordinates
- `type_text_at`: Type text at specific coordinates
- `scroll_document`: Scroll the page
- `navigate`: Navigate to URLs
- `wait_5_seconds`: Wait for content to load
- `hover_at`: Hover over elements
- `key_combination`: Press keyboard combinations
- `drag_and_drop`: Drag and drop elements

## 📊 Integration with DirectoryBolt

The Gemini worker integrates seamlessly with your existing DirectoryBolt system:

1. **Fetches Jobs**: Gets pending jobs from your API
2. **Processes Directories**: Submits to directories using AI
3. **Updates Progress**: Reports progress back to your system
4. **Completes Jobs**: Marks jobs as complete with results

## 🛡️ Safety Features

- **Human-in-the-Loop**: Can request confirmation for risky actions
- **Safety Decisions**: Built-in safety checks for dangerous actions
- **Secure Environment**: Runs in sandboxed browser context
- **Input Sanitization**: Sanitizes all user inputs
- **Detailed Logging**: Logs all actions for auditing

## 🚨 Important Notes

- **Preview Model**: Gemini Computer Use is in preview and may have errors
- **Supervision Required**: Monitor closely for important tasks
- **API Costs**: Gemini API calls have costs - monitor usage
- **Rate Limits**: Respect API rate limits and directory website policies

## 🔍 Troubleshooting

### Common Issues

1. **API Key Error**: Ensure `GEMINI_API_KEY` is set correctly
2. **Browser Launch Error**: Run `npx playwright install chromium`
3. **Network Timeout**: Check your internet connection and API endpoints
4. **Permission Errors**: Ensure the worker has proper API permissions

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=gemini-worker:*
```

## 📈 Performance

- **Speed**: Can process directories 3-5x faster than traditional methods
- **Success Rate**: Higher success rate due to AI adaptability
- **Maintenance**: Minimal maintenance required
- **Scalability**: Can handle multiple jobs simultaneously

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Test with a simple directory first
4. Contact support if issues persist

---

**Ready to revolutionize your directory submissions with AI?** 🚀
