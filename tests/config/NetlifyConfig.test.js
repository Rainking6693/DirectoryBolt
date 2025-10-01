const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');
const { describe, it, expect } = require('@jest/globals');

/**
 * Netlify Configuration Tests
 * 
 * Validates netlify.toml and netlify.json (if exists) for:
 * - Valid TOML/JSON syntax
 * - Required build configuration
 * - Correct publish directory
 * - No malformed siteInfo or truncated strings
 */

describe('Netlify Configuration Validation', () => {
  const projectRoot = path.join(__dirname, '../..');
  const netlifyTomlPath = path.join(projectRoot, 'netlify.toml');
  const netlifyJsonPath = path.join(projectRoot, 'netlify.json');

  describe('netlify.toml validation', () => {
    it('should exist', () => {
      expect(fs.existsSync(netlifyTomlPath)).toBe(true);
    });

    it('should parse as valid TOML without errors', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      
      expect(() => {
        TOML.parse(content);
      }).not.toThrow();
    });

    it('should have [build] section', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      expect(config).toHaveProperty('build');
      expect(config.build).toBeDefined();
    });

    it('should have build.command matching package.json', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      // Check that build command exists
      expect(config.build).toHaveProperty('command');
      
      // Verify it uses npm run build
      expect(config.build.command).toContain('npm run build');
    });

    it('should have publish directory set to .next', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      expect(config.build).toHaveProperty('publish');
      expect(config.build.publish).toBe('.next');
    });

    it('should have [functions] section', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      expect(config).toHaveProperty('functions');
      expect(config.functions).toHaveProperty('directory');
    });

    it('should exclude worker directory from build', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      // Check if build.ignore exists
      if (config.build && config.build.ignore) {
        expect(config.build.ignore.files).toContain('worker/**');
      }
    });

    it('should have Node.js version specified', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      expect(config.build.environment).toHaveProperty('NODE_VERSION');
      expect(config.build.environment.NODE_VERSION).toBe('20.18.1');
    });

    it('should not have duplicate section headers', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      
      // Check for duplicate [build] sections
      const buildMatches = content.match(/^\[build\]/gm);
      expect(buildMatches?.length || 0).toBeLessThanOrEqual(1);
      
      // Check for duplicate [functions] sections
      const functionsMatches = content.match(/^\[functions\]/gm);
      expect(functionsMatches?.length || 0).toBeLessThanOrEqual(1);
    });

    it('should not contain JSON fragments', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      
      // Check for stray JSON that would cause parsing errors
      expect(content).not.toContain('"siteInfo"');
      expect(content).not.toContain('{"siteInfo"');
      expect(content).not.toContain('{\\n  \\"metadata\\"');
    });
  });

  describe('netlify.json validation (if exists)', () => {
    it('should parse as valid JSON if file exists', () => {
      if (!fs.existsSync(netlifyJsonPath)) {
        console.log('ℹ️  netlify.json not found - skipping JSON validation');
        expect(true).toBe(true);
        return;
      }

      const content = fs.readFileSync(netlifyJsonPath, 'utf8');
      
      expect(() => {
        JSON.parse(content);
      }).not.toThrow();
    });

    it('should not have truncated siteInfo.id if file exists', () => {
      if (!fs.existsSync(netlifyJsonPath)) {
        expect(true).toBe(true);
        return;
      }

      const content = fs.readFileSync(netlifyJsonPath, 'utf8');
      const config = JSON.parse(content);
      
      // If siteInfo exists, verify id is complete
      if (config.siteInfo && config.siteInfo.id) {
        expect(config.siteInfo.id).toMatch(/^[a-f0-9-]{36}$/); // Valid UUID format
        expect(config.siteInfo.id).not.toBe('d6821c31-a428-4b54-95e3-d92176e487e'); // Not truncated
      }
    });

    it('should not have trailing commas if file exists', () => {
      if (!fs.existsSync(netlifyJsonPath)) {
        expect(true).toBe(true);
        return;
      }

      const content = fs.readFileSync(netlifyJsonPath, 'utf8');
      
      // Check for common JSON errors
      expect(content).not.toMatch(/,\s*}/); // Trailing comma before }
      expect(content).not.toMatch(/,\s*]/); // Trailing comma before ]
    });
  });

  describe('Build configuration integrity', () => {
    it('should have matching build commands in netlify.toml and package.json', () => {
      const netlifyContent = fs.readFileSync(netlifyTomlPath, 'utf8');
      const netlifyConfig = TOML.parse(netlifyContent);
      
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );
      
      // netlify.toml should reference a script that exists in package.json
      const buildCommand = netlifyConfig.build.command;
      
      if (buildCommand.includes('npm run')) {
        const scriptName = buildCommand.split('npm run ')[1]?.split(' ')[0];
        if (scriptName) {
          expect(packageJson.scripts).toHaveProperty(scriptName);
        }
      }
    });

    it('should have .next directory as publish target', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      // For Next.js, publish should be .next
      expect(config.build.publish).toBe('.next');
    });

    it('should not have conflicting configuration files', () => {
      // Only one primary Netlify config should exist
      const tomlExists = fs.existsSync(netlifyTomlPath);
      const jsonExists = fs.existsSync(netlifyJsonPath);
      
      // Either netlify.toml OR netlify.json, not both (best practice)
      if (tomlExists && jsonExists) {
        console.warn('⚠️  Both netlify.toml and netlify.json exist - TOML takes precedence');
      }
      
      // At minimum, netlify.toml should exist
      expect(tomlExists).toBe(true);
    });
  });

  describe('Security and performance settings', () => {
    it('should have security headers configured', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      // Check for headers section (can be array of headers)
      expect(config.headers).toBeDefined();
      expect(Array.isArray(config.headers)).toBe(true);
      expect(config.headers.length).toBeGreaterThan(0);
    });

    it('should have environment variables for Node version', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      expect(config.build.environment).toBeDefined();
      expect(config.build.environment.NODE_VERSION).toBeDefined();
    });

    it('should skip Chromium download for Netlify', () => {
      const content = fs.readFileSync(netlifyTomlPath, 'utf8');
      const config = TOML.parse(content);
      
      // Should have PUPPETEER_SKIP_CHROMIUM_DOWNLOAD to prevent build issues
      expect(config.build.environment.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD).toBe('true');
    });
  });
});

