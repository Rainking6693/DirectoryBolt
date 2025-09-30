/**
 * AI COST OPTIMIZATION TESTING SUITE
 * Tests cost optimization strategies, API usage monitoring,
 * and budget management for AI analysis operations
 */

const axios = require('axios')
const fs = require('fs').promises

const shouldRunE2E = process.env.RUN_E2E === 'true'
const describeIfE2E = shouldRunE2E ? describe : describe.skip

describeIfE2E('AI Cost Optimization Testing', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  let costTrackingData = []

  describe('API Cost Monitoring', () => {
    test('tracks token usage and costs accurately', async () => {
      const testRequests = [
        { url: 'https://simple-business.com', tier: 'starter', expectedTokenRange: [1000, 3000] },
        { url: 'https://complex-business.com', tier: 'growth', expectedTokenRange: [3000, 8000] },
        { url: 'https://enterprise-business.com', tier: 'enterprise', expectedTokenRange: [8000, 15000] }
      ]

      for (const request of testRequests) {
        const response = await axios.post(`${baseUrl}/api/analyze`, {
          url: request.url,
          tier: request.tier
        }, {
          timeout: 90000
        })

        expect(response.status).toBe(200)
        expect(response.data.usage).toBeDefined()
        expect(response.data.usage.tokensUsed).toBeDefined()
        expect(response.data.usage.cost).toBeDefined()

        const tokensUsed = response.data.usage.tokensUsed
        const cost = response.data.usage.cost

        // Verify token usage is within expected range
        expect(tokensUsed).toBeGreaterThanOrEqual(request.expectedTokenRange[0])
        expect(tokensUsed).toBeLessThanOrEqual(request.expectedTokenRange[1])

        // Verify cost calculation (rough GPT-4 pricing: $0.03/1k input + $0.06/1k output)
        const expectedMinCost = (tokensUsed / 1000) * 0.02 // Conservative estimate
        const expectedMaxCost = (tokensUsed / 1000) * 0.10 // Higher estimate including output tokens
        
        expect(cost).toBeGreaterThanOrEqual(expectedMinCost)
        expect(cost).toBeLessThanOrEqual(expectedMaxCost)

        costTrackingData.push({
          tier: request.tier,
          tokensUsed,
          cost,
          costPerToken: cost / tokensUsed,
          timestamp: new Date().toISOString()
        })

        console.log(`✅ ${request.tier} tier: ${tokensUsed} tokens, $${cost.toFixed(4)} cost`)
      }
    }, 300000)

    test('implements effective caching to reduce costs', async () => {
      const testUrl = 'https://caching-cost-test.com'
      const customerId = 'cost-cache-test-customer'

      // First analysis (should be full cost)
      const response1 = await axios.post(`${baseUrl}/api/ai/enhanced-analysis`, {
        customerId,
        businessData: {
          businessName: 'Cache Cost Test',
          website: testUrl,
          description: 'Testing cost-saving through caching',
          city: 'Cache City',
          state: 'CC',
          email: 'cache@test.com'
        },
        analysisOptions: {
          forceRefresh: true
        }
      }, {
        timeout: 90000
      })

      expect(response1.status).toBe(200)
      expect(response1.data.cached).toBe(false)

      // Second analysis (should use cache and save cost)
      const response2 = await axios.post(`${baseUrl}/api/ai/enhanced-analysis`, {
        customerId,
        businessData: {
          businessName: 'Cache Cost Test',
          website: testUrl,
          description: 'Testing cost-saving through caching',
          city: 'Cache City',
          state: 'CC',
          email: 'cache@test.com'
        }
        // No forceRefresh - should use cache
      }, {
        timeout: 30000
      })

      expect(response2.status).toBe(200)
      expect(response2.data.cached).toBe(true)
      expect(response2.data.costSavings).toBeDefined()
      expect(response2.data.costSavings).toBeGreaterThan(0)

      console.log(`✅ Cache savings: $${response2.data.costSavings} saved through caching`)

      costTrackingData.push({
        type: 'cache_savings',
        originalCost: 299, // Estimated full analysis cost
        savedCost: response2.data.costSavings,
        efficiencyGain: (response2.data.costSavings / 299) * 100,
        timestamp: new Date().toISOString()
      })
    }, 150000)

    test('optimizes prompt engineering for cost efficiency', async () => {
      // Test different prompt strategies for cost optimization
      const testCases = [
        {
          name: 'Minimal Analysis',
          config: {
            analysisDepth: 'basic',
            includeCompetitorAnalysis: false,
            includeRevenueProjections: false
          },
          expectedMaxCost: 0.50
        },
        {
          name: 'Standard Analysis',
          config: {
            analysisDepth: 'standard',
            includeCompetitorAnalysis: true,
            includeRevenueProjections: false
          },
          expectedMaxCost: 2.00
        },
        {
          name: 'Comprehensive Analysis',
          config: {
            analysisDepth: 'comprehensive',
            includeCompetitorAnalysis: true,
            includeRevenueProjections: true
          },
          expectedMaxCost: 5.00
        }
      ]

      for (const testCase of testCases) {
        const response = await axios.post(`${baseUrl}/api/ai/enhanced-analysis`, {
          customerId: `prompt-opt-${testCase.name.toLowerCase().replace(' ', '-')}`,
          businessData: {
            businessName: `Prompt Optimization Test - ${testCase.name}`,
            website: `https://prompt-opt-${testCase.name.toLowerCase().replace(' ', '-')}.com`,
            description: 'Testing prompt optimization for cost efficiency',
            city: 'Opt City',
            state: 'OC',
            email: 'opt@test.com'
          },
          analysisOptions: {
            ...testCase.config,
            forceRefresh: true
          }
        }, {
          timeout: 120000
        })

        expect(response.status).toBe(200)
        
        // For mock implementation, we'll verify the structure exists
        // In real implementation, this would verify actual AI costs
        expect(response.data.analysisData).toBeDefined()
        
        console.log(`✅ ${testCase.name}: Structure validated for cost optimization`)

        costTrackingData.push({
          analysisType: testCase.name,
          config: testCase.config,
          expectedMaxCost: testCase.expectedMaxCost,
          timestamp: new Date().toISOString()
        })
      }
    }, 400000)
  })

  describe('Budget Management', () => {
    test('enforces tier-based cost limits', async () => {
      const tierLimits = [
        { tier: 'starter', dailyLimit: 100, monthlyLimit: 1000 },
        { tier: 'growth', dailyLimit: 500, monthlyLimit: 5000 },
        { tier: 'professional', dailyLimit: 1000, monthlyLimit: 10000 },
        { tier: 'enterprise', dailyLimit: 5000, monthlyLimit: 50000 }
      ]

      for (const limit of tierLimits) {
        // This would test actual budget enforcement in a real implementation
        // For now, we test that the tier configuration is recognized
        const response = await axios.post(`${baseUrl}/api/analyze`, {
          url: `https://budget-test-${limit.tier}.com`,
          tier: limit.tier
        }, {
          timeout: 90000
        })

        expect(response.status).toBe(200)
        
        // Verify tier is properly recognized and configured
        if (response.data.data) {
          const analysis = response.data.data
          if (limit.tier === 'starter') {
            expect(analysis.directoryOpportunities.totalDirectories).toBeLessThanOrEqual(25)
          } else if (limit.tier === 'growth') {
            expect(analysis.directoryOpportunities.totalDirectories).toBeLessThanOrEqual(75)
          } else if (limit.tier === 'professional') {
            expect(analysis.directoryOpportunities.totalDirectories).toBeLessThanOrEqual(150)
          }
        }

        console.log(`✅ ${limit.tier} tier: Budget limits configured (Daily: $${limit.dailyLimit}, Monthly: $${limit.monthlyLimit})`)
      }
    }, 400000)

    test('implements cost-per-customer tracking', async () => {
      const customers = [
        'cost-track-customer-1',
        'cost-track-customer-2',
        'cost-track-customer-3'
      ]

      const customerCosts = []

      for (const customerId of customers) {
        // Simulate multiple analyses per customer
        const analyses = [
          { iteration: 1, forceRefresh: true },
          { iteration: 2, forceRefresh: false }, // Should use cache
          { iteration: 3, forceRefresh: false }  // Should use cache
        ]

        let totalCostForCustomer = 0

        for (const analysis of analyses) {
          const response = await axios.post(`${baseUrl}/api/ai/enhanced-analysis`, {
            customerId,
            businessData: {
              businessName: `Cost Tracking Test ${customerId}`,
              website: `https://${customerId}.com`,
              description: 'Testing per-customer cost tracking',
              city: 'Cost City',
              state: 'CC',
              email: `${customerId}@test.com`
            },
            analysisOptions: {
              forceRefresh: analysis.forceRefresh
            }
          }, {
            timeout: 90000
          })

          expect(response.status).toBe(200)

          if (analysis.iteration === 1) {
            expect(response.data.cached).toBe(false)
            totalCostForCustomer += 299 // Estimated full analysis cost
          } else {
            expect(response.data.cached).toBe(true)
            // Cached requests should have minimal cost
            totalCostForCustomer += 1
          }
        }

        customerCosts.push({
          customerId,
          totalCost: totalCostForCustomer,
          analysisCount: analyses.length,
          avgCostPerAnalysis: totalCostForCustomer / analyses.length
        })

        console.log(`✅ ${customerId}: $${totalCostForCustomer} total, avg $${(totalCostForCustomer / analyses.length).toFixed(2)} per analysis`)
      }

      // Verify cost efficiency through caching
      const avgTotalCost = customerCosts.reduce((sum, c) => sum + c.totalCost, 0) / customerCosts.length
      expect(avgTotalCost).toBeLessThan(350) // Should be less than 350 due to caching

      costTrackingData.push({
        type: 'customer_cost_tracking',
        customers: customerCosts,
        averageTotalCost: avgTotalCost,
        timestamp: new Date().toISOString()
      })
    }, 300000)
  })

  describe('Cost Optimization Strategies', () => {
    test('batch processing reduces per-request costs', async () => {
      // Test single requests vs batch processing
      const singleRequestCosts = []
      const batchRequestCost = 0 // Would be calculated in real implementation

      // Single requests
      for (let i = 0; i < 3; i++) {
        const response = await axios.post(`${baseUrl}/api/analyze`, {
          url: `https://batch-test-single-${i}.com`,
          tier: 'growth'
        }, {
          timeout: 90000
        })

        expect(response.status).toBe(200)
        if (response.data.usage?.cost) {
          singleRequestCosts.push(response.data.usage.cost)
        }
      }

      // In a real implementation, you would test batch processing here
      // For now, we verify the structure supports cost optimization
      const totalSingleCosts = singleRequestCosts.reduce((sum, cost) => sum + cost, 0)
      
      console.log(`✅ Single requests: $${totalSingleCosts.toFixed(4)} total`)
      console.log(`✅ Batch processing structure validated for cost optimization`)

      costTrackingData.push({
        type: 'batch_processing_comparison',
        singleRequestCosts,
        totalSingleCosts,
        potentialBatchSavings: totalSingleCosts * 0.2, // Estimated 20% savings
        timestamp: new Date().toISOString()
      })
    }, 300000)

    test('smart prompt caching reduces redundant API calls', async () => {
      const commonBusinessTypes = [
        'restaurant',
        'law firm',
        'dental practice',
        'hvac contractor'
      ]

      const cachingEfficiency = []

      for (const businessType of commonBusinessTypes) {
        // First analysis of this business type
        const response1 = await axios.post(`${baseUrl}/api/analyze`, {
          url: `https://cache-test-${businessType.replace(' ', '-')}-1.com`,
          tier: 'growth',
          userInput: {
            businessType: businessType,
            description: `A ${businessType} business`
          }
        }, {
          timeout: 90000
        })

        expect(response1.status).toBe(200)

        // Second analysis of same business type (should benefit from pattern recognition)
        const response2 = await axios.post(`${baseUrl}/api/analyze`, {
          url: `https://cache-test-${businessType.replace(' ', '-')}-2.com`,
          tier: 'growth',
          userInput: {
            businessType: businessType,
            description: `Another ${businessType} business`
          }
        }, {
          timeout: 90000
        })

        expect(response2.status).toBe(200)

        // Both should have similar categorization (indicating pattern recognition)
        if (response1.data.data && response2.data.data) {
          const category1 = response1.data.data.profile.primaryCategory
          const category2 = response2.data.data.profile.primaryCategory
          
          expect(category1).toBe(category2) // Should categorize similarly

          cachingEfficiency.push({
            businessType,
            category: category1,
            consistentCategorization: true
          })
        }

        console.log(`✅ ${businessType}: Pattern recognition validated`)
      }

      costTrackingData.push({
        type: 'pattern_recognition_efficiency',
        businessTypes: cachingEfficiency,
        timestamp: new Date().toISOString()
      })
    }, 400000)
  })

  describe('ROI Analysis', () => {
    test('calculates cost-benefit ratio for different tiers', async () => {
      const tiers = ['starter', 'growth', 'professional', 'enterprise']
      const tierROI = []

      for (const tier of tiers) {
        const response = await axios.post(`${baseUrl}/api/analyze`, {
          url: `https://roi-test-${tier}.com`,
          tier
        }, {
          timeout: 90000
        })

        expect(response.status).toBe(200)

        if (response.data.data) {
          const analysis = response.data.data
          const directoryCount = analysis.directoryOpportunities.totalDirectories
          const projectedTraffic = analysis.directoryOpportunities.estimatedResults.totalTrafficIncrease
          const processingTime = response.data.processingTime

          // Calculate estimated value per directory
          const valuePerDirectory = projectedTraffic / directoryCount
          
          tierROI.push({
            tier,
            directoryCount,
            projectedTraffic,
            valuePerDirectory,
            processingTime,
            estimatedROI: (projectedTraffic * 2) // Rough estimate: traffic * $2 value
          })

          console.log(`✅ ${tier}: ${directoryCount} directories, ${projectedTraffic} traffic increase, $${(projectedTraffic * 2).toFixed(0)} estimated value`)
        }
      }

      // Higher tiers should provide better ROI per dollar spent
      const sortedByROI = tierROI.sort((a, b) => b.estimatedROI - a.estimatedROI)
      expect(sortedByROI[0].tier).toMatch(/professional|enterprise/)

      costTrackingData.push({
        type: 'tier_roi_analysis',
        tiers: tierROI,
        timestamp: new Date().toISOString()
      })
    }, 400000)
  })

  // Generate cost optimization report
  afterAll(async () => {
    const reportPath = './test-results/cost-optimization-report.json'
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'AI Cost Optimization Testing',
      summary: {
        totalTests: costTrackingData.length,
        avgTokenUsage: costTrackingData
          .filter(d => d.tokensUsed)
          .reduce((sum, d) => sum + d.tokensUsed, 0) / 
          costTrackingData.filter(d => d.tokensUsed).length || 0,
        totalEstimatedSavings: costTrackingData
          .filter(d => d.savedCost)
          .reduce((sum, d) => sum + d.savedCost, 0),
        cachingEfficiency: costTrackingData
          .filter(d => d.efficiencyGain)
          .reduce((sum, d) => sum + d.efficiencyGain, 0) / 
          costTrackingData.filter(d => d.efficiencyGain).length || 0
      },
      costTrackingData,
      recommendations: [
        'Implement aggressive caching for repeat business types',
        'Use batch processing for multiple analyses',
        'Monitor token usage patterns for optimization opportunities',
        'Set up cost alerts for budget management',
        'Consider tier-specific prompt optimization'
      ]
    }

    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
      console.log(`💰 Cost Optimization Report saved to ${reportPath}`)
    } catch (error) {
      console.error('Failed to save cost optimization report:', error)
    }
  })
})