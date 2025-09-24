import Head from 'next/head'
import Layout from '../components/layout/Layout'
import { useState } from 'react'

export default function AIBusinessIntelligenceCommunity() {
  const [selectedTab, setSelectedTab] = useState('overview')
  
  const communityStats = {
    members: '25,847',
    discussions: '12,456',
    insights: '8,923',
    experts: '1,247'
  }
  
  const tabs = {
    overview: {
      title: 'Community Overview',
      content: 'Global network of AI business intelligence professionals, executives, and thought leaders'
    },
    discussions: {
      title: 'Expert Discussions',
      content: 'Engage in strategic discussions with industry experts and thought leaders'
    },
    insights: {
      title: 'Shared Insights',
      content: 'Access exclusive insights and research from community members'
    },
    events: {
      title: 'Community Events',
      content: 'Participate in webinars, workshops, and networking events'
    }
  }

  return (
    <>
      <Head>
        <title>AI Business Intelligence Community | Global Network of Strategic Professionals</title>
        <meta name="description" content="Join the world's largest community of AI business intelligence professionals. Connect with experts, share insights, and advance your strategic intelligence capabilities." />
        <meta name="keywords" content="AI business intelligence community, strategic intelligence network, business intelligence professionals, AI consulting community, executive network" />
        <link rel="canonical" href="https://directorybolt.com/ai-business-intelligence-community" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-white">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-purple-50 to-blue-100 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                  AI Business Intelligence
                  <span className="block text-purple-600">Community</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
                  Join the <strong>world&apos;s largest community</strong> of AI business intelligence professionals. 
                  Connect with experts, share insights, and advance your strategic intelligence capabilities.
                </p>
                <div className="inline-flex items-center gap-4 bg-blue-100 border border-blue-300 rounded-lg px-6 py-3 mb-8">
                  <span className="text-blue-600 text-2xl">👥</span>
                  <span className="text-blue-800 font-semibold">25,000+ Members • Expert Network • Global Community</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors">
                    Join Community (Free)
                  </button>
                  <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-colors">
                    Explore Community
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Community Stats */}
          <section className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                {[
                  {
                    metric: communityStats.members,
                    label: 'Active Members',
                    description: 'Professionals from Fortune 500 companies'
                  },
                  {
                    metric: communityStats.discussions,
                    label: 'Expert Discussions',
                    description: 'Strategic conversations and insights'
                  },
                  {
                    metric: communityStats.insights,
                    label: 'Shared Insights',
                    description: 'Exclusive research and analysis'
                  },
                  {
                    metric: communityStats.experts,
                    label: 'Industry Experts',
                    description: 'Thought leaders and consultants'
                  }
                ].map((stat, index) => (
                  <div key={index} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{stat.metric}</div>
                    <div className="text-lg font-semibold text-gray-900 mb-2">{stat.label}</div>
                    <div className="text-sm text-gray-600">{stat.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Community Features */}
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Community Features & Benefits
                </h2>
                <p className="text-xl text-gray-600">
                  Everything you need to advance your AI business intelligence expertise
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                {/* Tab Navigation */}
                <div className="mb-8">
                  <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(tabs).map(([key, tab]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTab(key)}
                        className={`p-4 rounded-lg border-2 text-center transition-colors ${
                          selectedTab === key
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold">{tab.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Tab Content */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{tabs[selectedTab as keyof typeof tabs].title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">{tabs[selectedTab as keyof typeof tabs].content}</p>
                    
                    {selectedTab === 'overview' && (
                      <div className="space-y-4">
                        <h4 className="text-xl font-bold text-gray-900">Community Benefits</h4>
                        <ul className="space-y-3">
                          {[
                            'Connect with 25,000+ AI business intelligence professionals',
                            'Access exclusive research and industry insights',
                            'Participate in expert-led discussions and forums',
                            'Attend virtual events and networking sessions',
                            'Get career advancement opportunities and mentorship',
                            'Share your expertise and build thought leadership'
                          ].map((benefit, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-purple-500 mr-3 mt-1">✅</span>
                              <span className="text-gray-700">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-4">Featured Community Members</h4>
                      <div className="space-y-4">
                        {[
                          {
                            name: 'Sarah Chen',
                            title: 'Former McKinsey Partner',
                            company: 'AI Strategy Consulting',
                            contribution: 'Leading AI transformation discussions'
                          },
                          {
                            name: 'Michael Rodriguez',
                            title: 'VP of Business Intelligence',
                            company: 'Fortune 500 Technology',
                            contribution: 'Sharing enterprise AI implementation insights'
                          },
                          {
                            name: 'Emily Watson',
                            title: 'AI Research Director',
                            company: 'Leading University',
                            contribution: 'Contributing academic research and findings'
                          }
                        ].map((member, index) => (
                          <div key={index} className="bg-white rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-purple-600 font-bold">{member.name.split(' ').map(n => n[0]).join('')}</span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-600">{member.title}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">{member.company}</div>
                            <div className="text-sm text-purple-600">{member.contribution}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Join the AI Business Intelligence Revolution
              </h2>
              <p className="text-xl text-purple-100 mb-8">
                Connect with 25,000+ professionals shaping the future of strategic intelligence
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
                  Join Community (Free)
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors">
                  Explore Premium Features
                </button>
              </div>
              <p className="mt-6 text-purple-200">
                Free to join • Expert network • Career advancement • Thought leadership opportunities
              </p>
            </div>
          </section>
        </div>
      </Layout>
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {
      lastModified: new Date().toISOString(),
    },
    revalidate: 3600,
  }
}