#!/usr/bin/env node

/**
 * Custom MCP Server for Playwright Browser Automation
 *
 * This MCP server exposes Playwright capabilities to Claude Code agents,
 * enabling them to perform browser automation tasks for selector discovery.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { chromium } = require('playwright');

class PlaywrightMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'playwright-automation',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.browser = null;
    this.activePage = null;

    this.setupToolHandlers();
    this.setupErrorHandlers();
  }

  setupToolHandlers() {
    // Tool: Launch Browser
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'playwright_launch_browser',
            description: 'Launch a Chromium browser instance',
            inputSchema: {
              type: 'object',
              properties: {
                headless: {
                  type: 'boolean',
                  description: 'Run browser in headless mode',
                  default: true
                }
              }
            }
          },
          {
            name: 'playwright_navigate',
            description: 'Navigate to a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to navigate to'
                },
                waitUntil: {
                  type: 'string',
                  enum: ['load', 'domcontentloaded', 'networkidle'],
                  default: 'domcontentloaded'
                }
              },
              required: ['url']
            }
          },
          {
            name: 'playwright_discover_fields',
            description: 'Discover all form fields on the current page',
            inputSchema: {
              type: 'object',
              properties: {
                includeHidden: {
                  type: 'boolean',
                  description: 'Include hidden form fields',
                  default: false
                }
              }
            }
          },
          {
            name: 'playwright_validate_selector',
            description: 'Validate that a selector works on the current page',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector to validate'
                }
              },
              required: ['selector']
            }
          },
          {
            name: 'playwright_screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                fullPage: {
                  type: 'boolean',
                  description: 'Capture full page',
                  default: false
                },
                path: {
                  type: 'string',
                  description: 'Path to save screenshot'
                }
              }
            }
          },
          {
            name: 'playwright_close_browser',
            description: 'Close the browser instance',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // Tool execution handler
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'playwright_launch_browser':
            return await this.launchBrowser(args);

          case 'playwright_navigate':
            return await this.navigate(args);

          case 'playwright_discover_fields':
            return await this.discoverFields(args);

          case 'playwright_validate_selector':
            return await this.validateSelector(args);

          case 'playwright_screenshot':
            return await this.takeScreenshot(args);

          case 'playwright_close_browser':
            return await this.closeBrowser();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async launchBrowser(args) {
    if (this.browser) {
      await this.browser.close();
    }

    this.browser = await chromium.launch({
      headless: args.headless !== false
    });

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    this.activePage = await context.newPage();

    return {
      content: [
        {
          type: 'text',
          text: 'Browser launched successfully'
        }
      ]
    };
  }

  async navigate(args) {
    if (!this.activePage) {
      throw new Error('No active page. Call playwright_launch_browser first.');
    }

    await this.activePage.goto(args.url, {
      waitUntil: args.waitUntil || 'domcontentloaded',
      timeout: 30000
    });

    // Wait a bit for dynamic content
    await this.activePage.waitForTimeout(2000);

    return {
      content: [
        {
          type: 'text',
          text: `Navigated to ${args.url}`
        }
      ]
    };
  }

  async discoverFields(args) {
    if (!this.activePage) {
      throw new Error('No active page. Call playwright_launch_browser first.');
    }

    const fields = await this.activePage.evaluate((includeHidden) => {
      const discovered = [];

      const selector = includeHidden
        ? 'input, textarea, select'
        : 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select';

      const elements = document.querySelectorAll(selector);

      const getLabel = (element) => {
        if (element.id) {
          const label = document.querySelector(`label[for="${element.id}"]`);
          if (label) return label.textContent.trim();
        }
        const parentLabel = element.closest('label');
        if (parentLabel) return parentLabel.textContent.trim();
        const prevLabel = element.previousElementSibling;
        if (prevLabel && prevLabel.tagName === 'LABEL') {
          return prevLabel.textContent.trim();
        }
        return null;
      };

      elements.forEach((element, index) => {
        discovered.push({
          type: element.tagName.toLowerCase(),
          inputType: element.type || 'text',
          id: element.id || null,
          name: element.name || null,
          placeholder: element.placeholder || null,
          label: getLabel(element),
          className: element.className || null,
          required: element.required || false,
          visible: element.offsetParent !== null,
          index
        });
      });

      return discovered;
    }, args.includeHidden || false);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(fields, null, 2)
        }
      ]
    };
  }

  async validateSelector(args) {
    if (!this.activePage) {
      throw new Error('No active page. Call playwright_launch_browser first.');
    }

    try {
      const element = await this.activePage.$(args.selector);

      if (!element) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                valid: false,
                reason: 'Selector not found'
              }, null, 2)
            }
          ]
        };
      }

      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              valid: true,
              visible: isVisible,
              enabled: isEnabled,
              selector: args.selector
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              valid: false,
              reason: error.message
            }, null, 2)
          }
        ]
      };
    }
  }

  async takeScreenshot(args) {
    if (!this.activePage) {
      throw new Error('No active page. Call playwright_launch_browser first.');
    }

    const screenshot = await this.activePage.screenshot({
      fullPage: args.fullPage || false,
      path: args.path
    });

    return {
      content: [
        {
          type: 'text',
          text: args.path
            ? `Screenshot saved to ${args.path}`
            : 'Screenshot captured (base64 data available)'
        }
      ]
    };
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.activePage = null;

      return {
        content: [
          {
            type: 'text',
            text: 'Browser closed successfully'
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'No browser to close'
        }
      ]
    };
  }

  setupErrorHandlers() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      if (this.browser) {
        await this.browser.close();
      }
      process.exit(0);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright MCP server running on stdio');
  }
}

// Start the server
const server = new PlaywrightMCPServer();
server.start().catch(console.error);
