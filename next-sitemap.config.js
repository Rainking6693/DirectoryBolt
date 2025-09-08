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
    '/dashboard/private/*'
  ],
  additionalPaths: async (config) => [
    await config.transform(config, '/directory-submission-service'),
    await config.transform(config, '/local-seo-directories'),
    await config.transform(config, '/business-directory-listings'),
    await config.transform(config, '/google-business-profile-optimization'),
    await config.transform(config, '/how-to-submit-business-directories'),
    await config.transform(config, '/directory-submission-pricing'),
    await config.transform(config, '/ai-powered-directory-submissions')
  ],
  transform: async (config, path) => {
    // High priority pages
    const highPriorityPages = [
      '/',
      '/pricing',
      '/directory-submission-service',
      '/how-it-works'
    ]
    
    // Medium priority pages
    const mediumPriorityPages = [
      '/about',
      '/contact',
      '/faq',
      '/blog'
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
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    }
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/private/', '/test-*']
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1
      }
    ],
    additionalSitemaps: [
      'https://directorybolt.com/sitemap-blog.xml',
      'https://directorybolt.com/sitemap-directories.xml'
    ]
  }
}