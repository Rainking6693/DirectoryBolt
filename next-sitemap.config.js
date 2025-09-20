module.exports = {
  siteUrl: 'https://directorybolt.com',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.8,
  sitemapSize: 7000,
  exclude: [
    '/api/*',
    '/static/admin/*',
    '/test-*',
    '/admin/*',
    '/dashboard/private/*',
    '/staff-dashboard*',
    '/emergency-diagnostics*'
  ],
  additionalPaths: async (config) => {
    const paths = []
    
    // Main service pages
    paths.push(await config.transform(config, '/directory-submission-service'))
    paths.push(await config.transform(config, '/local-seo-directories'))
    paths.push(await config.transform(config, '/business-directory-listings'))
    paths.push(await config.transform(config, '/ai-powered-directory-submissions'))
    paths.push(await config.transform(config, '/directory-submission-vs-manual'))
    paths.push(await config.transform(config, '/local-seo-directories-guide'))
    
    // City-specific pages
    const cities = [
      'new-york', 'los-angeles', 'chicago', 'houston', 'phoenix',
      'philadelphia', 'san-antonio', 'san-diego', 'dallas', 'san-jose',
      'austin', 'jacksonville', 'fort-worth', 'columbus', 'charlotte',
      'san-francisco', 'indianapolis', 'seattle', 'denver', 'washington-dc',
      'boston', 'el-paso', 'nashville', 'detroit', 'oklahoma-city',
      'portland', 'las-vegas', 'memphis', 'louisville', 'baltimore',
      'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento',
      'kansas-city', 'mesa', 'atlanta', 'omaha', 'colorado-springs',
      'raleigh', 'miami', 'virginia-beach', 'oakland', 'minneapolis'
    ]
    
    for (const city of cities) {
      paths.push(await config.transform(config, `/directory-submission-service/${city}`))
    }
    
    // Blog posts
    const blogPosts = [
      'complete-guide-business-directory-submissions-2024',
      'google-business-profile-optimization-guide',
      'yelp-business-optimization-strategies',
      'local-seo-checklist-2024',
      'nap-consistency-guide',
      'industry-specific-directory-submissions'
    ]
    
    for (const post of blogPosts) {
      paths.push(await config.transform(config, `/blog/${post}`))
    }
    
    return paths
  },
  transform: async (config, path) => {
    // High priority pages
    const highPriorityPages = [
      '/',
      '/pricing',
      '/analyze',
      '/directory-submission-service',
      '/directory-submission-vs-manual',
      '/local-seo-directories-guide'
    ]
    
    // Medium priority pages
    const mediumPriorityPages = [
      '/blog',
      '/guides',
      '/dashboard',
      '/onboarding'
    ]
    
    let priority = 0.5
    let changefreq = 'weekly'
    
    if (highPriorityPages.includes(path)) {
      priority = 1.0
      changefreq = 'daily'
    } else if (mediumPriorityPages.includes(path)) {
      priority = 0.8
      changefreq = 'weekly'
    } else if (path.startsWith('/blog/')) {
      priority = 0.7
      changefreq = 'monthly'
    } else if (path.startsWith('/directory-submission-service/')) {
      priority = 0.9
      changefreq = 'weekly'
    } else if (path.startsWith('/guides/')) {
      priority = 0.6
      changefreq = 'monthly'
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs: [
        {
          href: `https://directorybolt.com${path}`,
          hreflang: 'en-US'
        }
      ]
    }
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/private/',
          '/test-*',
          '/staff-dashboard*',
          '/emergency-diagnostics*',
          '/_next/',
          '/static/'
        ]
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1
      }
    ],
    additionalSitemaps: [
      'https://directorybolt.com/sitemap-blog.xml',
      'https://directorybolt.com/sitemap-cities.xml',
      'https://directorybolt.com/sitemap-guides.xml'
    ],
    host: 'https://directorybolt.com'
  }
}