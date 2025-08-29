// 🏃‍♂️ RUN STRIPE DIAGNOSTICS - Single command to run all Stripe debugging tools
// This script orchestrates all debugging tools and provides a unified report

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class StripeDiagnosticsRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      suite_version: '1.0.0',
      execution_summary: {
        total_scripts: 4,
        completed_scripts: 0,
        failed_scripts: 0,
        overall_status: 'PENDING'
      },
      script_results: {},
      final_recommendation: null
    };
  }

  log(level, message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    
    switch (level) {
      case 'SUCCESS':
        console.log(`[${timestamp}] ✅ ${message}`);
        break;
      case 'ERROR':
        console.log(`[${timestamp}] ❌ ${message}`);
        break;
      case 'WARNING':
        console.log(`[${timestamp}] ⚠️  ${message}`);
        break;
      case 'INFO':
        console.log(`[${timestamp}] ℹ️  ${message}`);
        break;
      case 'HEADER':
        console.log(`\n${'='.repeat(70)}`);
        console.log(`[${timestamp}] 🔧 ${message}`);
        console.log(`${'='.repeat(70)}`);
        break;
    }
  }

  async runScript(scriptName, scriptPath, args = []) {
    return new Promise((resolve) => {
      this.log('INFO', `Starting ${scriptName}...`);
      
      const startTime = Date.now();
      const child = spawn('node', [scriptPath, ...args], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          script: scriptName,
          path: scriptPath,
          exit_code: code,
          duration: `${duration}ms`,
          stdout: stdout,
          stderr: stderr,
          success: code === 0,
          timestamp: new Date().toISOString()
        };

        this.results.script_results[scriptName] = result;

        if (code === 0) {
          this.results.execution_summary.completed_scripts++;
          this.log('SUCCESS', `${scriptName} completed successfully (${duration}ms)`);
        } else {
          this.results.execution_summary.failed_scripts++;
          this.log('ERROR', `${scriptName} failed with exit code ${code} (${duration}ms)`);
          if (stderr) {
            console.error(stderr);
          }
        }

        resolve(result);
      });

      child.on('error', (error) => {
        const result = {
          script: scriptName,
          path: scriptPath,
          exit_code: -1,
          error: error.message,
          success: false,
          timestamp: new Date().toISOString()
        };

        this.results.script_results[scriptName] = result;
        this.results.execution_summary.failed_scripts++;
        this.log('ERROR', `${scriptName} failed to start: ${error.message}`);
        resolve(result);
      });
    });
  }

  async runAllDiagnostics() {
    this.log('HEADER', 'STRIPE DIAGNOSTICS SUITE - COMPREHENSIVE ANALYSIS');
    
    const baseUrl = process.argv[2] || 'http://localhost:3000';
    this.results.base_url = baseUrl;
    
    this.log('INFO', `Testing against: ${baseUrl}`);
    this.log('INFO', 'Running 4 diagnostic scripts...');

    // Script execution order (dependencies considered)
    const scripts = [
      {
        name: 'Environment Validation',
        path: './scripts/stripe-environment-validator.js',
        args: []
      },
      {
        name: 'Product Validation',
        path: './scripts/stripe-product-validator.js',
        args: []
      },
      {
        name: 'API Debugging',
        path: './scripts/stripe-api-debugger.js',
        args: [baseUrl]
      },
      {
        name: 'Complete Test Suite',
        path: './scripts/stripe-test-suite.js',
        args: [baseUrl]
      }
    ];

    // Run scripts sequentially to avoid conflicts
    for (const script of scripts) {
      await this.runScript(script.name, script.path, script.args);
    }

    // Generate final analysis
    this.generateFinalAnalysis();
    
    // Display summary
    this.displaySummary();
    
    // Save comprehensive report
    this.saveReport();

    return this.results;
  }

  generateFinalAnalysis() {
    const completed = this.results.execution_summary.completed_scripts;
    const total = this.results.execution_summary.total_scripts;
    const successRate = (completed / total) * 100;

    // Determine overall status
    if (successRate === 100) {
      this.results.execution_summary.overall_status = 'SUCCESS';
    } else if (successRate >= 75) {
      this.results.execution_summary.overall_status = 'PARTIAL_SUCCESS';
    } else if (successRate >= 50) {
      this.results.execution_summary.overall_status = 'MIXED_RESULTS';
    } else {
      this.results.execution_summary.overall_status = 'FAILURE';
    }

    // Extract key information from completed scripts
    const recommendations = [];
    let overallScore = 0;
    let scoreCount = 0;

    // Analyze test suite results (most comprehensive)
    const testSuite = this.results.script_results['Complete Test Suite'];
    if (testSuite && testSuite.success) {
      try {
        // Try to parse the test suite report if it was saved
        const reportPath = path.join(process.cwd(), 'stripe-comprehensive-test-report.json');
        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          overallScore = report.launch_readiness?.score || 0;
          scoreCount++;
          
          if (report.recommendations) {
            recommendations.push(...report.recommendations);
          }
        }
      } catch (error) {
        this.log('WARNING', 'Could not parse test suite results');
      }
    }

    // Analyze individual script outputs for additional insights
    Object.values(this.results.script_results).forEach(result => {
      if (result.success && result.stdout) {
        // Extract success rate patterns from stdout
        const successRateMatch = result.stdout.match(/Success Rate: (\d+)%/);
        if (successRateMatch) {
          overallScore += parseInt(successRateMatch[1]);
          scoreCount++;
        }
      }
    });

    // Calculate average score
    const avgScore = scoreCount > 0 ? Math.round(overallScore / scoreCount) : 0;

    // Generate final recommendation
    let recommendation;
    if (avgScore >= 90) {
      recommendation = {
        status: 'READY_FOR_PRODUCTION',
        message: 'All systems are functioning correctly. Ready for production deployment.',
        next_steps: [
          'Deploy to production environment',
          'Monitor payment flows',
          'Set up automated health checks'
        ],
        confidence: 'HIGH'
      };
    } else if (avgScore >= 80) {
      recommendation = {
        status: 'MINOR_FIXES_NEEDED',
        message: 'System is mostly functional with minor issues to address.',
        next_steps: [
          'Review and fix identified issues',
          'Re-run diagnostics to confirm fixes',
          'Deploy to staging for final testing'
        ],
        confidence: 'MEDIUM'
      };
    } else if (avgScore >= 60) {
      recommendation = {
        status: 'MAJOR_FIXES_NEEDED',
        message: 'Significant issues detected that must be resolved before production.',
        next_steps: [
          'Address all critical and high-priority issues',
          'Review environment configuration',
          'Test individual components',
          'Re-run complete diagnostic suite'
        ],
        confidence: 'LOW'
      };
    } else {
      recommendation = {
        status: 'NOT_READY',
        message: 'Multiple critical issues detected. Extensive fixes required.',
        next_steps: [
          'Review Stripe integration configuration',
          'Verify environment variables',
          'Check Stripe Dashboard setup',
          'Consider seeking technical support'
        ],
        confidence: 'VERY_LOW'
      };
    }

    this.results.final_recommendation = {
      ...recommendation,
      average_score: avgScore,
      recommendations: recommendations.slice(0, 5) // Top 5 recommendations
    };
  }

  displaySummary() {
    const summary = this.results.execution_summary;
    const final = this.results.final_recommendation;

    this.log('HEADER', 'DIAGNOSTIC SUMMARY');
    
    console.log(`📊 Execution Results:`);
    console.log(`   ✅ Completed: ${summary.completed_scripts}/${summary.total_scripts} scripts`);
    console.log(`   ❌ Failed: ${summary.failed_scripts}/${summary.total_scripts} scripts`);
    console.log(`   📈 Success Rate: ${Math.round((summary.completed_scripts / summary.total_scripts) * 100)}%`);
    console.log(`   🎯 Overall Status: ${summary.overall_status}`);

    if (final) {
      console.log(`\n🎯 Final Assessment:`);
      console.log(`   📊 Average Score: ${final.average_score}/100`);
      console.log(`   🚀 Status: ${final.status}`);
      console.log(`   💬 ${final.message}`);
      console.log(`   🔮 Confidence: ${final.confidence}`);

      if (final.next_steps.length > 0) {
        console.log(`\n📋 Next Steps:`);
        final.next_steps.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step}`);
        });
      }

      if (final.recommendations.length > 0) {
        console.log(`\n🔍 Top Recommendations:`);
        final.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. [Priority ${rec.priority}] ${rec.title}`);
        });
      }
    }

    // Display individual script results
    console.log(`\n📝 Script Results:`);
    Object.values(this.results.script_results).forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.script} (${result.duration})`);
    });
  }

  saveReport() {
    const reportPath = path.join(process.cwd(), 'stripe-diagnostics-master-report.json');
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      this.log('SUCCESS', `Master report saved to: ${reportPath}`);
    } catch (error) {
      this.log('ERROR', `Failed to save master report: ${error.message}`);
    }

    // Also create a summary file for quick reference
    const summaryPath = path.join(process.cwd(), 'stripe-diagnostics-summary.txt');
    const summaryContent = `
STRIPE DIAGNOSTICS SUMMARY
Generated: ${this.results.timestamp}
Base URL: ${this.results.base_url || 'N/A'}

EXECUTION RESULTS:
- Completed: ${this.results.execution_summary.completed_scripts}/${this.results.execution_summary.total_scripts}
- Failed: ${this.results.execution_summary.failed_scripts}
- Status: ${this.results.execution_summary.overall_status}

FINAL ASSESSMENT:
- Score: ${this.results.final_recommendation?.average_score || 0}/100
- Status: ${this.results.final_recommendation?.status || 'UNKNOWN'}
- Message: ${this.results.final_recommendation?.message || 'No assessment available'}

NEXT STEPS:
${this.results.final_recommendation?.next_steps?.map(step => `- ${step}`).join('\n') || '- Review detailed reports'}

For detailed analysis, see: stripe-diagnostics-master-report.json
    `;

    try {
      fs.writeFileSync(summaryPath, summaryContent.trim());
      this.log('SUCCESS', `Summary saved to: ${summaryPath}`);
    } catch (error) {
      this.log('ERROR', `Failed to save summary: ${error.message}`);
    }
  }
}

// CLI usage
if (require.main === module) {
  const runner = new StripeDiagnosticsRunner();
  
  runner.runAllDiagnostics()
    .then(results => {
      const exitCode = results.final_recommendation?.average_score >= 80 ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Diagnostics runner failed:', error);
      process.exit(1);
    });
}

module.exports = StripeDiagnosticsRunner;