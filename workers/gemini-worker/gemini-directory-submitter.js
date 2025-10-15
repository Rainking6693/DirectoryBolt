const { chromium } = require('playwright');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiDirectorySubmitter {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-computer-use-preview-10-2025',
      tools: [{
        computerUse: {
          environment: 'ENVIRONMENT_BROWSER'
        }
      }]
    });
    this.browser = null;
    this.page = null;
    this.screenWidth = 1440;
    this.screenHeight = 900;
  }

  async initialize() {
    console.log('🚀 Initializing Gemini-powered directory submitter...');
    
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-gpu', '--no-sandbox']
    });
    
    const context = await this.browser.newContext({
      viewport: { width: this.screenWidth, height: this.screenHeight }
    });
    
    this.page = await context.newPage();
    console.log('✅ Browser initialized');
  }

  async submitToDirectory(directoryUrl, businessData) {
    console.log(`🎯 Submitting to directory: ${directoryUrl}`);
    
    try {
      // Navigate to directory
      await this.page.goto(directoryUrl, { waitUntil: 'networkidle' });
      
      // Take initial screenshot
      const screenshot = await this.page.screenshot({ type: 'png' });
      
      // Create the prompt for Gemini
      const prompt = this.createSubmissionPrompt(businessData);
      
      // Send to Gemini Computer Use
      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: screenshot.toString('base64')
                }
              }
            ]
          }
        ]
      });

      // Execute Gemini's suggested actions
      const response = await result.response;
      const actions = this.extractActions(response);
      
      for (const action of actions) {
        await this.executeAction(action);
        
        // Take screenshot after each action
        const newScreenshot = await this.page.screenshot({ type: 'png' });
        
        // Send feedback to Gemini
        await this.sendFeedback(action, newScreenshot);
      }
      
      // Check for success
      const finalScreenshot = await this.page.screenshot({ type: 'png' });
      const success = await this.checkSubmissionSuccess(finalScreenshot);
      
      return {
        status: success ? 'submitted' : 'failed',
        message: success ? 'Successfully submitted to directory' : 'Failed to submit',
        screenshot: finalScreenshot
      };
      
    } catch (error) {
      console.error(`❌ Error submitting to ${directoryUrl}:`, error);
      return {
        status: 'failed',
        message: error.message,
        screenshot: await this.page.screenshot({ type: 'png' })
      };
    }
  }

  createSubmissionPrompt(businessData) {
    return `
You are an AI assistant helping to submit business information to a directory website.

BUSINESS INFORMATION TO SUBMIT:
- Business Name: ${businessData.business_name}
- Email: ${businessData.email}
- Phone: ${businessData.phone}
- Website: ${businessData.website}
- Address: ${businessData.address}
- City: ${businessData.city}
- State: ${businessData.state}
- ZIP: ${businessData.zip}

TASK:
1. Look at the current webpage screenshot
2. Find the business submission form
3. Fill in all the required fields with the business information above
4. Handle any CAPTCHA challenges if they appear
5. Submit the form
6. Verify the submission was successful

INSTRUCTIONS:
- Fill out ALL required form fields with the business information provided
- If you see a CAPTCHA, solve it using the available tools
- Look for submit buttons like "Submit", "Add Business", "Create Listing", etc.
- After submission, look for success messages or confirmation pages
- If the form has optional fields, you can skip them unless they seem important

Please proceed with filling out and submitting the form.
    `;
  }

  extractActions(response) {
    const actions = [];
    
    // Parse Gemini's response to extract function calls
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.function_call) {
            actions.push(part.function_call);
          }
        }
      }
    }
    
    return actions;
  }

  async executeAction(action) {
    const { name, args } = action;
    
    console.log(`🔧 Executing action: ${name}`);
    
    switch (name) {
      case 'click_at':
        const clickX = this.denormalizeX(args.x);
        const clickY = this.denormalizeY(args.y);
        await this.page.mouse.click(clickX, clickY);
        break;
        
      case 'type_text_at':
        const typeX = this.denormalizeX(args.x);
        const typeY = this.denormalizeY(args.y);
        await this.page.mouse.click(typeX, typeY);
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.type(args.text);
        if (args.press_enter) {
          await this.page.keyboard.press('Enter');
        }
        break;
        
      case 'scroll_document':
        await this.page.evaluate((direction) => {
          window.scrollBy(0, direction === 'down' ? 500 : -500);
        }, args.direction);
        break;
        
      case 'navigate':
        await this.page.goto(args.url);
        break;
        
      case 'wait_5_seconds':
        await this.page.waitForTimeout(5000);
        break;
        
      default:
        console.log(`⚠️ Unknown action: ${name}`);
    }
    
    // Wait for page to settle
    await this.page.waitForTimeout(1000);
  }

  async sendFeedback(action, screenshot) {
    // Send the result back to Gemini for next action
    const feedback = {
      action: action.name,
      result: 'completed',
      screenshot: screenshot.toString('base64')
    };
    
    // This would be part of the conversation loop with Gemini
    // Implementation depends on how you want to structure the conversation
  }

  async checkSubmissionSuccess(screenshot) {
    // Use Gemini to analyze the screenshot and determine if submission was successful
    const result = await this.model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Look at this screenshot. Did the business submission form get submitted successfully? Look for success messages, confirmation pages, or "thank you" messages. Respond with just "SUCCESS" or "FAILED".' },
            {
              inlineData: {
                mimeType: 'image/png',
                data: screenshot.toString('base64')
              }
            }
          ]
        }
      ]
    });
    
    const response = await result.response;
    const text = response.text();
    
    return text.toLowerCase().includes('success');
  }

  denormalizeX(x) {
    return Math.round((x / 1000) * this.screenWidth);
  }

  denormalizeY(y) {
    return Math.round((y / 1000) * this.screenHeight);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = GeminiDirectorySubmitter;
