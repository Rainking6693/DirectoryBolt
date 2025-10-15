/**
 * 2Captcha Integration for Gemini Worker
 * Solves CAPTCHAs for medium difficulty directories
 */

const axios = require('axios');

class TwoCaptchaSolver {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.TWO_CAPTCHA_API_KEY || process.env.TWOCAPTCHA_API_KEY;
    this.baseUrl = 'https://2captcha.com';
    
    if (!this.apiKey) {
      console.warn('⚠️ 2Captcha API key not configured. CAPTCHA solving will be disabled.');
    }
  }

  /**
   * Solve image CAPTCHA
   * @param {Buffer} imageBuffer - Screenshot or CAPTCHA image
   */
  async solveImageCaptcha(imageBuffer) {
    if (!this.apiKey) {
      throw new Error('2Captcha API key not configured');
    }

    try {
      console.log('🔄 Sending CAPTCHA to 2Captcha...');
      
      // Submit CAPTCHA
      const submitResponse = await axios.post(
        `${this.baseUrl}/in.php`,
        {
          key: this.apiKey,
          method: 'base64',
          body: imageBuffer.toString('base64'),
          json: 1
        }
      );

      if (submitResponse.data.status !== 1) {
        throw new Error(`2Captcha submission failed: ${submitResponse.data.request}`);
      }

      const captchaId = submitResponse.data.request;
      console.log(`✅ CAPTCHA submitted, ID: ${captchaId}`);
      console.log('⏳ Waiting for solution (typically 10-30 seconds)...');

      // Poll for result
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts × 5 seconds = 100 seconds max wait

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;

        const resultResponse = await axios.get(
          `${this.baseUrl}/res.php`,
          {
            params: {
              key: this.apiKey,
              action: 'get',
              id: captchaId,
              json: 1
            }
          }
        );

        if (resultResponse.data.status === 1) {
          console.log(`✅ CAPTCHA solved: ${resultResponse.data.request}`);
          return {
            success: true,
            solution: resultResponse.data.request,
            captchaId
          };
        }

        if (resultResponse.data.request !== 'CAPCHA_NOT_READY') {
          throw new Error(`2Captcha error: ${resultResponse.data.request}`);
        }

        console.log(`⏳ Attempt ${attempts}/${maxAttempts}...`);
      }

      throw new Error('Timeout waiting for CAPTCHA solution');

    } catch (error) {
      console.error('❌ 2Captcha error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Solve reCAPTCHA v2
   * @param {string} siteKey - reCAPTCHA site key
   * @param {string} pageUrl - URL of the page with reCAPTCHA
   */
  async solveRecaptchaV2(siteKey, pageUrl) {
    if (!this.apiKey) {
      throw new Error('2Captcha API key not configured');
    }

    try {
      console.log('🔄 Solving reCAPTCHA v2...');
      
      // Submit reCAPTCHA
      const submitResponse = await axios.post(
        `${this.baseUrl}/in.php`,
        {
          key: this.apiKey,
          method: 'userrecaptcha',
          googlekey: siteKey,
          pageurl: pageUrl,
          json: 1
        }
      );

      if (submitResponse.data.status !== 1) {
        throw new Error(`2Captcha submission failed: ${submitResponse.data.request}`);
      }

      const captchaId = submitResponse.data.request;
      console.log(`✅ reCAPTCHA submitted, ID: ${captchaId}`);
      console.log('⏳ Waiting for solution (typically 20-60 seconds)...');

      // Poll for result
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts × 5 seconds = 150 seconds max wait

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

        const resultResponse = await axios.get(
          `${this.baseUrl}/res.php`,
          {
            params: {
              key: this.apiKey,
              action: 'get',
              id: captchaId,
              json: 1
            }
          }
        );

        if (resultResponse.data.status === 1) {
          console.log(`✅ reCAPTCHA solved`);
          return {
            success: true,
            solution: resultResponse.data.request,
            captchaId
          };
        }

        if (resultResponse.data.request !== 'CAPCHA_NOT_READY') {
          throw new Error(`2Captcha error: ${resultResponse.data.request}`);
        }

        console.log(`⏳ Attempt ${attempts}/${maxAttempts}...`);
      }

      throw new Error('Timeout waiting for reCAPTCHA solution');

    } catch (error) {
      console.error('❌ 2Captcha error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/res.php`,
        {
          params: {
            key: this.apiKey,
            action: 'getbalance',
            json: 1
          }
        }
      );

      if (response.data.status === 1) {
        const balance = parseFloat(response.data.request);
        console.log(`💰 2Captcha balance: $${balance.toFixed(2)}`);
        return {
          success: true,
          balance
        };
      }

      throw new Error(response.data.request);

    } catch (error) {
      console.error('❌ Failed to get balance:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Report bad CAPTCHA solution
   */
  async reportBad(captchaId) {
    if (!this.apiKey) return false;

    try {
      await axios.get(
        `${this.baseUrl}/res.php`,
        {
          params: {
            key: this.apiKey,
            action: 'reportbad',
            id: captchaId,
            json: 1
          }
        }
      );
      
      console.log(`⚠️ Reported bad CAPTCHA solution: ${captchaId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to report bad solution:', error.message);
      return false;
    }
  }
}

module.exports = TwoCaptchaSolver;

