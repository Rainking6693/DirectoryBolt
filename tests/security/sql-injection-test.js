/**
 * Security Test: SQL Injection Prevention for Stripe Webhook Handler
 * Location: /tests/security/sql-injection-test.js
 * 
 * This test verifies that all SQL injection vulnerabilities in the Stripe webhook
 * handler have been properly fixed with input sanitization and validation.
 */

const { describe, it, expect, beforeAll, afterAll, jest } = require('@jest/globals')

// Mock the actual webhook functions to test the security functions in isolation
const { 
  sanitizeAirtableInput,
  validateStripeCustomerId,
  validateStripeSubscriptionId,
  validateStripePaymentIntentId,
  createSafeFilterFormula
} = require('../../pages/api/webhooks/stripe')

describe('SQL Injection Prevention Tests', () => {
  
  describe('sanitizeAirtableInput', () => {
    it('should sanitize dangerous characters', () => {
      const maliciousInput = `'; DROP TABLE customers; --`
      const sanitized = sanitizeAirtableInput(maliciousInput)
      expect(sanitized).not.toContain('DROP TABLE')
      expect(sanitized).not.toContain(';')
      expect(sanitized).not.toContain('--')
    })

    it('should escape single quotes', () => {
      const input = "O'Malley's Business"
      const sanitized = sanitizeAirtableInput(input)
      expect(sanitized).toBe("O\\'Malley\\'s Business")
    })

    it('should escape double quotes and backslashes', () => {
      const input = 'Business "Name" with \\backslash'
      const sanitized = sanitizeAirtableInput(input)
      expect(sanitized).toBe('Business \\"Name\\" with \\\\backslash')
    })

    it('should remove control characters', () => {
      const input = 'Business\x00Name\x1fTest'
      const sanitized = sanitizeAirtableInput(input)
      expect(sanitized).toBe('BusinessNameTest')
    })

    it('should handle null and undefined values', () => {
      expect(sanitizeAirtableInput(null)).toBe('')
      expect(sanitizeAirtableInput(undefined)).toBe('')
    })

    it('should trim whitespace', () => {
      const input = '   Business Name   '
      const sanitized = sanitizeAirtableInput(input)
      expect(sanitized).toBe('Business Name')
    })
  })

  describe('validateStripeCustomerId', () => {
    it('should accept valid Stripe customer IDs', () => {
      const validIds = [
        'cus_1234567890abcd',
        'cus_NnhZhm9Zv5fOVS',
        'cus_OjOGR0z1b2GsUt'
      ]
      
      validIds.forEach(id => {
        expect(() => validateStripeCustomerId(id)).not.toThrow()
        expect(validateStripeCustomerId(id)).toBe(id)
      })
    })

    it('should reject invalid Stripe customer IDs', () => {
      const invalidIds = [
        null,
        undefined,
        '',
        'invalid_id',
        'cus_',
        'cus_123', // too short
        'sub_1234567890abcd', // wrong prefix
        "cus_'; DROP TABLE customers; --",
        'cus_<script>alert(1)</script>',
        'cus_1234567890abcd OR 1=1'
      ]
      
      invalidIds.forEach(id => {
        expect(() => validateStripeCustomerId(id)).toThrow()
      })
    })
  })

  describe('validateStripeSubscriptionId', () => {
    it('should accept valid Stripe subscription IDs', () => {
      const validIds = [
        'sub_1234567890abcd',
        'sub_NnhZhm9Zv5fOVS',
        'sub_OjOGR0z1b2GsUt'
      ]
      
      validIds.forEach(id => {
        expect(() => validateStripeSubscriptionId(id)).not.toThrow()
        expect(validateStripeSubscriptionId(id)).toBe(id)
      })
    })

    it('should reject invalid Stripe subscription IDs', () => {
      const invalidIds = [
        null,
        undefined,
        '',
        'invalid_id',
        'sub_',
        'sub_123', // too short
        'cus_1234567890abcd', // wrong prefix
        "sub_'; DROP TABLE subscriptions; --",
        'sub_<script>alert(1)</script>',
        'sub_1234567890abcd OR 1=1'
      ]
      
      invalidIds.forEach(id => {
        expect(() => validateStripeSubscriptionId(id)).toThrow()
      })
    })
  })

  describe('validateStripePaymentIntentId', () => {
    it('should accept valid Stripe payment intent IDs', () => {
      const validIds = [
        'pi_1234567890abcd',
        'pi_NnhZhm9Zv5fOVS',
        'pi_OjOGR0z1b2GsUt'
      ]
      
      validIds.forEach(id => {
        expect(() => validateStripePaymentIntentId(id)).not.toThrow()
        expect(validateStripePaymentIntentId(id)).toBe(id)
      })
    })

    it('should reject invalid Stripe payment intent IDs', () => {
      const invalidIds = [
        null,
        undefined,
        '',
        'invalid_id',
        'pi_',
        'pi_123', // too short
        'cus_1234567890abcd', // wrong prefix
        "pi_'; DROP TABLE payments; --",
        'pi_<script>alert(1)</script>',
        'pi_1234567890abcd OR 1=1'
      ]
      
      invalidIds.forEach(id => {
        expect(() => validateStripePaymentIntentId(id)).toThrow()
      })
    })
  })

  describe('createSafeFilterFormula', () => {
    it('should create safe filter formulas', () => {
      const fieldName = 'stripeCustomerId'
      const value = 'cus_1234567890abcd'
      const formula = createSafeFilterFormula(fieldName, value)
      
      expect(formula).toBe("{stripeCustomerId} = 'cus_1234567890abcd'")
    })

    it('should sanitize field names', () => {
      const fieldName = 'stripe<script>alert(1)</script>CustomerId'
      const value = 'cus_1234567890abcd'
      const formula = createSafeFilterFormula(fieldName, value)
      
      expect(formula).toBe("{stripescriptalert1scriptCustomerId} = 'cus_1234567890abcd'")
    })

    it('should sanitize malicious values', () => {
      const fieldName = 'stripeCustomerId'
      const value = "cus_123'; DROP TABLE customers; --"
      const formula = createSafeFilterFormula(fieldName, value)
      
      expect(formula).not.toContain('DROP TABLE')
      expect(formula).not.toContain(';')
      expect(formula).not.toContain('--')
      expect(formula).toBe("{stripeCustomerId} = 'cus_123\\' DROP TABLE customers --'")
    })

    it('should handle special characters in values', () => {
      const fieldName = 'businessName'
      const value = `O'Malley's "Special" Business & Co.`
      const formula = createSafeFilterFormula(fieldName, value)
      
      expect(formula).toBe(`{businessName} = 'O\\'Malley\\'s \\"Special\\" Business & Co.'`)
    })
  })

  describe('Integration Tests - Injection Prevention', () => {
    it('should prevent SQL injection through customer ID fields', () => {
      const maliciousCustomerId = "cus_1234567890abcd'; DELETE FROM customers; --"
      
      // This should throw an error due to validation
      expect(() => validateStripeCustomerId(maliciousCustomerId)).toThrow('Invalid Stripe customer ID format')
    })

    it('should prevent SQL injection through subscription ID fields', () => {
      const maliciousSubscriptionId = "sub_1234567890abcd'; UPDATE subscriptions SET status='cancelled'; --"
      
      // This should throw an error due to validation
      expect(() => validateStripeSubscriptionId(maliciousSubscriptionId)).toThrow('Invalid Stripe subscription ID format')
    })

    it('should prevent XSS injection through sanitization', () => {
      const xssPayload = '<script>alert("XSS")</script>'
      const sanitized = sanitizeAirtableInput(xssPayload)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
      expect(sanitized).toBe('scriptalert(\"XSS\")/script')
    })

    it('should prevent NoSQL injection patterns', () => {
      const noSqlInjection = "{ '$ne': null }"
      const sanitized = sanitizeAirtableInput(noSqlInjection)
      
      expect(sanitized).toBe("\\{ '\$ne': null \\}")
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(sanitizeAirtableInput('')).toBe('')
      expect(() => validateStripeCustomerId('')).toThrow()
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000)
      const sanitized = sanitizeAirtableInput(longString)
      expect(sanitized).toBe(longString)
    })

    it('should handle unicode characters', () => {
      const unicode = 'Business™ 企业 ñoñó 🚀'
      const sanitized = sanitizeAirtableInput(unicode)
      expect(sanitized).toBe(unicode)
    })

    it('should handle numeric values', () => {
      const number = 12345
      const sanitized = sanitizeAirtableInput(number)
      expect(sanitized).toBe('12345')
    })

    it('should handle boolean values', () => {
      expect(sanitizeAirtableInput(true)).toBe('true')
      expect(sanitizeAirtableInput(false)).toBe('false')
    })
  })

  describe('Performance Tests', () => {
    it('should handle large numbers of validation calls efficiently', () => {
      const validCustomerId = 'cus_1234567890abcd'
      const startTime = Date.now()
      
      for (let i = 0; i < 10000; i++) {
        validateStripeCustomerId(validCustomerId)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete 10,000 validations in under 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should handle large strings efficiently', () => {
      const largeString = 'safe_text_'.repeat(1000)
      const startTime = Date.now()
      
      for (let i = 0; i < 1000; i++) {
        sanitizeAirtableInput(largeString)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete 1,000 sanitizations in under 1 second
      expect(duration).toBeLessThan(1000)
    })
  })
})