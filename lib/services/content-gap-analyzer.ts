// 🔍 CONTENT GAP ANALYZER SERVICE
// Advanced content gap analysis using AI to identify competitor content opportunities

import OpenAI from 'openai'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from '../utils/logger'
import type { 
  CompetitorContent, 
  ContentGap, 
  BlogPostIdea, 
  FAQSuggestion, 
  KeywordCluster,
  ContentPage
} from '../../pages/api/ai/content-gap-analysis'

interface ContentGapAnalysisOptions {
  userTier: 'professional' | 'enterprise'
  analysisDepth: 'standard' | 'comprehensive'
  includeKeywordClusters: boolean
  includeBlogIdeas: boolean
  includeFAQs: boolean
}

interface ContentGapAnalysisResult {
  competitors: CompetitorContent[]
  contentGaps: ContentGap[]
  blogPostIdeas: BlogPostIdea[]
  faqSuggestions: FAQSuggestion[]
  keywordClusters: KeywordCluster[]
  confidence: number
}

interface WebsiteContent {
  domain: string
  title: string
  description: string
  content: string
  headings: string[]
  keywords: string[]
  pages: ContentPage[]
  industry: string
  businessType: string
}

export class ContentGapAnalyzer {
  private openai: OpenAI | null = null
  private isInitialized = false

  constructor() {
    this.initializeOpenAI()
  }

  private initializeOpenAI(): void {
    try {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        logger.warn('OpenAI API key not found - Content Gap Analysis will be limited')
        return
      }

      this.openai = new OpenAI({
        apiKey: apiKey,
        timeout: 60000,
      })
      
      this.isInitialized = true
      logger.info('Content Gap Analyzer initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize OpenAI for Content Gap Analysis', {}, error as Error)
    }
  }

  async analyzeContentGaps(
    targetWebsite: string, 
    options: ContentGapAnalysisOptions
  ): Promise<ContentGapAnalysisResult> {
    if (!this.isInitialized || !this.openai) {
      throw new Error('Content Gap Analyzer not properly initialized')
    }

    try {
      // Step 1: Analyze target website
      const targetContent = await this.scrapeWebsiteContent(targetWebsite)
      
      // Step 2: Identify and analyze competitors
      const competitors = await this.identifyAndAnalyzeCompetitors(targetContent, options)
      
      // Step 3: Identify content gaps
      const contentGaps = await this.identifyContentGaps(targetContent, competitors, options)
      
      // Step 4: Generate analysis results
      const blogPostIdeas = options.includeBlogIdeas 
        ? await this.generateBlogPostIdeas(targetContent, contentGaps, options)
        : []
      
      const faqSuggestions = options.includeFAQs
        ? await this.generateFAQSuggestions(targetContent, competitors, options)
        : []
      
      const keywordClusters = options.includeKeywordClusters
        ? await this.generateKeywordClusters(targetContent, contentGaps, options)
        : []

      const confidence = this.calculateConfidenceScore(targetContent, competitors, contentGaps)

      return {
        competitors,
        contentGaps,
        blogPostIdeas,
        faqSuggestions,
        keywordClusters,
        confidence
      }

    } catch (error) {
      logger.error('Content Gap Analysis failed', { targetWebsite }, error as Error)
      throw error
    }
  }

  private async scrapeWebsiteContent(url: string): Promise<WebsiteContent> {
    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
      
      const response = await axios.get(normalizedUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      })

      const $ = cheerio.load(response.data)
      
      const title = $('title').text().trim()
      const description = $('meta[name="description"]').attr('content') || ''
      
      const headings: string[] = []
      $('h1, h2, h3, h4, h5, h6').each((_, element) => {
        const heading = $(element).text().trim()
        if (heading) headings.push(heading)
      })

      const content = $('main, article, .content')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim() || $('body').text().replace(/\s+/g, ' ').trim()

      const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || []
      const domain = new URL(normalizedUrl).hostname

      // Discover key pages
      const pages = await this.discoverWebsitePages(normalizedUrl, response.data)

      // Classify website
      const { industry, businessType } = await this.classifyWebsite(title, description, content)

      return {
        domain,
        title,
        description,
        content: content.substring(0, 5000),
        headings,
        keywords,
        pages,
        industry,
        businessType
      }

    } catch (error) {
      logger.error('Failed to scrape website content', { url }, error as Error)
      throw new Error(`Unable to analyze website: ${url}`)
    }
  }

  private async discoverWebsitePages(baseUrl: string, html: string): Promise<ContentPage[]> {
    const pages: ContentPage[] = []
    const domain = new URL(baseUrl).hostname
    const links = new Set<string>()
    const $ = cheerio.load(html)

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (href && this.isRelevantContentPage(href) && href.includes(domain)) {
        links.add(href.startsWith('http') ? href : new URL(href, baseUrl).href)
      }
    })

    // Analyze top 5 pages for performance
    const pagesToAnalyze = Array.from(links).slice(0, 5)

    for (const pageUrl of pagesToAnalyze) {
      try {
        const pageContent = await this.analyzeContentPage(pageUrl)
        if (pageContent) pages.push(pageContent)
      } catch (error) {
        // Continue with other pages
      }
    }

    return pages
  }

  private isRelevantContentPage(url: string): boolean {
    const path = url.toLowerCase()
    const includePatterns = ['/blog/', '/articles/', '/guides/', '/services/', '/products/']
    const excludePatterns = ['/contact', '/privacy', '/terms', '.pdf', '.jpg', '.png']

    return includePatterns.some(p => path.includes(p)) && 
           !excludePatterns.some(p => path.includes(p))
  }

  private async analyzeContentPage(url: string): Promise<ContentPage | null> {
    try {
      const response = await axios.get(url, { timeout: 15000 })
      const $ = cheerio.load(response.data)
      const title = $('title').text().trim()
      const content = $('main, article').first().text().replace(/\s+/g, ' ').trim()
      const wordCount = content.split(' ').length

      const analysis = await this.analyzePageContent(title, content)

      return {
        title,
        url,
        wordCount,
        keywordFocus: analysis.keywords,
        estimatedTraffic: analysis.estimatedTraffic,
        contentType: analysis.contentType
      }
    } catch (error) {
      return null
    }
  }

  private async analyzePageContent(title: string, content: string): Promise<{
    keywords: string[]
    estimatedTraffic: number
    contentType: 'blog' | 'landing' | 'product' | 'guide' | 'case-study'
  }> {
    if (!this.openai) {
      return { keywords: [], estimatedTraffic: 0, contentType: 'blog' }
    }

    try {
      const prompt = `Analyze this content and return JSON:
Title: ${title}
Content: ${content.substring(0, 500)}

{
  "keywords": ["keyword1", "keyword2"],
  "estimatedTraffic": 1500,
  "contentType": "blog"
}`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are an SEO analyst. Return only valid JSON."
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 300
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        try {
          return JSON.parse(response)
        } catch {
          return { keywords: [], estimatedTraffic: 100, contentType: 'blog' }
        }
      }
    } catch (error) {
      logger.warn('Failed to analyze page content', { title })
    }

    return { keywords: [], estimatedTraffic: 100, contentType: 'blog' }
  }

  private async classifyWebsite(title: string, description: string, content: string): Promise<{
    industry: string
    businessType: string
  }> {
    if (!this.openai) {
      return { industry: 'Technology', businessType: 'Service Provider' }
    }

    try {
      const prompt = `Classify this website:
Title: ${title}
Description: ${description}

Return JSON: {"industry": "Technology", "businessType": "SaaS"}`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.2,
        max_tokens: 100
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        try {
          return JSON.parse(response)
        } catch {
          return { industry: 'Technology', businessType: 'Service Provider' }
        }
      }
    } catch (error) {
      logger.warn('Failed to classify website', { title })
    }

    return { industry: 'Technology', businessType: 'Service Provider' }
  }

  private async identifyAndAnalyzeCompetitors(
    targetContent: WebsiteContent, 
    options: ContentGapAnalysisOptions
  ): Promise<CompetitorContent[]> {
    if (!this.openai) {
      throw new Error('OpenAI not available for competitor analysis')
    }

    try {
      const competitorDomains = await this.identifyCompetitors(targetContent)
      const competitors: CompetitorContent[] = []
      const maxCompetitors = options.userTier === 'enterprise' ? 5 : 3

      for (const domain of competitorDomains.slice(0, maxCompetitors)) {
        try {
          const competitorContent = await this.analyzeCompetitorContent(domain)
          if (competitorContent) competitors.push(competitorContent)
        } catch (error) {
          // Continue with other competitors
        }
      }

      return competitors
    } catch (error) {
      logger.error('Failed to analyze competitors', { targetDomain: targetContent.domain })
      throw error
    }
  }

  private async identifyCompetitors(targetContent: WebsiteContent): Promise<string[]> {
    if (!this.openai) return []

    try {
      const prompt = `Find 5 competitor domains for:
Business: ${targetContent.title}
Industry: ${targetContent.industry}
Type: ${targetContent.businessType}

Return only domain names, one per line.`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 200
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        return response
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && line.includes('.') && !line.includes(targetContent.domain))
          .slice(0, 5)
      }

      return []
    } catch (error) {
      return []
    }
  }

  private async analyzeCompetitorContent(domain: string): Promise<CompetitorContent | null> {
    try {
      const competitorData = await this.scrapeWebsiteContent(`https://${domain}`)
      const analysis = await this.analyzeCompetitorStrengths(competitorData)

      return {
        domain,
        name: competitorData.title || domain,
        topPages: competitorData.pages.slice(0, 3),
        contentThemes: analysis.contentThemes,
        averageWordCount: this.calculateAverageWordCount(competitorData.pages),
        publishingFrequency: analysis.publishingFrequency,
        strongestTopics: analysis.strongestTopics
      }
    } catch (error) {
      return null
    }
  }

  private async analyzeCompetitorStrengths(competitorData: WebsiteContent): Promise<{
    contentThemes: string[]
    publishingFrequency: string
    strongestTopics: string[]
  }> {
    if (!this.openai) {
      return {
        contentThemes: ['General Business Content'],
        publishingFrequency: 'Monthly',
        strongestTopics: ['Industry Insights']
      }
    }

    try {
      const contentSample = competitorData.headings.join('. ')

      const prompt = `Analyze competitor content strategy:
Content: ${contentSample}

Return JSON:
{
  "contentThemes": ["Theme1", "Theme2"],
  "publishingFrequency": "Weekly", 
  "strongestTopics": ["Topic1", "Topic2"]
}`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        try {
          return JSON.parse(response)
        } catch {
          return {
            contentThemes: ['General Content'],
            publishingFrequency: 'Monthly',
            strongestTopics: ['Industry Content']
          }
        }
      }
    } catch (error) {
      // Return fallback
    }

    return {
      contentThemes: ['General Content'],
      publishingFrequency: 'Monthly', 
      strongestTopics: ['Industry Content']
    }
  }

  private calculateAverageWordCount(pages: ContentPage[]): number {
    if (pages.length === 0) return 0
    const totalWords = pages.reduce((sum, page) => sum + page.wordCount, 0)
    return Math.round(totalWords / pages.length)
  }

  private async identifyContentGaps(
    targetContent: WebsiteContent,
    competitors: CompetitorContent[],
    options: ContentGapAnalysisOptions
  ): Promise<ContentGap[]> {
    if (!this.openai || competitors.length === 0) return []

    try {
      const competitorTopics = competitors.flatMap(comp => [
        ...comp.contentThemes,
        ...comp.strongestTopics
      ])

      const targetTopics = [...targetContent.headings, ...targetContent.keywords]

      const prompt = `Find content gaps:

TARGET: ${targetContent.industry} business
Current topics: ${targetTopics.join(', ')}
Competitor topics: ${competitorTopics.join(', ')}

Return JSON with 5 content gaps:
{
  "contentGaps": [{
    "topic": "Topic Name",
    "opportunity": "Description", 
    "priority": "high",
    "competitorCoverage": 80,
    "estimatedDifficulty": 60,
    "potentialTraffic": 1500,
    "reasoning": "Why this is good"
  }]
}`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 800
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        try {
          const parsed = JSON.parse(response)
          return parsed.contentGaps || []
        } catch {
          return []
        }
      }

      return []
    } catch (error) {
      return []
    }
  }

  private async generateBlogPostIdeas(
    targetContent: WebsiteContent,
    contentGaps: ContentGap[],
    options: ContentGapAnalysisOptions
  ): Promise<BlogPostIdea[]> {
    if (!this.openai || contentGaps.length === 0) return []

    try {
      const highPriorityGaps = contentGaps.filter(gap => gap.priority === 'high').slice(0, 3)
      
      const prompt = `Generate blog post ideas:

Business: ${targetContent.industry} ${targetContent.businessType}
Content gaps: ${highPriorityGaps.map(gap => gap.topic).join(', ')}

Return JSON with 5 blog ideas:
{
  "blogPostIdeas": [{
    "title": "Specific blog title",
    "description": "Detailed description", 
    "targetKeywords": ["keyword1", "keyword2"],
    "estimatedWordCount": 2500,
    "contentType": "how-to",
    "priority": "high",
    "seoOpportunity": 85
  }]
}`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 1000
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        try {
          const parsed = JSON.parse(response)
          return parsed.blogPostIdeas || []
        } catch {
          return []
        }
      }

      return []
    } catch (error) {
      return []
    }
  }

  private async generateFAQSuggestions(
    targetContent: WebsiteContent,
    competitors: CompetitorContent[],
    options: ContentGapAnalysisOptions
  ): Promise<FAQSuggestion[]> {
    if (!this.openai) return []

    try {
      const prompt = `Generate FAQ suggestions for ${targetContent.industry} business:

Business: ${targetContent.description}

Return JSON with 8 FAQs:
{
  "faqSuggestions": [{
    "question": "Question text?",
    "category": "Category", 
    "searchVolume": 1200,
    "difficulty": 60,
    "reasoning": "Why customers ask this"
  }]
}`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 800
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        try {
          const parsed = JSON.parse(response)
          return parsed.faqSuggestions || []
        } catch {
          return []
        }
      }

      return []
    } catch (error) {
      return []
    }
  }

  private async generateKeywordClusters(
    targetContent: WebsiteContent,
    contentGaps: ContentGap[],
    options: ContentGapAnalysisOptions
  ): Promise<KeywordCluster[]> {
    if (!this.openai) return []

    try {
      const gapTopics = contentGaps.map(gap => gap.topic).join(', ')
      
      const prompt = `Generate keyword clusters:

Business: ${targetContent.industry} ${targetContent.businessType}
Topics: ${gapTopics}

Return JSON with 4 clusters:
{
  "keywordClusters": [{
    "clusterName": "Cluster Name",
    "primaryKeyword": "main keyword",
    "relatedKeywords": ["keyword1", "keyword2"],
    "searchVolume": 2400,
    "competitionLevel": "medium",
    "contentOpportunities": ["How-to guides", "Comparisons"]
  }]
}`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 600
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        try {
          const parsed = JSON.parse(response)
          return parsed.keywordClusters || []
        } catch {
          return []
        }
      }

      return []
    } catch (error) {
      return []
    }
  }

  private calculateConfidenceScore(
    targetContent: WebsiteContent,
    competitors: CompetitorContent[],
    contentGaps: ContentGap[]
  ): number {
    let confidence = 50 // Base confidence

    if (targetContent.content.length > 1000) confidence += 10
    if (targetContent.headings.length > 5) confidence += 10
    if (competitors.length >= 3) confidence += 15
    if (contentGaps.length >= 5) confidence += 10
    if (targetContent.industry && targetContent.businessType) confidence += 5

    return Math.min(confidence, 95) // Cap at 95%
  }
}