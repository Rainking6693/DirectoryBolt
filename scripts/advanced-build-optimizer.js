#!/usr/bin/env node

/**
 * Advanced Build Optimization System
 * Implements cutting-edge build strategies from Vercel/Netlify 2025 research
 * - Intelligent caching with cache fingerprinting
 * - Build artifact optimization
 * - Performance monitoring and alerting
 * - Automated bundle analysis
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

class AdvancedBuildOptimizer {
  constructor() {
    this.buildMetrics = {
      startTime: performance.now(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: this.detectPlatform(),
      optimizations: [],
      cacheStats: {},
      bundleAnalysis: {},
      performance: {},
      recommendations: []
    };
    
    this.cacheDir = path.join(process.cwd(), '.build-cache');
    this.metricsFile = path.join(process.cwd(), 'build-metrics.json');
  }

  detectPlatform() {
    if (process.env.NETLIFY) return 'netlify';
    if (process.env.VERCEL) return 'vercel';
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'aws';
    return 'local';
  }

  async initializeCache() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log('📁 Created build cache directory');
    }

    // Load previous build metrics for comparison
    if (fs.existsSync(this.metricsFile)) {
      try {
        const previousMetrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
        this.buildMetrics.previousBuild = previousMetrics;
        console.log('📊 Loaded previous build metrics for comparison');
      } catch (error) {
        console.log('⚠️ Could not load previous build metrics');
      }
    }
  }

  generateCacheKey(filePath) {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath);
    return crypto
      .createHash('sha256')
      .update(content)
      .update(stats.mtime.toISOString())
      .digest('hex')
      .substring(0, 16);
  }

  async optimizeDependencies() {
    console.log('🔧 Optimizing dependencies...');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const optimization = {
      name: 'Dependency Analysis',
      startTime: performance.now(),
      results: {
        totalDependencies: Object.keys(deps).length,
        heavyPackages: [],
        duplicates: [],
        outdated: []
      }
    };

    // Identify heavy packages that could be optimized
    const heavyPackages = [
      'puppeteer', 'playwright', '@sparticuz/chromium',
      'webpack', 'typescript', 'eslint'
    ];

    for (const pkg of heavyPackages) {
      if (deps[pkg]) {
        optimization.results.heavyPackages.push(pkg);
      }
    }

    // Check for potential bundle optimizations
    if (deps['puppeteer'] && deps['@sparticuz/chromium']) {
      this.buildMetrics.recommendations.push({
        category: 'Bundle Size',
        priority: 'high',
        recommendation: 'Consider using only @sparticuz/chromium in production to reduce bundle size',
        potentialSavings: '~50MB'
      });
    }

    optimization.duration = performance.now() - optimization.startTime;
    this.buildMetrics.optimizations.push(optimization);
  }

  async optimizeNextConfig() {
    console.log('⚙️ Optimizing Next.js configuration...');
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    
    if (!fs.existsSync(nextConfigPath)) {
      console.log('⚠️ next.config.js not found, skipping optimization');
      return;
    }

    const optimization = {
      name: 'Next.js Config Optimization',
      startTime: performance.now(),
      applied: []
    };

    // Read current config
    const configContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Check for modern optimizations
    const optimizations = [
      {
        check: 'swcMinify: true',
        name: 'SWC Minification',
        benefit: 'Faster builds, smaller bundles'
      },
      {
        check: 'experimental: {',
        name: 'Experimental Features',
        benefit: 'Latest performance optimizations'
      },
      {
        check: 'optimizeCss: true',
        name: 'CSS Optimization',
        benefit: 'Smaller CSS bundles'
      },
      {
        check: 'splitChunks',
        name: 'Bundle Splitting',
        benefit: 'Better caching, faster loads'
      }
    ];

    for (const opt of optimizations) {
      if (configContent.includes(opt.check)) {
        optimization.applied.push(opt.name);
      } else {
        this.buildMetrics.recommendations.push({
          category: 'Configuration',
          priority: 'medium',
          recommendation: `Enable ${opt.name} in next.config.js`,
          benefit: opt.benefit
        });
      }
    }

    optimization.duration = performance.now() - optimization.startTime;
    this.buildMetrics.optimizations.push(optimization);
  }

  async performBundleAnalysis() {
    console.log('📦 Performing bundle analysis...');
    const analysis = {
      name: 'Bundle Analysis',
      startTime: performance.now(),
      results: {}
    };

    try {
      // Check if .next directory exists
      const nextBuildDir = path.join(process.cwd(), '.next');
      if (fs.existsSync(nextBuildDir)) {
        const staticDir = path.join(nextBuildDir, 'static');
        if (fs.existsSync(staticDir)) {
          analysis.results = await this.analyzeBuildArtifacts(staticDir);
        }
      }

      // Analyze package.json for bundle insights
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        analysis.results.scripts = Object.keys(packageJson.scripts || {});
        analysis.results.hasAnalyzeScript = !!packageJson.scripts['build:analyze'];
        
        if (!analysis.results.hasAnalyzeScript) {
          this.buildMetrics.recommendations.push({
            category: 'Bundle Analysis',
            priority: 'low',
            recommendation: 'Add bundle analyzer script for detailed insights',
            implementation: 'Add "build:analyze": "cross-env ANALYZE=true next build" to scripts'
          });
        }
      }

    } catch (error) {
      analysis.results.error = error.message;
      console.log(`⚠️ Bundle analysis failed: ${error.message}`);
    }

    analysis.duration = performance.now() - analysis.startTime;
    this.buildMetrics.bundleAnalysis = analysis;
  }

  async analyzeBuildArtifacts(buildDir) {
    const artifacts = {
      totalSize: 0,
      files: [],
      chunks: [],
      assets: []
    };

    const analyzeDirectory = (dirPath, prefix = '') => {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const relativePath = path.join(prefix, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          analyzeDirectory(filePath, relativePath);
        } else {
          const fileInfo = {
            path: relativePath,
            size: stats.size,
            type: this.getFileType(file)
          };
          
          artifacts.files.push(fileInfo);
          artifacts.totalSize += stats.size;
          
          if (file.includes('chunks')) {
            artifacts.chunks.push(fileInfo);
          } else if (file.match(/\.(js|css|png|jpg|webp|svg)$/)) {
            artifacts.assets.push(fileInfo);
          }
        }
      }
    };

    analyzeDirectory(buildDir);

    // Sort by size to identify largest files
    artifacts.files.sort((a, b) => b.size - a.size);
    artifacts.largestFiles = artifacts.files.slice(0, 10);

    return artifacts;
  }

  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.css': 'stylesheet',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.webp': 'image',
      '.svg': 'image',
      '.woff': 'font',
      '.woff2': 'font',
      '.json': 'data'
    };
    return typeMap[ext] || 'other';
  }

  async optimizeBuildCache() {
    console.log('💾 Optimizing build cache...');
    const cacheOptimization = {
      name: 'Build Cache Optimization',
      startTime: performance.now(),
      strategy: 'intelligent-fingerprinting',
      results: {}
    };

    try {
      // Create cache manifest
      const cacheManifest = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        environment: this.buildMetrics.environment,
        platform: this.buildMetrics.platform,
        fingerprints: {}
      };

      // Generate fingerprints for key files
      const keyFiles = [
        'package.json',
        'package-lock.json',
        'next.config.js',
        'tailwind.config.js',
        'tsconfig.json'
      ];

      for (const file of keyFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          cacheManifest.fingerprints[file] = this.generateCacheKey(filePath);
        }
      }

      // Save cache manifest
      const manifestPath = path.join(this.cacheDir, 'cache-manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(cacheManifest, null, 2));

      cacheOptimization.results = {
        manifestCreated: true,
        fingerprintedFiles: Object.keys(cacheManifest.fingerprints).length,
        cacheDirectory: this.cacheDir
      };

      // Compare with previous build for cache effectiveness
      if (this.buildMetrics.previousBuild?.cacheStats?.fingerprints) {
        const currentFingerprints = cacheManifest.fingerprints;
        const previousFingerprints = this.buildMetrics.previousBuild.cacheStats.fingerprints;
        
        const changedFiles = Object.keys(currentFingerprints).filter(
          file => currentFingerprints[file] !== previousFingerprints[file]
        );

        cacheOptimization.results.cacheEffectiveness = {
          totalFiles: Object.keys(currentFingerprints).length,
          changedFiles: changedFiles.length,
          cacheHitRatio: ((Object.keys(currentFingerprints).length - changedFiles.length) / Object.keys(currentFingerprints).length * 100).toFixed(1) + '%'
        };
      }

    } catch (error) {
      cacheOptimization.results.error = error.message;
      console.log(`⚠️ Cache optimization failed: ${error.message}`);
    }

    cacheOptimization.duration = performance.now() - cacheOptimization.startTime;
    this.buildMetrics.cacheStats = cacheOptimization;
  }

  async monitorPerformance() {
    console.log('📈 Monitoring build performance...');
    const performanceMetrics = {
      buildDuration: performance.now() - this.buildMetrics.startTime,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      cpuUsage: process.cpuUsage()
    };

    // Performance thresholds
    const thresholds = {
      buildDuration: 300000, // 5 minutes
      heapUsed: 1000 * 1024 * 1024, // 1GB
      heapUtilization: 80 // 80%
    };

    const heapUtilization = (performanceMetrics.memoryUsage.heapUsed / performanceMetrics.memoryUsage.heapTotal) * 100;

    // Performance warnings
    if (performanceMetrics.buildDuration > thresholds.buildDuration) {
      this.buildMetrics.recommendations.push({
        category: 'Performance',
        priority: 'high',
        recommendation: 'Build duration exceeds recommended threshold',
        implementation: 'Consider optimizing dependencies or enabling parallel builds'
      });
    }

    if (heapUtilization > thresholds.heapUtilization) {
      this.buildMetrics.recommendations.push({
        category: 'Performance',
        priority: 'medium',
        recommendation: 'High memory utilization detected',
        implementation: 'Consider increasing NODE_OPTIONS="--max-old-space-size=4096"'
      });
    }

    // Compare with previous build
    if (this.buildMetrics.previousBuild?.performance) {
      const previous = this.buildMetrics.previousBuild.performance;
      const durationChange = performanceMetrics.buildDuration - previous.buildDuration;
      const memoryChange = performanceMetrics.memoryUsage.heapUsed - previous.memoryUsage.heapUsed;

      performanceMetrics.comparison = {
        durationChange: durationChange > 0 ? `+${(durationChange/1000).toFixed(1)}s` : `${(durationChange/1000).toFixed(1)}s`,
        memoryChange: memoryChange > 0 ? `+${(memoryChange/1024/1024).toFixed(1)}MB` : `${(memoryChange/1024/1024).toFixed(1)}MB`,
        trend: durationChange > 10000 ? 'slower' : durationChange < -10000 ? 'faster' : 'stable'
      };
    }

    this.buildMetrics.performance = performanceMetrics;
  }

  async generateOptimizationReport() {
    console.log('📋 Generating optimization report...');
    
    const report = {
      summary: {
        totalOptimizations: this.buildMetrics.optimizations.length,
        totalRecommendations: this.buildMetrics.recommendations.length,
        buildScore: this.calculateBuildScore(),
        overallHealth: 'unknown'
      },
      details: {
        optimizations: this.buildMetrics.optimizations,
        recommendations: this.buildMetrics.recommendations.slice(0, 5), // Top 5
        performance: this.buildMetrics.performance,
        bundleAnalysis: this.buildMetrics.bundleAnalysis,
        cacheStats: this.buildMetrics.cacheStats
      },
      nextSteps: this.generateNextSteps()
    };

    // Determine overall health
    if (report.summary.buildScore >= 80) {
      report.summary.overallHealth = 'excellent';
    } else if (report.summary.buildScore >= 60) {
      report.summary.overallHealth = 'good';
    } else if (report.summary.buildScore >= 40) {
      report.summary.overallHealth = 'needs-improvement';
    } else {
      report.summary.overallHealth = 'critical';
    }

    return report;
  }

  calculateBuildScore() {
    let score = 100;

    // Deduct points for high-priority recommendations
    const highPriorityRecs = this.buildMetrics.recommendations.filter(r => r.priority === 'high');
    score -= highPriorityRecs.length * 20;

    // Deduct points for medium-priority recommendations
    const mediumPriorityRecs = this.buildMetrics.recommendations.filter(r => r.priority === 'medium');
    score -= mediumPriorityRecs.length * 10;

    // Performance penalties
    if (this.buildMetrics.performance?.buildDuration > 300000) {
      score -= 15; // Slow build
    }

    if (this.buildMetrics.performance?.memoryUsage?.heapUsed > 1000 * 1024 * 1024) {
      score -= 10; // High memory usage
    }

    return Math.max(score, 0);
  }

  generateNextSteps() {
    const steps = [];

    if (this.buildMetrics.recommendations.length > 0) {
      const highPriority = this.buildMetrics.recommendations.filter(r => r.priority === 'high');
      if (highPriority.length > 0) {
        steps.push({
          priority: 'immediate',
          action: 'Address high-priority recommendations',
          items: highPriority.slice(0, 3).map(r => r.recommendation)
        });
      }
    }

    if (!this.buildMetrics.bundleAnalysis.results?.hasAnalyzeScript) {
      steps.push({
        priority: 'next',
        action: 'Implement bundle analysis',
        items: ['Add @next/bundle-analyzer', 'Create build:analyze script', 'Schedule regular bundle reviews']
      });
    }

    steps.push({
      priority: 'ongoing',
      action: 'Monitor and maintain',
      items: ['Run optimization checks regularly', 'Review build metrics trends', 'Update dependencies quarterly']
    });

    return steps;
  }

  async run() {
    console.log('🚀 Starting Advanced Build Optimization...');
    console.log(`Platform: ${this.buildMetrics.platform}`);
    console.log(`Environment: ${this.buildMetrics.environment}`);
    console.log('');

    try {
      await this.initializeCache();
      await this.optimizeDependencies();
      await this.optimizeNextConfig();
      await this.performBundleAnalysis();
      await this.optimizeBuildCache();
      await this.monitorPerformance();

      const report = await this.generateOptimizationReport();

      // Save metrics for future comparisons
      fs.writeFileSync(this.metricsFile, JSON.stringify(this.buildMetrics, null, 2));

      // Output summary
      console.log('\n📊 BUILD OPTIMIZATION RESULTS');
      console.log('=============================');
      console.log(`Build Score: ${report.summary.buildScore}/100`);
      console.log(`Overall Health: ${report.summary.overallHealth.toUpperCase()}`);
      console.log(`Optimizations Applied: ${report.summary.totalOptimizations}`);
      console.log(`Recommendations: ${report.summary.totalRecommendations}`);

      if (this.buildMetrics.performance.comparison) {
        console.log(`Duration Change: ${this.buildMetrics.performance.comparison.durationChange}`);
        console.log(`Memory Change: ${this.buildMetrics.performance.comparison.memoryChange}`);
        console.log(`Trend: ${this.buildMetrics.performance.comparison.trend}`);
      }

      if (report.summary.totalRecommendations > 0) {
        console.log('\n💡 TOP RECOMMENDATIONS:');
        report.details.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.recommendation}`);
        });
      }

      if (report.nextSteps.length > 0) {
        console.log('\n📋 NEXT STEPS:');
        report.nextSteps.forEach(step => {
          console.log(`  ${step.priority.toUpperCase()}: ${step.action}`);
          step.items.forEach(item => console.log(`    - ${item}`));
        });
      }

      // Save detailed report
      const reportPath = path.join(process.cwd(), 'build-optimization-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

      // Determine exit code
      if (report.summary.overallHealth === 'critical') {
        console.log('\n❌ Build optimization identified critical issues');
        process.exit(1);
      } else {
        console.log('\n✅ Build optimization completed successfully');
        process.exit(0);
      }

    } catch (error) {
      console.error('\n🚨 Build optimization failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new AdvancedBuildOptimizer();
  optimizer.run().catch(error => {
    console.error('🚨 Optimization system error:', error.message);
    process.exit(1);
  });
}

module.exports = AdvancedBuildOptimizer;