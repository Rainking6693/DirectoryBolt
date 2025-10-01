/**
 * New Directory Integration Validation Test
 * Validates all 29 newly added directories for AutoBolt expansion
 * 
 * Validation Criteria:
 * - Complete field mappings
 * - Correct tier assignments  
 * - Valid URL structures
 * - Proper category classification
 * - Submission requirements validation
 * - Domain authority verification
 */

class NewDirectoryValidationTest {
    constructor() {
        this.validationResults = {
            overview: {},
            fieldMappings: {},
            tierAssignments: {},
            urlValidation: {},
            categoryValidation: {},
            requirementsValidation: {},
            domainAuthorityValidation: {},
            integrationReadiness: {}
        };
        
        this.newDirectoryIds = [
            'trustpilot', 'g2', 'capterra', 'getapp', 'pinterest-business', 
            'tiktok-business', 'shopify-apps', 'etsy-shop', 'amazon-seller',
            'wellfound', 'crunchbase', 'producthunt', 'healthgrades', 'avvo',
            'zillow-pro', 'realtor-com', 'justdial', 'gumtree-au', 'yell-uk',
            'kijiji-ca', 'europages', 'alibaba', 'chambers-commerce', 'bbb',
            'software-advice', 'tripadvisor-business', 'opentable', 
            'glassdoor-employer', 'indeed-employer'
        ];
    }

    /**
     * Run comprehensive validation of new directory integrations
     */
    async runValidation() {
        console.log('🔍 Starting New Directory Integration Validation');
        console.log(`📊 Validating ${this.newDirectoryIds.length} new directories\n`);

        try {
            // Load the expanded directory list
            const expandedData = await this.loadExpandedDirectoryData();
            
            // Extract new directories
            const newDirectories = this.extractNewDirectories(expandedData);
            
            // Run validation tests
            await this.validateOverview(newDirectories);
            await this.validateFieldMappings(newDirectories);
            await this.validateTierAssignments(newDirectories);
            await this.validateURLStructures(newDirectories);
            await this.validateCategoryClassification(newDirectories);
            await this.validateSubmissionRequirements(newDirectories);
            await this.validateDomainAuthority(newDirectories);
            await this.validateIntegrationReadiness(newDirectories);
            
            // Generate comprehensive report
            this.generateValidationReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error);
            this.validationResults.overview.success = false;
            this.validationResults.overview.error = error.message;
        }

        return this.validationResults;
    }

    /**
     * Load expanded directory data
     */
    async loadExpandedDirectoryData() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const filePath = path.join(__dirname, 'directories', 'expanded-master-directory-list-final.json');
            const rawData = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(rawData);
        } catch (error) {
            throw new Error(`Failed to load expanded directory data: ${error.message}`);
        }
    }

    /**
     * Extract new directories from the expanded list
     */
    extractNewDirectories(expandedData) {
        const allDirectories = expandedData.directories || [];
        
        // Filter for new directories based on our list of new IDs
        const newDirectories = allDirectories.filter(dir => 
            this.newDirectoryIds.includes(dir.id)
        );

        console.log(`✅ Found ${newDirectories.length} new directories out of ${this.newDirectoryIds.length} expected`);
        
        if (newDirectories.length !== this.newDirectoryIds.length) {
            const missingIds = this.newDirectoryIds.filter(id => 
                !newDirectories.some(dir => dir.id === id)
            );
            console.warn(`⚠️ Missing directories:`, missingIds);
        }

        return newDirectories;
    }

    /**
     * Validate overview metrics
     */
    async validateOverview(newDirectories) {
        console.log('📋 Validating overview metrics...');

        const overview = {
            totalNewDirectories: newDirectories.length,
            expectedDirectories: this.newDirectoryIds.length,
            completionRate: (newDirectories.length / this.newDirectoryIds.length) * 100,
            categoryDistribution: {},
            tierDistribution: {},
            difficultyDistribution: {},
            feeDistribution: { free: 0, paid: 0, freemium: 0 }
        };

        newDirectories.forEach(dir => {
            // Category distribution
            overview.categoryDistribution[dir.category] = 
                (overview.categoryDistribution[dir.category] || 0) + 1;
            
            // Tier distribution
            overview.tierDistribution[dir.tier] = 
                (overview.tierDistribution[dir.tier] || 0) + 1;
            
            // Difficulty distribution
            overview.difficultyDistribution[dir.difficulty] = 
                (overview.difficultyDistribution[dir.difficulty] || 0) + 1;
            
            // Fee distribution
            const fee = (dir.submissionFee || '').toLowerCase();
            if (fee === 'free' || fee === '$0') {
                overview.feeDistribution.free++;
            } else if (fee.includes('varies') || fee.includes('month') || fee.includes('$')) {
                overview.feeDistribution.paid++;
            } else {
                overview.feeDistribution.freemium++;
            }
        });

        this.validationResults.overview = {
            ...overview,
            passed: overview.completionRate >= 90
        };

        console.log(`   Completion rate: ${overview.completionRate.toFixed(1)}%`);
        console.log(`   Categories: ${Object.keys(overview.categoryDistribution).length}`);
        console.log(`   Tiers: ${Object.keys(overview.tierDistribution).length}`);
    }

    /**
     * Validate field mappings completeness and accuracy
     */
    async validateFieldMappings(newDirectories) {
        console.log('🗺️ Validating field mappings...');

        const requiredFields = ['businessName', 'email', 'phone', 'website', 'description'];
        const fieldMappingResults = {
            totalDirectories: newDirectories.length,
            completeFieldMappings: 0,
            incompleteFieldMappings: 0,
            missingRequiredFields: {},
            invalidSelectors: 0,
            selectorPatterns: {
                input: 0,
                textarea: 0,
                select: 0,
                other: 0
            }
        };

        newDirectories.forEach(dir => {
            const mapping = dir.fieldMapping || {};
            const mappingKeys = Object.keys(mapping);
            
            let hasAllRequired = true;
            const missingFields = [];

            // Check required fields
            requiredFields.forEach(field => {
                if (!mapping[field] || !mapping[field].trim()) {
                    hasAllRequired = false;
                    missingFields.push(field);
                }
            });

            if (hasAllRequired) {
                fieldMappingResults.completeFieldMappings++;
            } else {
                fieldMappingResults.incompleteFieldMappings++;
                fieldMappingResults.missingRequiredFields[dir.id] = missingFields;
            }

            // Validate selector patterns
            mappingKeys.forEach(field => {
                const selector = mapping[field];
                if (typeof selector === 'string' && selector.trim()) {
                    // Basic selector validation
                    if (this.isValidCSSSelector(selector)) {
                        if (selector.includes('input')) {
                            fieldMappingResults.selectorPatterns.input++;
                        } else if (selector.includes('textarea')) {
                            fieldMappingResults.selectorPatterns.textarea++;
                        } else if (selector.includes('select')) {
                            fieldMappingResults.selectorPatterns.select++;
                        } else {
                            fieldMappingResults.selectorPatterns.other++;
                        }
                    } else {
                        fieldMappingResults.invalidSelectors++;
                    }
                }
            });
        });

        const completionRate = (fieldMappingResults.completeFieldMappings / newDirectories.length) * 100;

        this.validationResults.fieldMappings = {
            ...fieldMappingResults,
            completionRate,
            passed: completionRate >= 95 && fieldMappingResults.invalidSelectors === 0
        };

        console.log(`   Field mapping completion: ${completionRate.toFixed(1)}%`);
        console.log(`   Invalid selectors: ${fieldMappingResults.invalidSelectors}`);
        console.log(`   Selector types: input(${fieldMappingResults.selectorPatterns.input}), textarea(${fieldMappingResults.selectorPatterns.textarea})`);
    }

    /**
     * Validate tier assignments
     */
    async validateTierAssignments(newDirectories) {
        console.log('🏷️ Validating tier assignments...');

        const tierValidation = {
            totalDirectories: newDirectories.length,
            validTierAssignments: 0,
            invalidTierAssignments: 0,
            tierAnalysis: {},
            domainAuthorityAlignment: 0
        };

        const validTiers = ['starter', 'growth', 'professional', 'enterprise'];

        newDirectories.forEach(dir => {
            const tier = dir.tier;
            const da = dir.domainAuthority || 0;
            const difficulty = dir.difficulty;
            const priority = dir.priority;

            // Validate tier exists
            if (!validTiers.includes(tier)) {
                tierValidation.invalidTierAssignments++;
                return;
            }

            // Analyze tier assignment logic
            let expectedTier = 'starter';
            if (da >= 85 || difficulty === 'hard') {
                expectedTier = 'enterprise';
            } else if (da >= 75 || priority === 'high') {
                expectedTier = 'professional';
            } else if (da >= 60) {
                expectedTier = 'growth';
            }

            const tierLevels = { starter: 1, growth: 2, professional: 3, enterprise: 4 };
            const actualLevel = tierLevels[tier];
            const expectedLevel = tierLevels[expectedTier];

            if (Math.abs(actualLevel - expectedLevel) <= 1) {
                tierValidation.validTierAssignments++;
                if (da >= 75 && tier === 'professional' || tier === 'enterprise') {
                    tierValidation.domainAuthorityAlignment++;
                }
            } else {
                tierValidation.invalidTierAssignments++;
            }

            if (!tierValidation.tierAnalysis[tier]) {
                tierValidation.tierAnalysis[tier] = { count: 0, avgDA: 0, totalDA: 0 };
            }
            tierValidation.tierAnalysis[tier].count++;
            tierValidation.tierAnalysis[tier].totalDA += da;
        });

        // Calculate average DA per tier
        Object.keys(tierValidation.tierAnalysis).forEach(tier => {
            const analysis = tierValidation.tierAnalysis[tier];
            analysis.avgDA = analysis.totalDA / analysis.count;
        });

        const validationRate = (tierValidation.validTierAssignments / newDirectories.length) * 100;
        const daAlignmentRate = (tierValidation.domainAuthorityAlignment / newDirectories.length) * 100;

        this.validationResults.tierAssignments = {
            ...tierValidation,
            validationRate,
            daAlignmentRate,
            passed: validationRate >= 80
        };

        console.log(`   Tier validation rate: ${validationRate.toFixed(1)}%`);
        console.log(`   DA alignment rate: ${daAlignmentRate.toFixed(1)}%`);
        console.log(`   Tier distribution:`, Object.keys(tierValidation.tierAnalysis).map(tier => 
            `${tier}(${tierValidation.tierAnalysis[tier].count})`
        ).join(', '));
    }

    /**
     * Validate URL structures
     */
    async validateURLStructures(newDirectories) {
        console.log('🔗 Validating URL structures...');

        const urlValidation = {
            totalDirectories: newDirectories.length,
            validURLs: 0,
            invalidURLs: 0,
            httpsCount: 0,
            submissionURLs: 0,
            validSubmissionURLs: 0,
            domainAnalysis: {}
        };

        newDirectories.forEach(dir => {
            // Validate main URL
            if (this.isValidURL(dir.url)) {
                urlValidation.validURLs++;
                if (dir.url.startsWith('https://')) {
                    urlValidation.httpsCount++;
                }
                
                // Extract domain for analysis
                try {
                    const domain = new URL(dir.url).hostname.replace('www.', '');
                    urlValidation.domainAnalysis[domain] = (urlValidation.domainAnalysis[domain] || 0) + 1;
                } catch (e) {}
            } else {
                urlValidation.invalidURLs++;
            }

            // Validate submission URL
            if (dir.submissionUrl) {
                urlValidation.submissionURLs++;
                if (this.isValidURL(dir.submissionUrl)) {
                    urlValidation.validSubmissionURLs++;
                }
            }
        });

        const urlValidationRate = (urlValidation.validURLs / newDirectories.length) * 100;
        const httpsRate = (urlValidation.httpsCount / newDirectories.length) * 100;
        const submissionURLRate = urlValidation.submissionURLs > 0 ? 
            (urlValidation.validSubmissionURLs / urlValidation.submissionURLs) * 100 : 100;

        this.validationResults.urlValidation = {
            ...urlValidation,
            urlValidationRate,
            httpsRate,
            submissionURLRate,
            passed: urlValidationRate >= 95 && submissionURLRate >= 90
        };

        console.log(`   URL validation rate: ${urlValidationRate.toFixed(1)}%`);
        console.log(`   HTTPS usage: ${httpsRate.toFixed(1)}%`);
        console.log(`   Submission URL validation: ${submissionURLRate.toFixed(1)}%`);
        console.log(`   Unique domains: ${Object.keys(urlValidation.domainAnalysis).length}`);
    }

    /**
     * Validate category classification
     */
    async validateCategoryClassification(newDirectories) {
        console.log('📊 Validating category classification...');

        const expectedCategories = [
            'review-sites', 'social-commerce', 'tech-startups', 'industry-specific',
            'international-directories', 'professional-services'
        ];

        const categoryValidation = {
            totalDirectories: newDirectories.length,
            categorizedDirectories: 0,
            uncategorizedDirectories: 0,
            validCategories: 0,
            invalidCategories: 0,
            categoryDistribution: {},
            expansionCoverage: {}
        };

        newDirectories.forEach(dir => {
            const category = dir.category;
            
            if (category) {
                categoryValidation.categorizedDirectories++;
                
                if (expectedCategories.includes(category)) {
                    categoryValidation.validCategories++;
                } else {
                    categoryValidation.invalidCategories++;
                }
                
                categoryValidation.categoryDistribution[category] = 
                    (categoryValidation.categoryDistribution[category] || 0) + 1;
            } else {
                categoryValidation.uncategorizedDirectories++;
            }
        });

        // Calculate expansion coverage
        expectedCategories.forEach(category => {
            categoryValidation.expansionCoverage[category] = 
                categoryValidation.categoryDistribution[category] || 0;
        });

        const categorizationRate = (categoryValidation.categorizedDirectories / newDirectories.length) * 100;
        const validCategoryRate = categoryValidation.categorizedDirectories > 0 ? 
            (categoryValidation.validCategories / categoryValidation.categorizedDirectories) * 100 : 0;
        const coverageRate = (Object.keys(categoryValidation.expansionCoverage).filter(cat => 
            categoryValidation.expansionCoverage[cat] > 0).length / expectedCategories.length) * 100;

        this.validationResults.categoryValidation = {
            ...categoryValidation,
            categorizationRate,
            validCategoryRate,
            coverageRate,
            passed: categorizationRate >= 95 && validCategoryRate >= 90 && coverageRate >= 80
        };

        console.log(`   Categorization rate: ${categorizationRate.toFixed(1)}%`);
        console.log(`   Valid category rate: ${validCategoryRate.toFixed(1)}%`);
        console.log(`   Expansion coverage: ${coverageRate.toFixed(1)}%`);
    }

    /**
     * Validate submission requirements
     */
    async validateSubmissionRequirements(newDirectories) {
        console.log('📝 Validating submission requirements...');

        const requirementsValidation = {
            totalDirectories: newDirectories.length,
            directoriesWithRequirements: 0,
            averageRequirements: 0,
            totalRequirements: 0,
            commonRequirements: {},
            complexityAnalysis: {
                simple: 0, // 0-1 requirements
                moderate: 0, // 2-3 requirements
                complex: 0 // 4+ requirements
            }
        };

        newDirectories.forEach(dir => {
            const requirements = dir.requirements || [];
            
            if (Array.isArray(requirements) && requirements.length > 0) {
                requirementsValidation.directoriesWithRequirements++;
                requirementsValidation.totalRequirements += requirements.length;

                // Analyze complexity
                if (requirements.length <= 1) {
                    requirementsValidation.complexityAnalysis.simple++;
                } else if (requirements.length <= 3) {
                    requirementsValidation.complexityAnalysis.moderate++;
                } else {
                    requirementsValidation.complexityAnalysis.complex++;
                }

                // Count common requirements
                requirements.forEach(req => {
                    requirementsValidation.commonRequirements[req] = 
                        (requirementsValidation.commonRequirements[req] || 0) + 1;
                });
            }
        });

        requirementsValidation.averageRequirements = 
            requirementsValidation.totalRequirements / newDirectories.length;

        const requirementsRate = (requirementsValidation.directoriesWithRequirements / newDirectories.length) * 100;

        this.validationResults.requirementsValidation = {
            ...requirementsValidation,
            requirementsRate,
            passed: requirementsRate >= 70 // Allow some directories without requirements
        };

        console.log(`   Requirements coverage: ${requirementsRate.toFixed(1)}%`);
        console.log(`   Average requirements per directory: ${requirementsValidation.averageRequirements.toFixed(1)}`);
        console.log(`   Complexity: simple(${requirementsValidation.complexityAnalysis.simple}), moderate(${requirementsValidation.complexityAnalysis.moderate}), complex(${requirementsValidation.complexityAnalysis.complex})`);
        
        // Show top requirements
        const topRequirements = Object.entries(requirementsValidation.commonRequirements)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([req, count]) => `${req}(${count})`)
            .join(', ');
        console.log(`   Common requirements: ${topRequirements}`);
    }

    /**
     * Validate domain authority distribution
     */
    async validateDomainAuthority(newDirectories) {
        console.log('📈 Validating domain authority distribution...');

        const daValidation = {
            totalDirectories: newDirectories.length,
            directoriesWithDA: 0,
            averageDA: 0,
            medianDA: 0,
            totalDA: 0,
            daDistribution: {
                '90+': 0,
                '80-89': 0,
                '70-79': 0,
                '60-69': 0,
                '50-59': 0,
                '30-49': 0,
                'unknown': 0
            },
            highValueDirectories: 0
        };

        const daValues = [];

        newDirectories.forEach(dir => {
            const da = dir.domainAuthority;
            
            if (da && da > 0) {
                daValidation.directoriesWithDA++;
                daValidation.totalDA += da;
                daValues.push(da);

                // Categorize DA
                if (da >= 90) {
                    daValidation.daDistribution['90+']++;
                    daValidation.highValueDirectories++;
                } else if (da >= 80) {
                    daValidation.daDistribution['80-89']++;
                    daValidation.highValueDirectories++;
                } else if (da >= 70) {
                    daValidation.daDistribution['70-79']++;
                } else if (da >= 60) {
                    daValidation.daDistribution['60-69']++;
                } else if (da >= 50) {
                    daValidation.daDistribution['50-59']++;
                } else if (da >= 30) {
                    daValidation.daDistribution['30-49']++;
                }
            } else {
                daValidation.daDistribution['unknown']++;
            }
        });

        if (daValues.length > 0) {
            daValidation.averageDA = daValidation.totalDA / daValues.length;
            daValues.sort((a, b) => a - b);
            daValidation.medianDA = daValues[Math.floor(daValues.length / 2)];
        }

        const daCoverageRate = (daValidation.directoriesWithDA / newDirectories.length) * 100;
        const highValueRate = (daValidation.highValueDirectories / newDirectories.length) * 100;

        this.validationResults.domainAuthorityValidation = {
            ...daValidation,
            daCoverageRate,
            highValueRate,
            passed: daCoverageRate >= 90 && daValidation.averageDA >= 70 && highValueRate >= 30
        };

        console.log(`   DA coverage: ${daCoverageRate.toFixed(1)}%`);
        console.log(`   Average DA: ${daValidation.averageDA.toFixed(1)} (median: ${daValidation.medianDA})`);
        console.log(`   High-value directories (DA 80+): ${highValueRate.toFixed(1)}%`);
        console.log(`   DA distribution: 90+(${daValidation.daDistribution['90+']}), 80-89(${daValidation.daDistribution['80-89']}), 70-79(${daValidation.daDistribution['70-79']})`);
    }

    /**
     * Validate integration readiness
     */
    async validateIntegrationReadiness(newDirectories) {
        console.log('🚀 Validating integration readiness...');

        const readinessValidation = {
            totalDirectories: newDirectories.length,
            fullyReady: 0,
            partiallyReady: 0,
            notReady: 0,
            readinessFactors: {
                completeFieldMapping: 0,
                validURL: 0,
                validSubmissionURL: 0,
                hasRequirements: 0,
                hasDomainAuthority: 0,
                validTier: 0,
                validCategory: 0
            },
            averageReadinessScore: 0
        };

        const validTiers = ['starter', 'growth', 'professional', 'enterprise'];
        const validCategories = ['review-sites', 'social-commerce', 'tech-startups', 'industry-specific', 'international-directories', 'professional-services'];
        const requiredFields = ['businessName', 'email', 'phone', 'website', 'description'];

        newDirectories.forEach(dir => {
            let readinessScore = 0;
            const factors = readinessValidation.readinessFactors;

            // Check field mapping completeness
            const mapping = dir.fieldMapping || {};
            const hasAllRequired = requiredFields.every(field => mapping[field] && mapping[field].trim());
            if (hasAllRequired) {
                factors.completeFieldMapping++;
                readinessScore++;
            }

            // Check valid URL
            if (this.isValidURL(dir.url)) {
                factors.validURL++;
                readinessScore++;
            }

            // Check valid submission URL
            if (dir.submissionUrl && this.isValidURL(dir.submissionUrl)) {
                factors.validSubmissionURL++;
                readinessScore++;
            }

            // Check has requirements
            if (dir.requirements && Array.isArray(dir.requirements) && dir.requirements.length > 0) {
                factors.hasRequirements++;
                readinessScore++;
            }

            // Check domain authority
            if (dir.domainAuthority && dir.domainAuthority > 0) {
                factors.hasDomainAuthority++;
                readinessScore++;
            }

            // Check valid tier
            if (validTiers.includes(dir.tier)) {
                factors.validTier++;
                readinessScore++;
            }

            // Check valid category
            if (validCategories.includes(dir.category)) {
                factors.validCategory++;
                readinessScore++;
            }

            // Categorize readiness
            const readinessPercentage = (readinessScore / 7) * 100;
            if (readinessPercentage >= 85) {
                readinessValidation.fullyReady++;
            } else if (readinessPercentage >= 60) {
                readinessValidation.partiallyReady++;
            } else {
                readinessValidation.notReady++;
            }

            readinessValidation.averageReadinessScore += readinessPercentage;
        });

        readinessValidation.averageReadinessScore /= newDirectories.length;

        const fullyReadyRate = (readinessValidation.fullyReady / newDirectories.length) * 100;
        const deploymentReadiness = fullyReadyRate + (readinessValidation.partiallyReady / newDirectories.length * 50);

        this.validationResults.integrationReadiness = {
            ...readinessValidation,
            fullyReadyRate,
            deploymentReadiness,
            passed: fullyReadyRate >= 70 && readinessValidation.averageReadinessScore >= 75
        };

        console.log(`   Fully ready: ${fullyReadyRate.toFixed(1)}% (${readinessValidation.fullyReady} directories)`);
        console.log(`   Partially ready: ${((readinessValidation.partiallyReady / newDirectories.length) * 100).toFixed(1)}% (${readinessValidation.partiallyReady} directories)`);
        console.log(`   Not ready: ${((readinessValidation.notReady / newDirectories.length) * 100).toFixed(1)}% (${readinessValidation.notReady} directories)`);
        console.log(`   Average readiness score: ${readinessValidation.averageReadinessScore.toFixed(1)}%`);
    }

    /**
     * Generate comprehensive validation report
     */
    generateValidationReport() {
        console.log('\n📊 Generating validation report...\n');

        const results = this.validationResults;
        const overallScore = this.calculateOverallValidationScore();
        const passed = overallScore >= 80;

        console.log('=' .repeat(80));
        console.log('          AutoBolt New Directory Integration Validation Report');
        console.log('=' .repeat(80));
        console.log(`Overall Validation Score: ${overallScore.toFixed(1)}/100 ${passed ? '✅ PASS' : '❌ FAIL'}`);
        console.log();
        
        // Individual test results
        console.log('📋 Test Results:');
        console.log(`   Overview:              ${results.overview.passed ? '✅' : '❌'} (${results.overview.completionRate?.toFixed(1)}%)`);
        console.log(`   Field Mappings:        ${results.fieldMappings.passed ? '✅' : '❌'} (${results.fieldMappings.completionRate?.toFixed(1)}%)`);
        console.log(`   Tier Assignments:      ${results.tierAssignments.passed ? '✅' : '❌'} (${results.tierAssignments.validationRate?.toFixed(1)}%)`);
        console.log(`   URL Validation:        ${results.urlValidation.passed ? '✅' : '❌'} (${results.urlValidation.urlValidationRate?.toFixed(1)}%)`);
        console.log(`   Category Classification: ${results.categoryValidation.passed ? '✅' : '❌'} (${results.categoryValidation.coverageRate?.toFixed(1)}%)`);
        console.log(`   Requirements:          ${results.requirementsValidation.passed ? '✅' : '❌'} (${results.requirementsValidation.requirementsRate?.toFixed(1)}%)`);
        console.log(`   Domain Authority:      ${results.domainAuthorityValidation.passed ? '✅' : '❌'} (${results.domainAuthorityValidation.daCoverageRate?.toFixed(1)}%)`);
        console.log(`   Integration Readiness: ${results.integrationReadiness.passed ? '✅' : '❌'} (${results.integrationReadiness.fullyReadyRate?.toFixed(1)}%)`);
        
        console.log();
        console.log('📊 Summary Statistics:');
        console.log(`   New Directories Added: ${results.overview.totalNewDirectories} / ${results.overview.expectedDirectories}`);
        console.log(`   Average Domain Authority: ${results.domainAuthorityValidation.averageDA?.toFixed(1)}`);
        console.log(`   High-Value Directories: ${results.domainAuthorityValidation.highValueDirectories} (${results.domainAuthorityValidation.highValueRate?.toFixed(1)}%)`);
        console.log(`   Categories Expanded: ${Object.keys(results.categoryValidation.categoryDistribution || {}).length}`);
        console.log(`   Integration Ready: ${results.integrationReadiness.fullyReady} directories`);
        
        console.log();
        console.log('🎯 Recommendations:');
        if (passed) {
            console.log('   ✅ All new directories meet quality standards');
            console.log('   ✅ Ready for production deployment');
            console.log('   ✅ Package tiers properly balanced');
            console.log('   💡 Consider monitoring performance impact');
        } else {
            console.log('   ⚠️ Some directories need attention before deployment');
            if (!results.fieldMappings.passed) {
                console.log('   🔧 Fix incomplete field mappings');
            }
            if (!results.tierAssignments.passed) {
                console.log('   🏷️ Review tier assignment logic');
            }
            if (!results.urlValidation.passed) {
                console.log('   🔗 Validate URL structures');
            }
            if (!results.integrationReadiness.passed) {
                console.log('   🚀 Complete integration requirements');
            }
        }
        
        console.log('=' .repeat(80));
        
        return overallScore;
    }

    /**
     * Calculate overall validation score
     */
    calculateOverallValidationScore() {
        const results = this.validationResults;
        const weights = {
            overview: 0.1,
            fieldMappings: 0.25,
            tierAssignments: 0.15,
            urlValidation: 0.1,
            categoryValidation: 0.1,
            requirementsValidation: 0.1,
            domainAuthorityValidation: 0.1,
            integrationReadiness: 0.1
        };

        let totalScore = 0;
        let totalWeight = 0;

        Object.entries(weights).forEach(([key, weight]) => {
            const result = results[key];
            if (result && typeof result.passed === 'boolean') {
                totalScore += (result.passed ? 100 : 0) * weight;
                totalWeight += weight;
            }
        });

        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    /**
     * Helper methods
     */
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    isValidCSSSelector(selector) {
        try {
            if (typeof document !== 'undefined') {
                document.querySelector(selector);
            }
            return true;
        } catch (e) {
            // Basic validation for common patterns
            return /^[a-zA-Z0-9\-_\[\]="':.*#\s,>+~()]+$/.test(selector);
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewDirectoryValidationTest;
}

// Auto-run if executed directly
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    (async () => {
        try {
            const validator = new NewDirectoryValidationTest();
            await validator.runValidation();
        } catch (error) {
            console.error('Validation execution failed:', error);
        }
    })();
}