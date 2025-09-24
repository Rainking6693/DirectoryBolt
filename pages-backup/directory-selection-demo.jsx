'use client'
import { useState, useEffect } from 'react'
import DirectoryGrid from '../components/DirectoryGrid'
import SubmissionQueue from '../components/SubmissionQueue'

// Mock directory data for demonstration
const MOCK_DIRECTORIES = [
  {
    id: '1',
    name: 'Google Business Profile',
    category: 'Search Engines',
    authority: 100,
    estimatedTraffic: 50000,
    timeToApproval: 'Instant',
    difficulty: 'easy',
    price: 0,
    features: ['Local SEO', 'Reviews', 'Photos', 'Posts'],
    submissionUrl: 'https://business.google.com',
    isActive: true,
    requiresApproval: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Yelp Business',
    category: 'Review Sites',
    authority: 95,
    estimatedTraffic: 25000,
    timeToApproval: '1-2 days',
    difficulty: 'easy',
    price: 0,
    features: ['Customer Reviews', 'Business Info', 'Photos'],
    submissionUrl: 'https://business.yelp.com',
    isActive: true,
    requiresApproval: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Yellow Pages',
    category: 'Business Directories',
    authority: 85,
    estimatedTraffic: 15000,
    timeToApproval: '3-5 days',
    difficulty: 'medium',
    price: 0,
    features: ['Business Listing', 'Contact Info', 'Categories'],
    submissionUrl: 'https://yellowpages.com',
    isActive: true,
    requiresApproval: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Better Business Bureau',
    category: 'Professional Networks',
    authority: 92,
    estimatedTraffic: 20000,
    timeToApproval: '7-14 days',
    difficulty: 'hard',
    price: 50,
    features: ['Accreditation', 'Trust Badge', 'Reviews', 'Dispute Resolution'],
    submissionUrl: 'https://bbb.org',
    isActive: true,
    requiresApproval: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Foursquare',
    category: 'Local Listings',
    authority: 78,
    estimatedTraffic: 8000,
    timeToApproval: '2-4 days',
    difficulty: 'medium',
    price: 0,
    features: ['Location Data', 'Tips', 'Photos', 'Check-ins'],
    submissionUrl: 'https://foursquare.com',
    isActive: true,
    requiresApproval: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    name: 'TripAdvisor',
    category: 'Review Sites',
    authority: 90,
    estimatedTraffic: 18000,
    timeToApproval: '5-7 days',
    difficulty: 'medium',
    price: 25,
    features: ['Reviews', 'Photos', 'Travel Rankings', 'Recommendations'],
    submissionUrl: 'https://tripadvisor.com',
    isActive: true,
    requiresApproval: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '7',
    name: 'Angie\'s List',
    category: 'Professional Networks',
    authority: 82,
    estimatedTraffic: 12000,
    timeToApproval: '10-14 days',
    difficulty: 'hard',
    price: 75,
    features: ['Verified Reviews', 'Service Categories', 'Lead Generation'],
    submissionUrl: 'https://angieslist.com',
    isActive: true,
    requiresApproval: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '8',
    name: 'Facebook Business',
    category: 'Social Media',
    authority: 96,
    estimatedTraffic: 35000,
    timeToApproval: '1-3 days',
    difficulty: 'easy',
    price: 0,
    features: ['Business Page', 'Reviews', 'Events', 'Messaging'],
    submissionUrl: 'https://business.facebook.com',
    isActive: true,
    requiresApproval: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '9',
    name: 'LinkedIn Company',
    category: 'Professional Networks',
    authority: 94,
    estimatedTraffic: 22000,
    timeToApproval: '2-5 days',
    difficulty: 'medium',
    price: 0,
    features: ['Company Profile', 'Employee Showcase', 'Job Postings', 'Industry Updates'],
    submissionUrl: 'https://linkedin.com',
    isActive: true,
    requiresApproval: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '10',
    name: 'Glassdoor',
    category: 'Professional Networks',
    authority: 88,
    estimatedTraffic: 16000,
    timeToApproval: '7-10 days',
    difficulty: 'hard',
    price: 100,
    features: ['Employer Reviews', 'Salary Data', 'Company Culture', 'Job Listings'],
    submissionUrl: 'https://glassdoor.com',
    isActive: true,
    requiresApproval: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '11',
    name: 'Whitepages',
    category: 'Business Directories',
    authority: 75,
    estimatedTraffic: 9000,
    timeToApproval: '3-7 days',
    difficulty: 'easy',
    price: 0,
    features: ['Business Listing', 'Contact Information', 'Address Verification'],
    submissionUrl: 'https://whitepages.com',
    isActive: true,
    requiresApproval: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '12',
    name: 'Manta',
    category: 'Business Directories',
    authority: 70,
    estimatedTraffic: 7000,
    timeToApproval: '4-8 days',
    difficulty: 'medium',
    price: 15,
    features: ['Small Business Focus', 'Networking', 'Business Resources'],
    submissionUrl: 'https://manta.com',
    isActive: true,
    requiresApproval: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function DirectorySelectionDemo() {
  const [selectedDirectories, setSelectedDirectories] = useState([])
  const [userTier, setUserTier] = useState('starter')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleDirectorySelect = (directory) => {
    const isSelected = selectedDirectories.some(d => d.id === directory.id)
    
    if (isSelected) {
      setSelectedDirectories(prev => prev.filter(d => d.id !== directory.id))
    } else {
      setSelectedDirectories(prev => [...prev, directory])
    }
  }

  const handleBulkSelect = (directories) => {
    setSelectedDirectories(directories)
  }

  const handleRemoveDirectory = (directory) => {
    setSelectedDirectories(prev => prev.filter(d => d.id !== directory.id))
  }

  const handleClearQueue = () => {
    setSelectedDirectories([])
  }

  const handleStartSubmission = async () => {
    setIsSubmitting(true)
    
    // Simulate submission process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    alert(`Successfully submitted to ${selectedDirectories.length} directories!`)
    setSelectedDirectories([])
    setIsSubmitting(false)
  }

  const handleTierUpgrade = () => {
    // In a real app, this would redirect to pricing page or open upgrade modal
    alert('Redirecting to upgrade page... (This is a demo)')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-gradient">
            Directory Selection Demo
          </h1>
          <p className="text-xl text-secondary-300 mb-8 max-w-3xl mx-auto">
            Experience the complete directory selection workflow with tier gating, 
            bulk operations, and intelligent submission queue management.
          </p>

          {/* Demo Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <label className="flex items-center gap-2 text-secondary-300">
              <span>User Tier:</span>
              <select
                value={userTier}
                onChange={(e) => setUserTier(e.target.value)}
                className="input-field w-auto py-1"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-volt-500/20 border border-volt-500/30 rounded-lg">
              <span className="text-volt-400 text-sm">✨ Interactive Demo</span>
            </div>
          </div>
        </div>

        {/* Directory Grid Section */}
        <section className="mb-16">
          <DirectoryGrid
            directories={MOCK_DIRECTORIES}
            isLoading={isLoading}
            userTier={userTier}
            selectedDirectories={selectedDirectories}
            onDirectorySelect={handleDirectorySelect}
            onBulkSelect={handleBulkSelect}
            onTierUpgrade={handleTierUpgrade}
          />
        </section>

        {/* Submission Queue Section */}
        {selectedDirectories.length > 0 && (
          <section>
            <SubmissionQueue
              selectedDirectories={selectedDirectories}
              onRemoveDirectory={handleRemoveDirectory}
              onStartSubmission={handleStartSubmission}
              onClearQueue={handleClearQueue}
              isSubmitting={isSubmitting}
              userTier={userTier}
              creditCost={1}
            />
          </section>
        )}

        {/* Demo Features Showcase */}
        <section className="mt-16">
          <div className="card">
            <h2 className="text-2xl font-black text-white mb-6">Demo Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-secondary-900/50 rounded-lg p-6">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-lg font-bold text-white mb-2">Smart Search & Filters</h3>
                <p className="text-secondary-300 text-sm">
                  Search by name, category, or features. Filter by difficulty, category, and tier availability.
                </p>
              </div>

              <div className="bg-secondary-900/50 rounded-lg p-6">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-lg font-bold text-white mb-2">Tier-Based Access</h3>
                <p className="text-secondary-300 text-sm">
                  Different subscription tiers unlock different difficulty levels. Try changing the tier above!
                </p>
              </div>

              <div className="bg-secondary-900/50 rounded-lg p-6">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-lg font-bold text-white mb-2">Bulk Operations</h3>
                <p className="text-secondary-300 text-sm">
                  Select all available directories, filter by category, or clear selections with one click.
                </p>
              </div>

              <div className="bg-secondary-900/50 rounded-lg p-6">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-lg font-bold text-white mb-2">Upgrade Prompts</h3>
                <p className="text-secondary-300 text-sm">
                  Click on locked directories to see beautiful upgrade modals with tier comparisons.
                </p>
              </div>

              <div className="bg-secondary-900/50 rounded-lg p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-bold text-white mb-2">Smart Analytics</h3>
                <p className="text-secondary-300 text-sm">
                  Real-time stats showing costs, traffic estimates, and submission recommendations.
                </p>
              </div>

              <div className="bg-secondary-900/50 rounded-lg p-6">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="text-lg font-bold text-white mb-2">Submission Queue</h3>
                <p className="text-secondary-300 text-sm">
                  Organized submission workflow with sorting, cost breakdown, and strategic recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Implementation Notes */}
        <section className="mt-16">
          <div className="card">
            <h2 className="text-2xl font-black text-white mb-6">Implementation Highlights</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-volt-400 mb-4">🎨 Design System</h3>
                <ul className="space-y-2 text-secondary-300 text-sm">
                  <li>• Consistent volt yellow theme throughout</li>
                  <li>• Smooth animations and hover effects</li>
                  <li>• Mobile-responsive grid layouts</li>
                  <li>• Accessibility-focused interactions</li>
                  <li>• Loading states and skeleton screens</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-volt-400 mb-4">⚙️ Component Architecture</h3>
                <ul className="space-y-2 text-secondary-300 text-sm">
                  <li>• Modular, reusable component design</li>
                  <li>• TypeScript interfaces for data structures</li>
                  <li>• Efficient state management with useState</li>
                  <li>• Performance optimized with useMemo</li>
                  <li>• Clean prop interfaces and callbacks</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-volt-400 mb-4">🔐 Tier System</h3>
                <ul className="space-y-2 text-secondary-300 text-sm">
                  <li>• Dynamic tier requirement validation</li>
                  <li>• Visual lock indicators for premium content</li>
                  <li>• Contextual upgrade prompts</li>
                  <li>• Tier-specific feature availability</li>
                  <li>• ROI projections for upgrades</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-volt-400 mb-4">📱 User Experience</h3>
                <ul className="space-y-2 text-secondary-300 text-sm">
                  <li>• Intuitive directory card interactions</li>
                  <li>• Smart search with instant filtering</li>
                  <li>• Bulk selection with category grouping</li>
                  <li>• Submission queue with cost tracking</li>
                  <li>• Strategic submission recommendations</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}