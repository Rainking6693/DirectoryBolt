const { GuideContentManager } = require('../lib/guides/contentManager')
const { generateSitemap } = require('../lib/seo/sitemapGenerator')
const { updateAllInternalLinks } = require('../lib/guides/relatedGuides')
const { PerformanceOptimizer } = require('../lib/performance/optimization')

async function buildGuidesSystem() {
  console.log('🚀 Building Directory Guides System...\n')

  try {
    // Initialize managers
    const contentManager = new GuideContentManager()
    const performanceOptimizer = new PerformanceOptimizer()

    // Step 1: Load and validate all guides
    console.log('📚 Loading guides...')
    const guides = await contentManager.getAllGuides()
    console.log(`✅ Loaded ${guides.length} guides`)

    if (guides.length === 0) {
      console.log('⚠️  No guides found. Creating sample guides...')
      await createSampleGuides(contentManager)
      const updatedGuides = await contentManager.getAllGuides()
      console.log(`✅ Created ${updatedGuides.length} sample guides`)
    }

    // Step 2: Update internal links
    console.log('\n🔗 Updating internal links...')
    await updateAllInternalLinks()
    console.log('✅ Internal links updated')

    // Step 3: Generate sitemap
    console.log('\n🗺️  Generating sitemap...')
    await generateSitemap()
    console.log('✅ Sitemap generated')

    // Step 4: Performance analysis
    console.log('\n⚡ Analyzing performance...')
    const performanceReport = performanceOptimizer.analyzeBundleSize(guides)
    console.log('📊 Performance Report:')
    console.log(`   Total guides: ${performanceReport.totalGuides}`)
    console.log(`   Average content size: ${performanceReport.averageContentSize} bytes`)
    console.log(`   Largest guides:`)
    performanceReport.largestGuides.forEach((guide, index) => {
      console.log(`     ${index + 1}. ${guide.slug}: ${guide.size} bytes`)
    })
    
    if (performanceReport.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      performanceReport.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`)
      })
    }

    // Step 5: Generate SEO report
    console.log('\n🎯 Generating SEO report...')
    const seoReport = await contentManager.generateSEOReport()
    console.log('📈 SEO Report:')
    console.log(`   Total guides: ${seoReport.totalGuides}`)
    console.log(`   Average read time: ${seoReport.averageReadTime}`)
    console.log(`   Categories:`)
    Object.entries(seoReport.categoryCounts).forEach(([category, count]) => {
      console.log(`     - ${category}: ${count} guides`)
    })
    console.log(`   Top keywords:`)
    seoReport.topKeywords.slice(0, 10).forEach((keyword, index) => {
      console.log(`     ${index + 1}. ${keyword.keyword} (${keyword.count} uses)`)
    })

    console.log('\n🎉 Directory Guides System build completed successfully!')
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

async function createSampleGuides(contentManager) {
  const sampleGuides = [
    {
      slug: 'local-seo-optimization',
      title: 'Local SEO Optimization: Complete 2024 Guide',
      description: 'Master local SEO with our comprehensive guide covering Google My Business, local citations, and ranking strategies.',
      directoryName: 'Various Local Directories',
      category: 'Local Search',
      difficulty: 'intermediate',
      estimatedReadTime: '15 min read',
      featuredImage: 'https://directorybolt.com/images/guides/local-seo-hero.jpg',
      seo: {
        title: 'Local SEO Guide 2024 | Rank Higher in Local Search Results',
        description: 'Complete local SEO guide with proven strategies to dominate local search results. Updated for 2024.',
        keywords: ['local seo', 'local search optimization', 'google my business', 'local citations', 'local ranking factors']
      },
      content: {
        requirements: ['Business with physical location', 'Google account', 'Website with local content'],
        tools: ['Google My Business', 'Google Search Console', 'Local citation tools'],
        sections: [
          {
            id: 'introduction',
            title: 'Understanding Local SEO',
            content: '<p>Local SEO is the practice of optimizing your online presence to attract more business from relevant local searches.</p>'
          },
          {
            id: 'google-my-business',
            title: 'Optimizing Google My Business',
            content: '<p>Your Google My Business profile is the foundation of local SEO success.</p>'
          }
        ]
      },
      internalLinks: { relatedGuides: [], relatedDirectories: [] }
    },
    {
      slug: 'online-reputation-management',
      title: 'Online Reputation Management for Small Businesses',
      description: 'Protect and improve your online reputation with proven strategies for managing reviews and customer feedback.',
      directoryName: 'Review Platforms',
      category: 'Reputation Management',
      difficulty: 'beginner',
      estimatedReadTime: '10 min read',
      featuredImage: 'https://directorybolt.com/images/guides/reputation-management-hero.jpg',
      seo: {
        title: 'Online Reputation Management Guide | Protect Your Business Reputation',
        description: 'Learn how to manage your online reputation effectively with strategies for review management and crisis response.',
        keywords: ['online reputation management', 'review management', 'business reputation', 'customer reviews', 'reputation monitoring']
      },
      content: {
        requirements: ['Online business presence', 'Review monitoring tools', 'Customer service processes'],
        tools: ['Google Alerts', 'Review management platforms', 'Social media monitoring'],
        sections: [
          {
            id: 'reputation-basics',
            title: 'Reputation Management Basics',
            content: '<p>Online reputation management involves monitoring and influencing your businesss online reputation.</p>'
          },
          {
            id: 'review-strategies',
            title: 'Review Management Strategies',
            content: '<p>Develop systems for encouraging positive reviews and responding to negative feedback.</p>'
          }
        ]
      },
      internalLinks: { relatedGuides: [], relatedDirectories: [] }
    }
  ]

  for (const guide of sampleGuides) {
    await contentManager.createGuide(guide)
  }
}

// Run if called directly
if (require.main === module) {
  buildGuidesSystem().catch(console.error)
}

module.exports = { buildGuidesSystem }