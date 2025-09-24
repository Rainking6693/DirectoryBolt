import Head from 'next/head'
import Link from 'next/link'
import { GetStaticProps } from 'next'
import Layout from '../../components/layout/Layout'
import { directoryBoltSchema } from '../../lib/seo/enhanced-schema'

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  publishDate: string
  readTime: string
  category: string
  author: string
  featured: boolean
}

interface BlogIndexProps {
  posts: BlogPost[]
  categories: string[]
}

export default function BlogIndex({ posts, categories }: BlogIndexProps) {
  const featuredPosts = posts.filter(post => post.featured)
  const regularPosts = posts.filter(post => !post.featured)

  return (
    <>
      <Head>
        <title>Directory Submission Blog | Expert SEO & Local Marketing Tips | DirectoryBolt</title>
        <meta 
          name="description" 
          content="Expert insights on directory submissions, local SEO, and business marketing. Learn how to boost your online visibility with proven strategies from DirectoryBolt." 
        />
        <meta name="keywords" content="directory submission blog, local SEO tips, business marketing, online visibility, directory marketing strategies" />
        <link rel="canonical" href="https://directorybolt.com/blog" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Directory Submission Blog | Expert SEO Tips" />
        <meta property="og:description" content="Expert insights on directory submissions, local SEO, and business marketing strategies." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://directorybolt.com/blog" />
        <meta property="og:image" content="https://directorybolt.com/images/blog-og-image.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Directory Submission Blog | Expert SEO Tips" />
        <meta name="twitter:description" content="Expert insights on directory submissions, local SEO, and business marketing strategies." />
        <meta name="twitter:image" content="https://directorybolt.com/images/blog-twitter-card.jpg" />
        
        {/* Blog Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "DirectoryBolt Blog",
              "description": "Expert insights on directory submissions, local SEO, and business marketing strategies",
              "url": "https://directorybolt.com/blog",
              "publisher": {
                "@type": "Organization",
                "name": "DirectoryBolt",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://directorybolt.com/images/logo.png"
                }
              },
              "blogPost": posts.map(post => ({
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.excerpt,
                "url": `https://directorybolt.com/blog/${post.slug}`,
                "datePublished": post.publishDate,
                "author": {
                  "@type": "Person",
                  "name": post.author
                }
              }))
            })
          }}
        />
        
        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://directorybolt.com/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Blog",
                  "item": "https://directorybolt.com/blog"
                }
              ]
            })
          }}
        />
      </Head>

      <Layout>
        <div className="min-h-screen bg-white">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Directory Submission
                  <span className="block bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
                    Expert Insights
                  </span>
                </h1>
                <p className="text-xl text-secondary-300 max-w-3xl mx-auto mb-8">
                  Master local SEO and directory marketing with expert tips, strategies, and insights from the DirectoryBolt team.
                </p>
                <div className="inline-flex items-center gap-4 bg-volt-500/10 backdrop-blur-sm border border-volt-500/20 rounded-lg px-6 py-3">
                  <span className="text-volt-400 font-semibold">{posts.length}</span>
                  <span className="text-secondary-300">Expert Articles</span>
                </div>
              </div>
            </div>
          </section>

          {/* Categories Filter */}
          <section className="py-8 bg-gray-50 border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap justify-center gap-4">
                <button className="px-4 py-2 bg-volt-500 text-secondary-900 rounded-lg font-semibold">
                  All Posts
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-volt-500 hover:text-secondary-900 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <section className="py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center mb-12">Featured Articles</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredPosts.map((post) => (
                    <article key={post.slug} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-volt-500 text-secondary-900 text-sm font-semibold rounded-full">
                            {post.category}
                          </span>
                          <span className="text-sm text-gray-500">{post.readTime}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3 hover:text-volt-600 transition-colors">
                          <Link href={`/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 mb-4">{post.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">By {post.author}</span>
                          <span className="text-sm text-gray-500">{new Date(post.publishDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Regular Posts */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">Latest Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map((post) => (
                  <article key={post.slug} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                          {post.category}
                        </span>
                        <span className="text-sm text-gray-500">{post.readTime}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-3 hover:text-volt-600 transition-colors">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">By {post.author}</span>
                        <span className="text-sm text-gray-500">{new Date(post.publishDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Newsletter Signup */}
          <section className="py-16 bg-volt-500">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-secondary-900 mb-6">
                Stay Updated with SEO Insights
              </h2>
              <p className="text-xl text-secondary-800 mb-8">
                Get weekly tips on directory submissions, local SEO, and business growth strategies.
              </p>
              <div className="max-w-md mx-auto flex gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-secondary-900"
                />
                <button className="bg-secondary-900 text-volt-400 px-6 py-3 rounded-lg font-bold hover:bg-secondary-800 transition-colors">
                  Subscribe
                </button>
              </div>
              <p className="text-sm text-secondary-700 mt-4">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </section>
        </div>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  // In a real implementation, this would fetch from a CMS or markdown files
  const posts: BlogPost[] = [
    {
      slug: 'complete-guide-business-directory-submissions-2024',
      title: 'Complete Guide to Business Directory Submissions in 2024',
      excerpt: 'Everything you need to know about submitting your business to directories for improved local SEO and visibility.',
      publishDate: '2024-12-07',
      readTime: '15 min read',
      category: 'Directory Submissions',
      author: 'DirectoryBolt Team',
      featured: true
    },
    {
      slug: 'google-business-profile-optimization-guide',
      title: 'Google Business Profile Optimization: Complete 2024 Guide',
      excerpt: 'Master Google Business Profile optimization with our comprehensive guide to boost local search rankings.',
      publishDate: '2024-12-05',
      readTime: '12 min read',
      category: 'Local SEO',
      author: 'Sarah Johnson',
      featured: true
    },
    {
      slug: 'yelp-business-optimization-strategies',
      title: 'Yelp for Business: Advanced Optimization Strategies',
      excerpt: 'Learn how to optimize your Yelp business profile for maximum visibility and customer engagement.',
      publishDate: '2024-12-03',
      readTime: '10 min read',
      category: 'Directory Submissions',
      author: 'Michael Chen',
      featured: false
    },
    {
      slug: 'local-seo-checklist-2024',
      title: 'Local SEO Checklist for 2024: 50+ Action Items',
      excerpt: 'Complete local SEO checklist with actionable items to improve your local search rankings.',
      publishDate: '2024-12-01',
      readTime: '8 min read',
      category: 'Local SEO',
      author: 'Lisa Rodriguez',
      featured: false
    },
    {
      slug: 'nap-consistency-guide',
      title: 'NAP Consistency: Why It Matters and How to Maintain It',
      excerpt: 'Learn why NAP consistency is crucial for local SEO and how to maintain it across all platforms.',
      publishDate: '2024-11-28',
      readTime: '7 min read',
      category: 'Local SEO',
      author: 'David Kim',
      featured: false
    },
    {
      slug: 'industry-specific-directory-submissions',
      title: 'Industry-Specific Directory Submissions: A Complete Guide',
      excerpt: 'Discover the best industry-specific directories for your business type and how to submit effectively.',
      publishDate: '2024-11-25',
      readTime: '11 min read',
      category: 'Directory Submissions',
      author: 'Emma Wilson',
      featured: false
    }
  ]

  const categories = [...new Set(posts.map(post => post.category))]

  return {
    props: {
      posts,
      categories
    },
    revalidate: 3600 // Revalidate every hour
  }
}