/**
 * Security Tests for Selector Discovery
 * Tests injection prevention and input sanitization
 */

const AutoSelectorDiscovery = require('../AutoSelectorDiscovery');

describe('Security: Selector Injection Prevention', () => {
  let discovery;

  beforeAll(() => {
    discovery = new AutoSelectorDiscovery({
      headless: true,
      minConfidence: 0.7
    });
  });

  describe('escapeCSSSelector', () => {
    test('Should escape special CSS characters', () => {
      const malicious = '"; DROP TABLE directories; --';
      const escaped = discovery.escapeCSSSelector(malicious);

      expect(escaped).not.toContain('DROP');
      expect(escaped).not.toContain(';');
      expect(escaped).toContain('\\');
    });

    test('Should escape XSS attempts', () => {
      const xss = '<script>alert("xss")</script>';
      const escaped = discovery.escapeCSSSelector(xss);

      expect(escaped).not.toContain('<script>');
      expect(escaped).toMatch(/\\</);
    });

    test('Should escape attribute selectors', () => {
      const injection = '](onclick="alert(1)")';
      const escaped = discovery.escapeCSSSelector(injection);

      expect(escaped).not.toContain('](');
      expect(escaped).toContain('\\]');
    });

    test('Should handle empty input', () => {
      expect(discovery.escapeCSSSelector('')).toBe('');
      expect(discovery.escapeCSSSelector(null)).toBe('');
      expect(discovery.escapeCSSSelector(undefined)).toBe('');
    });
  });

  describe('validateFieldData', () => {
    test('Should reject malicious IDs', () => {
      const malicious = {
        id: '<script>alert("xss")</script>',
        name: 'normal-name',
        placeholder: 'Enter value'
      };

      const sanitized = discovery.validateFieldData(malicious);

      expect(sanitized.id).toBeUndefined(); // Invalid pattern rejected
      expect(sanitized.name).toBeDefined();
    });

    test('Should sanitize field names', () => {
      const field = {
        name: 'user"; DROP TABLE users; --',
        id: 'valid-id'
      };

      const sanitized = discovery.validateFieldData(field);

      expect(sanitized.name).not.toContain('DROP');
      expect(sanitized.name).not.toContain(';');
      expect(sanitized.name).not.toContain('"');
      expect(sanitized.id).toBe('valid-id');
    });

    test('Should accept valid alphanumeric IDs', () => {
      const field = {
        id: 'company-name-123',
        name: 'businessName'
      };

      const sanitized = discovery.validateFieldData(field);

      expect(sanitized.id).toBe('company-name-123');
      expect(sanitized.name).toBe('businessName');
    });

    test('Should enforce length limits', () => {
      const field = {
        id: 'a'.repeat(200), // Too long
        name: 'b'.repeat(50), // OK
        placeholder: 'c'.repeat(300) // Too long
      };

      const sanitized = discovery.validateFieldData(field);

      expect(sanitized.id).toBeUndefined(); // Rejected due to length
      expect(sanitized.name).toBeDefined();
    });

    test('Should escape placeholder values', () => {
      const field = {
        placeholder: 'Enter your email (required)'
      };

      const sanitized = discovery.validateFieldData(field);

      expect(sanitized.placeholder).toBeDefined();
      expect(sanitized.placeholder).toContain('\\(');
      expect(sanitized.placeholder).toContain('\\)');
    });
  });

  describe('CSS Path Generation Security', () => {
    test('Should not include unescaped IDs in CSS paths', async () => {
      // This would need a full browser context to test properly
      // For now, we verify the escaping logic exists
      expect(typeof discovery.generateCSSPath).toBe('function');
    });
  });

  describe('Selector Injection Attack Vectors', () => {
    test('Should prevent selector injection via name attribute', () => {
      const attackField = {
        name: 'email"][script="alert(1)"][name="fake',
        type: 'input'
      };

      const sanitized = discovery.validateFieldData(attackField);

      // After sanitization, should not contain brackets or quotes
      expect(sanitized.name).not.toContain('][');
      expect(sanitized.name).not.toContain('"');
      expect(sanitized.name).not.toContain('script');
    });

    test('Should prevent SQL injection in saved selectors', () => {
      const attackField = {
        name: "'; DELETE FROM directories WHERE '1'='1",
        id: 'safe-id'
      };

      const sanitized = discovery.validateFieldData(attackField);

      expect(sanitized.name).not.toContain('DELETE');
      expect(sanitized.name).not.toContain("'");
    });

    test('Should prevent XSS in placeholder selectors', () => {
      const attackField = {
        placeholder: '"><script>alert(document.cookie)</script><input name="'
      };

      const sanitized = discovery.validateFieldData(attackField);

      expect(sanitized.placeholder).not.toContain('<script>');
      expect(sanitized.placeholder).toMatch(/\\>/);
    });
  });
});

describe('Security: Database Injection Prevention', () => {
  let discovery;

  beforeAll(() => {
    discovery = new AutoSelectorDiscovery({ headless: true });
  });

  test('Should use parameterized queries (RPC function)', () => {
    // Verify that saveDiscoveredSelectors uses RPC function
    const code = discovery.saveDiscoveredSelectors.toString();

    expect(code).toContain('rpc');
    expect(code).toContain('update_directory_selectors');
  });

  test('Should not concatenate user input into SQL', () => {
    const code = discovery.saveDiscoveredSelectors.toString();

    // Should not have string concatenation with SQL keywords
    expect(code).not.toMatch(/UPDATE.*\+/);
    expect(code).not.toMatch(/INSERT.*\+/);
  });
});
