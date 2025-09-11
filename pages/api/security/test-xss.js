/**
 * Security Testing API - XSS Protection Demonstration
 * This endpoint demonstrates how the application blocks XSS attempts
 * Used for functional security testing per Emily's requirements
 */

import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Initialize DOMPurify for server-side use
const window = new JSDOM('').window
const DOMPurifyServer = DOMPurify(window)

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    })
  }

  try {
    const { input, testType = 'basic' } = req.body

    if (!input) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Input field is required'
      })
    }

    // Test different XSS protection scenarios
    const results = {
      timestamp: new Date().toISOString(),
      testType,
      originalInput: input,
      sanitizedOutput: null,
      threatDetected: false,
      securityReport: {}
    }

    // Check for common XSS patterns
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[\s\S]*?>/gi,
      /<object[\s\S]*?>/gi,
      /<embed[\s\S]*?>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi
    ]

    // Detect threats
    const detectedThreats = []
    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        detectedThreats.push(pattern.source)
        results.threatDetected = true
      }
    }

    results.securityReport.detectedThreats = detectedThreats

    // Sanitize the input using DOMPurify
    const sanitizedInput = DOMPurifyServer.sanitize(input, {
      ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'strong', 'em', 'a'],
      ALLOWED_ATTR: ['class', 'id', 'href', 'title'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'javascript:', 'vbscript:'],
      ALLOW_DATA_ATTR: false,
      SANITIZE_DOM: true
    })

    results.sanitizedOutput = sanitizedInput
    results.securityReport.inputLength = input.length
    results.securityReport.outputLength = sanitizedInput.length
    results.securityReport.charactersRemoved = input.length - sanitizedInput.length
    results.securityReport.sanitizationEffective = input !== sanitizedInput

    // Determine security status
    let securityStatus = 'SAFE'
    if (results.threatDetected) {
      securityStatus = results.securityReport.sanitizationEffective ? 'THREAT_NEUTRALIZED' : 'THREAT_DETECTED'
    }

    results.securityReport.status = securityStatus

    // Add CSP violation simulation for demonstration
    if (testType === 'csp') {
      results.cspViolation = {
        blocked: true,
        reason: 'Content Security Policy would block this script execution',
        directive: 'script-src',
        violatingContent: input.match(/<script[\s\S]*?>[\s\S]*?<\/script>/gi) || []
      }
    }

    return res.status(200).json({
      success: true,
      message: 'XSS protection test completed',
      results
    })

  } catch (error) {
    console.error('XSS test endpoint error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'XSS protection test failed'
    })
  }
}