const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class GeminiDirectorySubmitter {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenWidth = 1440;
    this.screenHeight = 900;
    this.apiKey = process.env.GEMINI_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
  }

  async initialize() {
    console.log('🚀 Initializing browser...');
    this.browser = await chromium.launch({ 
      headless: false, // Set to true for production
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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
      
      // Send to Gemini Computer Use using the correct API format
      const response = await this.callGeminiAPI(prompt, screenshot);
      
      if (!response || !response.candidates || response.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const candidate = response.candidates[0];
      console.log('🤖 Gemini response received');
      
      // Execute the agent loop
      const result = await this.executeAgentLoop(candidate, businessData);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error submitting to ${directoryUrl}:`, error);
      return {
        status: 'failed',
        message: error.message,
        screenshot: await this.page.screenshot({ type: 'png' })
      };
    }
  }

  async callGeminiAPI(prompt, screenshot) {
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/png",
                data: screenshot.toString('base64')
              }
            }
          ]
        }
      ],
      tools: [
        {
          computer_use: {
            environment: "ENVIRONMENT_BROWSER"
          }
        }
      ]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-computer-use-preview-10-2025:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async executeAgentLoop(initialCandidate, businessData) {
    const contents = [initialCandidate.content];
    const maxTurns = 10;
    
    for (let turn = 0; turn < maxTurns; turn++) {
      console.log(`🔄 Turn ${turn + 1}`);
      
      const candidate = contents[contents.length - 1];
      
      // Check if there are function calls to execute
      const functionCalls = this.extractFunctionCalls(candidate);
      
      if (functionCalls.length === 0) {
        // No more actions, check if we're done
        const textResponse = this.extractTextResponse(candidate);
        console.log('✅ Task completed:', textResponse);
        return {
          status: 'submitted',
          message: textResponse || 'Successfully submitted to directory',
          screenshot: await this.page.screenshot({ type: 'png' })
        };
      }
      
      // Execute function calls
      console.log(`🔧 Executing ${functionCalls.length} actions...`);
      const results = await this.executeFunctionCalls(functionCalls);
      
      // Take new screenshot
      const newScreenshot = await this.page.screenshot({ type: 'png' });
      
      // Send function responses back to Gemini
      const functionResponses = this.createFunctionResponses(functionCalls, results, newScreenshot);
      
      // Get next response from Gemini
      const nextResponse = await this.sendFunctionResponses(functionResponses);
      
      if (!nextResponse || !nextResponse.candidates || nextResponse.candidates.length === 0) {
        throw new Error('No response from Gemini after function execution');
      }
      
      contents.push(nextResponse.candidates[0].content);
    }
    
    return {
      status: 'failed',
      message: 'Maximum turns reached without completion',
      screenshot: await this.page.screenshot({ type: 'png' })
    };
  }

  extractFunctionCalls(candidate) {
    const functionCalls = [];
    
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.function_call) {
          functionCalls.push(part.function_call);
        }
      }
    }
    
    return functionCalls;
  }

  extractTextResponse(candidate) {
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          return part.text;
        }
      }
    }
    return null;
  }

  async executeFunctionCalls(functionCalls) {
    const results = [];
    
    for (const functionCall of functionCalls) {
      const { name, args } = functionCall;
      console.log(`  -> Executing: ${name}`);
      
      try {
        let result = {};
        
        switch (name) {
          case 'open_web_browser':
            // Browser is already open
            result = { status: 'success' };
            break;
            
          case 'click_at':
            const clickX = this.denormalizeX(args.x);
            const clickY = this.denormalizeY(args.y);
            await this.page.mouse.click(clickX, clickY);
            result = { status: 'success', x: clickX, y: clickY };
            break;
            
          case 'type_text_at':
            const typeX = this.denormalizeX(args.x);
            const typeY = this.denormalizeY(args.y);
            await this.page.mouse.click(typeX, typeY);
            
            // Clear field and type
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(args.text);
            
            if (args.press_enter) {
              await this.page.keyboard.press('Enter');
            }
            
            result = { status: 'success', text: args.text };
            break;
            
          case 'navigate':
            await this.page.goto(args.url, { waitUntil: 'networkidle' });
            result = { status: 'success', url: args.url };
            break;
            
          case 'wait_5_seconds':
            await new Promise(resolve => setTimeout(resolve, 5000));
            result = { status: 'success' };
            break;
            
          default:
            console.log(`⚠️ Unimplemented function: ${name}`);
            result = { status: 'unimplemented', function: name };
        }
        
        // Wait for potential page changes
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        results.push({ name, result });
        
      } catch (error) {
        console.error(`❌ Error executing ${name}:`, error);
        results.push({ name, result: { status: 'error', error: error.message } });
      }
    }
    
    return results;
  }

  createFunctionResponses(functionCalls, results, screenshot) {
    const functionResponses = [];
    
    for (let i = 0; i < functionCalls.length; i++) {
      const functionCall = functionCalls[i];
      const result = results[i];
      
      functionResponses.push({
        name: functionCall.name,
        response: {
          url: this.page.url(),
          ...result.result
        },
        parts: [
          {
            inline_data: {
              mime_type: "image/png",
              data: screenshot.toString('base64')
            }
          }
        ]
      });
    }
    
    return functionResponses;
  }

  async sendFunctionResponses(functionResponses) {
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: functionResponses.map(fr => ({ function_response: fr }))
        }
      ],
      tools: [
        {
          computer_use: {
            environment: "ENVIRONMENT_BROWSER"
          }
        }
      ]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-computer-use-preview-10-2025:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  denormalizeX(x) {
    return Math.round((x / 1000) * this.screenWidth);
  }

  denormalizeY(y) {
    return Math.round((y / 1000) * this.screenHeight);
  }

  createSubmissionPrompt(businessData) {
    return `You are an AI assistant helping to submit business information to a directory website. 

Your task is to:
1. Fill out the business submission form with the following information:
   - Business Name: ${businessData.business_name}
   - Email: ${businessData.email}
   - Phone: ${businessData.phone}
   - Website: ${businessData.website}
   - Address: ${businessData.address}
   - City: ${businessData.city}
   - State: ${businessData.state}
   - ZIP: ${businessData.zip}

2. Look for form fields on the page and fill them out accurately
3. Handle any CAPTCHAs or verification steps if they appear
4. Submit the form when all fields are filled
5. Verify the submission was successful

Please proceed step by step, taking screenshots after each action to show your progress.`;
  }

  async checkSubmissionSuccess(screenshot) {
    // Simple success detection - look for common success indicators
    const pageContent = await this.page.content();
    const successIndicators = [
      'thank you',
      'success',
      'submitted',
      'confirmation',
      'received'
    ];
    
    return successIndicators.some(indicator => 
      pageContent.toLowerCase().includes(indicator)
    );
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

module.exports = GeminiDirectorySubmitter;