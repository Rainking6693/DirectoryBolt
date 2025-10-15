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
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    try {
      // Navigate to directory
      console.log('🌐 Navigating to:', directoryUrl);
      await this.page.goto(directoryUrl, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('✅ Page loaded, current URL:', this.page.url());
      
      // Take initial screenshot and save it
      const screenshot = await this.page.screenshot({ type: 'png' });
      const initialPath = path.join(screenshotsDir, 'initial-page.png');
      fs.writeFileSync(initialPath, screenshot);
      console.log(`📸 Initial screenshot saved: ${initialPath}`);
      
      // Create the prompt for Gemini
      const prompt = this.createSubmissionPrompt(businessData);
      console.log('📝 Sending prompt to Gemini...');
      
      // Send to Gemini Computer Use using the correct API format
      const response = await this.callGeminiAPI(prompt, screenshot);
      
      if (!response || !response.candidates || response.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const candidate = response.candidates[0];
      console.log('🤖 Gemini response received');
      console.log('📋 Full response:', JSON.stringify(response, null, 2));
      
      // Execute the agent loop with initial conversation
      const initialContents = [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/png',
                data: screenshot.toString('base64')
              }
            }
          ]
        },
        candidate.content
      ];
      
      const result = await this.executeAgentLoop(initialContents, businessData);
      
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

  async executeAgentLoop(initialContents, businessData) {
    // Start with the full initial conversation (user message + first model response)
    const contents = [...initialContents];
    const maxTurns = 10;
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    for (let turn = 0; turn < maxTurns; turn++) {
      console.log(`🔄 Turn ${turn + 1}`);
      
      const candidate = contents[contents.length - 1];
      
      // Debug: Log the full candidate structure
      console.log('📋 Candidate structure:', JSON.stringify(candidate, null, 2));
      
      // Check if there are function calls to execute
      const functionCalls = this.extractFunctionCalls(candidate);
      
      if (functionCalls.length === 0) {
        // No more actions, check if we're done
        const textResponse = this.extractTextResponse(candidate);
        console.log('⚠️ No function calls found!');
        console.log('📝 Text response:', textResponse);
        
        // Save final screenshot
        const finalScreenshot = await this.page.screenshot({ type: 'png' });
        const finalPath = path.join(screenshotsDir, `final-turn-${turn + 1}.png`);
        fs.writeFileSync(finalPath, finalScreenshot);
        console.log(`📸 Final screenshot saved: ${finalPath}`);
        
        return {
          status: 'submitted',
          message: textResponse || 'Successfully submitted to directory',
          screenshot: finalScreenshot
        };
      }
      
      // Execute function calls
      console.log(`🔧 Executing ${functionCalls.length} actions...`);
      console.log('📋 Function calls:', JSON.stringify(functionCalls, null, 2));
      
      const results = await this.executeFunctionCalls(functionCalls);
      
      // Take new screenshot and save it
      const newScreenshot = await this.page.screenshot({ type: 'png' });
      const screenshotPath = path.join(screenshotsDir, `turn-${turn + 1}-after-actions.png`);
      fs.writeFileSync(screenshotPath, newScreenshot);
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      
      // Create function response parts
      const functionResponseParts = this.createFunctionResponses(functionCalls, results, newScreenshot);
      
      // Add function responses to conversation history
      contents.push({
        role: 'user',
        parts: functionResponseParts
      });
      
      // Get next response from Gemini with full conversation history
      const nextResponse = await this.sendConversationTurn(contents);
      
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
    
    // Handle both direct candidate and candidate.content
    const content = candidate.content || candidate;
    
    if (content && content.parts) {
      console.log(`🔍 Checking ${content.parts.length} parts for function calls...`);
      for (const part of content.parts) {
        console.log('🔍 Part type:', Object.keys(part));
        // Check for both camelCase (SDK response) and snake_case (REST API)
        if (part.functionCall || part.function_call) {
          const functionCall = part.functionCall || part.function_call;
          console.log('✅ Found function call:', functionCall);
          functionCalls.push(functionCall);
        }
      }
    } else {
      console.log('⚠️ No content.parts found in candidate');
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
    const parts = [];
    
    for (let i = 0; i < functionCalls.length; i++) {
      const functionCall = functionCalls[i];
      const result = results[i];
      
      parts.push({
        functionResponse: {
          name: functionCall.name,
          response: {
            url: this.page.url(),
            ...result.result
          }
        }
      });
    }
    
    // Add screenshot as a separate part
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: screenshot.toString('base64')
      }
    });
    
    return parts;
  }

  async sendConversationTurn(contents) {
    const requestBody = {
      contents: contents,
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