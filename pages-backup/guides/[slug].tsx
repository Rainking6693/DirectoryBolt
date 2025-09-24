import { GetStaticProps, GetStaticPaths } from 'next'
import { ParsedUrlQuery } from 'querystring'
import Layout from '../../components/layout/Layout'
import DirectoryGuideTemplate from '../../components/guides/DirectoryGuideTemplate'
import { DirectoryGuideData, GuideContentManager } from '../../lib/guides/contentManager'
import { generateSitemap } from '../../lib/seo/sitemapGenerator'
import { getRelatedGuides } from '../../lib/guides/relatedGuides'

interface GuidePageProps {
  guide: DirectoryGuideData
  relatedGuides: DirectoryGuideData[]
}

interface Params extends ParsedUrlQuery {
  slug: string
}

export default function GuidePage({ guide, relatedGuides }: GuidePageProps) {
  if (!guide) {
    return (
      <Layout title="Guide Not Found" description="The requested guide could not be found.">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Guide Not Found</h1>
            <p className="text-secondary-300">The requested guide could not be found.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      title={guide.seo.title}
      description={guide.seo.description}
      showBackButton={true}
      backButtonUrl="/guides"
      backButtonText="Back to Guides"
    >
      <DirectoryGuideTemplate guide={guide} relatedGuides={relatedGuides} />
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const contentManager = new GuideContentManager()
  const guides = await contentManager.getAllGuides()
  
  const paths = guides.map((guide) => ({
    params: { slug: guide.slug }
  }))

  return {
    paths,
    fallback: 'blocking' // Enable ISR for new guides
  }
}

export const getStaticProps: GetStaticProps<GuidePageProps, Params> = async ({ params }) => {
  if (!params?.slug) {
    return { notFound: true }
  }

  const contentManager = new GuideContentManager()
  
  try {
    const guide = await contentManager.getGuideBySlug(params.slug)
    
    if (!guide) {
      return { notFound: true }
    }

    const relatedGuides = await getRelatedGuides(guide, 3)

    return {
      props: {
        guide,
        relatedGuides
      },
      revalidate: 3600 // Revalidate every hour for content updates
    }
  } catch (error) {
    console.error(`Error loading guide ${params.slug}:`, error)
    return { notFound: true }
  }
}