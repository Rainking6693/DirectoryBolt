import { GetStaticProps } from 'next'
import Layout from '../../components/layout/Layout'
import GuidesList from '../../components/guides/GuidesList'
import { DirectoryGuideData, GuideContentManager } from '../../lib/guides/contentManager'

interface GuidesPageProps {
  guides: DirectoryGuideData[]
  categories: string[]
}

export default function GuidesPage({ guides, categories }: GuidesPageProps) {
  return (
    <Layout 
      title="Directory Submission Guides | DirectoryBolt"
      description="Comprehensive guides on how to submit to top business directories. Learn best practices, tips, and strategies to maximize your directory presence."
    >
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Directory Submission
                <span className="block bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
                  Ultimate Guides
                </span>
              </h1>
              <p className="text-xl text-secondary-300 max-w-3xl mx-auto mb-8">
                Master directory submissions with our comprehensive guides. Learn how to maximize your online presence across 500+ premium directories.
              </p>
              <div className="inline-flex items-center gap-4 bg-volt-500/10 backdrop-blur-sm border border-volt-500/20 rounded-lg px-6 py-3">
                <span className="text-volt-400 font-semibold">{guides.length}</span>
                <span className="text-secondary-300">Expert Guides Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guides List */}
        <GuidesList guides={guides} categories={categories} />
      </div>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps<GuidesPageProps> = async () => {
  const contentManager = new GuideContentManager()
  
  try {
    const guides = await contentManager.getAllGuides()
    const categories = await contentManager.getCategories()

    return {
      props: {
        guides,
        categories
      },
      revalidate: 3600 // Revalidate every hour
    }
  } catch (error) {
    console.error('Error loading guides:', error)
    return {
      props: {
        guides: [],
        categories: []
      },
      revalidate: 3600
    }
  }
}