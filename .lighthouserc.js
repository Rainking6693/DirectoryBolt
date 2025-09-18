module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/directory-selection-demo',
        'http://localhost:3000/pricing'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox',
        preset: 'desktop',
        // Add performance budget
        budgets: [
          {
            resourceSizes: [
              {
                resourceType: 'script',
                budget: 500
              },
              {
                resourceType: 'total',
                budget: 2000
              }
            ]
          }
        ]
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: '.lighthouseci'
    }
  }
};