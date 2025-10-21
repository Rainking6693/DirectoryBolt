import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';
import { logger } from './logger';
import SuccessProbabilityCalculator from '../../../lib/ai-services/SuccessProbabilityCalculator';
import DescriptionCustomizer from '../../../lib/ai-services/DescriptionCustomizer';
import AISubmissionOrchestrator from '../../../lib/ai-services/AISubmissionOrchestrator';
import IntelligentRetryAnalyzer from '../../../lib/ai-services/IntelligentRetryAnalyzer';
import AIFormMapper from '../../../lib/ai-services/AIFormMapper';
import SubmissionTimingOptimizer from '../../../lib/ai-services/SubmissionTimingOptimizer';
import ABTestingFramework from '../../../lib/ai-services/ABTestingFramework';
import PerformanceFeedbackLoop from '../../../lib/ai-services/PerformanceFeedbackLoop';
import { HUMANIZATION, randomDelay, humanType, humanClick, solveCaptcha } from './humanization';
import { shouldUseGemini, callGeminiWorker } from './geminiRouter';

export type SubmissionStatus = 'submitted' | 'failed' | 'skipped';

export interface JobPayload {
  id: string;
  customer_id: string;
  business_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  description?: string;
  category?: string;
  directory_limit?: number;
  package_size?: any;
}

interface DirectoryConfig {
  id?: string;
  name: string;
  url: string;
  submissionUrl?: string;
  priority?: number;
  tier?: string | number;
  requiresLogin?: boolean;
  hasCaptcha?: boolean;
  hasAntiBot?: boolean;
  difficulty?: string;
  formMapping?: Record<string, string | string[]>;
  failureRate?: number;
}

export interface SubmissionResult {
  directoryId?: string;
  directoryName: string;
  status: SubmissionStatus;
  message: string;
  timestamp: string;
  aiScore?: number;
  aiCustomized?: boolean;
  viaGemini?: boolean;
  metadata?: Record<string, unknown>;
}

interface ProgressApi {
  updateProgress: (
    jobId: string,
    results: SubmissionResult[],
    extras?: { status?: string; errorMessage?: string }
  ) => Promise<any>;
  completeJob: (jobId: string, summary: { finalStatus?: string; summary?: any; errorMessage?: string }) => Promise<any>;
}

interface BusinessProfile {
  name: string;
  business_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  category: string;
}

interface DirectoryMeta {
  id?: string;
  name: string;
  requiresLogin?: boolean;
  hasCaptcha?: boolean;
  hasAntiBot?: boolean;
  difficulty?: string;
  failureRate?: number;
  selectorCount: number;
}

const DEFAULT_DIR_PATHS = [
  '../complete-directory-database.json',
  '../../../directories/complete-directory-database.json',
  '../../../directories/master-directory-list.json',
  '../../../directories/expanded-master-directory-list-final.json',
  '../../../directories/directory-list.json'
];

const parsedMinDelay = Number.parseInt(process.env.DIRECTORY_DELAY_MIN_MS || '2000', 10);
const parsedMaxDelay = Number.parseInt(process.env.DIRECTORY_DELAY_MAX_MS || '5000', 10);

const MIN_DIRECTORY_DELAY_MS = Number.isFinite(parsedMinDelay) && parsedMinDelay >= 0 ? parsedMinDelay : 2000;
const MAX_DIRECTORY_DELAY_MS =
  Number.isFinite(parsedMaxDelay) && parsedMaxDelay >= MIN_DIRECTORY_DELAY_MS
    ? parsedMaxDelay
    : Math.max(MIN_DIRECTORY_DELAY_MS, 5000);

const AI_PROBABILITY_THRESHOLD = Number.isFinite(Number(process.env.AI_PROBABILITY_THRESHOLD))
  ? Number(process.env.AI_PROBABILITY_THRESHOLD)
  : 0.6;

let probabilityCalculatorInstance: any | null | undefined;
let descriptionCustomizerInstance: any | null | undefined;
let aiOrchestratorInstance: any | null | undefined;
let retryAnalyzerInstance: any | null | undefined;
let formMapperInstance: any | null | undefined;
let timingOptimizerInstance: any | null | undefined;
let abTestingInstance: any | null | undefined;
let feedbackLoopInstance: any | null | undefined;

let probabilityCalculatorInitLogged = false;
let descriptionCustomizerInitLogged = false;
let aiOrchestratorInitLogged = false;
let retryAnalyzerInitLogged = false;
let formMapperInitLogged = false;
let timingOptimizerInitLogged = false;
let abTestingInitLogged = false;
let feedbackLoopInitLogged = false;

function getProbabilityCalculator(): any | null {
  if (probabilityCalculatorInstance !== undefined) {
    return probabilityCalculatorInstance;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!probabilityCalculatorInitLogged) {
      logger.warn('ANTHROPIC_API_KEY not set. Skipping AI probability scoring.');
      probabilityCalculatorInitLogged = true;
    }
    probabilityCalculatorInstance = null;
    return probabilityCalculatorInstance;
  }

  try {
    probabilityCalculatorInstance = new SuccessProbabilityCalculator({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
    logger.info('AI probability calculator initialized', { component: 'ai' });
  } catch (error: any) {
    logger.error('Failed to initialize SuccessProbabilityCalculator', { error: error?.message });
    probabilityCalculatorInstance = null;
  }

  return probabilityCalculatorInstance;
}

function getDescriptionCustomizer(): any | null {
  if (descriptionCustomizerInstance !== undefined) {
    return descriptionCustomizerInstance;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!descriptionCustomizerInitLogged) {
      logger.warn('ANTHROPIC_API_KEY not set. Skipping AI description customization.');
      descriptionCustomizerInitLogged = true;
    }
    descriptionCustomizerInstance = null;
    return descriptionCustomizerInstance;
  }

  try {
    descriptionCustomizerInstance = new DescriptionCustomizer({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
    logger.info('AI description customizer initialized', { component: 'ai' });
  } catch (error: any) {
    logger.error('Failed to initialize DescriptionCustomizer', { error: error?.message });
    descriptionCustomizerInstance = null;
  }

  return descriptionCustomizerInstance;
}

// AI Orchestrator initialization
function getAIOrchestrator(): any | null {
  if (aiOrchestratorInstance !== undefined) {
    return aiOrchestratorInstance;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!aiOrchestratorInitLogged) {
      logger.warn('ANTHROPIC_API_KEY not set. Skipping AI Orchestrator initialization.');
      aiOrchestratorInitLogged = true;
    }
    aiOrchestratorInstance = null;
    return aiOrchestratorInstance;
  }

  try {
    aiOrchestratorInstance = new AISubmissionOrchestrator({
      enableAllAIServices: true,
      maxConcurrentOperations: 50,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
    logger.info('🎼 AI Submission Orchestrator initialized', { component: 'ai-orchestrator' });
  } catch (error: any) {
    logger.error('Failed to initialize AISubmissionOrchestrator', { error: error?.message });
    aiOrchestratorInstance = null;
  }

  return aiOrchestratorInstance;
}

// Retry Analyzer initialization
function getRetryAnalyzer(): any | null {
  if (retryAnalyzerInstance !== undefined) {
    return retryAnalyzerInstance;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!retryAnalyzerInitLogged) {
      logger.warn('ANTHROPIC_API_KEY not set. Skipping Retry Analyzer initialization.');
      retryAnalyzerInitLogged = true;
    }
    retryAnalyzerInstance = null;
    return retryAnalyzerInstance;
  }

  try {
    retryAnalyzerInstance = new IntelligentRetryAnalyzer({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
    logger.info('🔄 Intelligent Retry Analyzer initialized', { component: 'retry-analyzer' });
  } catch (error: any) {
    logger.error('Failed to initialize IntelligentRetryAnalyzer', { error: error?.message });
    retryAnalyzerInstance = null;
  }

  return retryAnalyzerInstance;
}

// Form Mapper initialization
function getFormMapper(): any | null {
  if (formMapperInstance !== undefined) {
    return formMapperInstance;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!formMapperInitLogged) {
      logger.warn('ANTHROPIC_API_KEY not set. Skipping Form Mapper initialization.');
      formMapperInitLogged = true;
    }
    formMapperInstance = null;
    return formMapperInstance;
  }

  try {
    formMapperInstance = new AIFormMapper({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
    logger.info('🗺️  AI Form Mapper initialized', { component: 'form-mapper' });
  } catch (error: any) {
    logger.error('Failed to initialize AIFormMapper', { error: error?.message });
    formMapperInstance = null;
  }

  return formMapperInstance;
}

// Timing Optimizer initialization
function getTimingOptimizer(): any | null {
  if (timingOptimizerInstance !== undefined) {
    return timingOptimizerInstance;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!timingOptimizerInitLogged) {
      logger.warn('ANTHROPIC_API_KEY not set. Skipping Timing Optimizer initialization.');
      timingOptimizerInitLogged = true;
    }
    timingOptimizerInstance = null;
    return timingOptimizerInstance;
  }

  try {
    timingOptimizerInstance = new SubmissionTimingOptimizer({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
    logger.info('⏰ Submission Timing Optimizer initialized', { component: 'timing-optimizer' });
  } catch (error: any) {
    logger.error('Failed to initialize SubmissionTimingOptimizer', { error: error?.message });
    timingOptimizerInstance = null;
  }

  return timingOptimizerInstance;
}

// A/B Testing Framework initialization
function getABTesting(): any | null {
  if (abTestingInstance !== undefined) {
    return abTestingInstance;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!abTestingInitLogged) {
      logger.warn('ANTHROPIC_API_KEY not set. Skipping A/B Testing initialization.');
      abTestingInitLogged = true;
    }
    abTestingInstance = null;
    return abTestingInstance;
  }

  try {
    abTestingInstance = new ABTestingFramework({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
    logger.info('🧪 A/B Testing Framework initialized', { component: 'ab-testing' });
  } catch (error: any) {
    logger.error('Failed to initialize ABTestingFramework', { error: error?.message });
    abTestingInstance = null;
  }

  return abTestingInstance;
}

// Performance Feedback Loop initialization
function getFeedbackLoop(): any | null {
  if (feedbackLoopInstance !== undefined) {
    return feedbackLoopInstance;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!feedbackLoopInitLogged) {
      logger.warn('ANTHROPIC_API_KEY not set. Skipping Feedback Loop initialization.');
      feedbackLoopInitLogged = true;
    }
    feedbackLoopInstance = null;
    return feedbackLoopInstance;
  }

  try {
    feedbackLoopInstance = new PerformanceFeedbackLoop({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
    logger.info('📈 Performance Feedback Loop initialized', { component: 'feedback-loop' });
  } catch (error: any) {
    logger.error('Failed to initialize PerformanceFeedbackLoop', { error: error?.message });
    feedbackLoopInstance = null;
  }

  return feedbackLoopInstance;
}

function loadDirectories(): DirectoryConfig[] {
  const envPath = process.env.DIRECTORY_LIST_PATH;
  if (envPath && fs.existsSync(envPath)) {
    const json = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
    return normalizeDirectories(Array.isArray(json) ? json : json.directories || json.items || []);
  }

  for (const rel of DEFAULT_DIR_PATHS) {
    const abs = path.resolve(__dirname, rel);
    if (fs.existsSync(abs)) {
      try {
        const json = JSON.parse(fs.readFileSync(abs, 'utf-8'));
        return normalizeDirectories(Array.isArray(json) ? json : json.directories || json.items || []);
      } catch (error: any) {
        logger.warn('Failed to parse directory list', { path: abs, error: error?.message });
      }
    }
  }

  throw new Error('No directory list found. Set DIRECTORY_LIST_PATH or ensure directories JSON exists in repo root.');
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDirectoryDelayMs(): number {
  if (MAX_DIRECTORY_DELAY_MS <= MIN_DIRECTORY_DELAY_MS) {
    return MIN_DIRECTORY_DELAY_MS;
  }
  const diff = MAX_DIRECTORY_DELAY_MS - MIN_DIRECTORY_DELAY_MS;
  return MIN_DIRECTORY_DELAY_MS + Math.floor(Math.random() * (diff + 1));
}

function normalizeDirectories(raw: any[]): DirectoryConfig[] {
  const tierLookup: Record<number, string> = { 1: 'starter', 2: 'growth', 3: 'professional', 4: 'enterprise' };
  return (raw || [])
    .filter(Boolean)
    .map((entry) => {
      const submissionUrl = entry.submissionUrl || entry.url;
      const formMapping = normalizeFormMapping(entry.formMapping || entry.formSelectors || {});
      return {
        ...entry,
        url: submissionUrl,
        submissionUrl,
        formMapping,
        priority: Number(entry.priority ?? entry.priorityScore ?? entry.weight ?? 0) || 0,
        failureRate: entry.failureRate ?? entry.failure_rate ?? undefined,
        tier: typeof entry.tier === 'number' ? tierLookup[entry.tier] || entry.tier : entry.tier
      };
    });
}

function normalizeFormMapping(mapping: Record<string, any>): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};
  const fieldAlias: Record<string, string> = {
    business: 'businessName',
    business_name: 'businessName',
    companyName: 'businessName',
    company: 'businessName',
    contactEmail: 'email',
    emailAddress: 'email',
    phoneNumber: 'phone',
    telephone: 'phone',
    websiteUrl: 'website',
    businessWebsite: 'website',
    street: 'address',
    address1: 'address',
    addressLine1: 'address',
    postcode: 'zip',
    postalCode: 'zip',
    zipCode: 'zip',
    summary: 'description',
    about: 'description'
  };

  Object.entries(mapping || {}).forEach(([key, value]) => {
    const targetKey = fieldAlias[key] || key;
    normalized[targetKey] = value;
  });

  return normalized;
}

function buildBusinessProfile(job: JobPayload): BusinessProfile {
  return {
    name: job.business_name || '',
    business_name: job.business_name || '',
    email: job.email || '',
    phone: job.phone || '',
    website: job.website || '',
    address: job.address || '',
    city: job.city || '',
    state: job.state || '',
    zip: job.zip || '',
    description: job.description || '',
    category: job.category || ''
  };
}

function toSelectorList(value: string | string[]): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return value ? [value] : [];
}

function createDirectoryMeta(directory: DirectoryConfig): DirectoryMeta {
  const selectorCount = directory.formMapping
    ? Object.keys(directory.formMapping).reduce((acc, key) => {
        const selectors = directory.formMapping?.[key];
        return acc + toSelectorList(selectors || []).length;
      }, 0)
    : 0;

  return {
    id: directory.id,
    name: directory.name,
    requiresLogin: directory.requiresLogin,
    hasCaptcha: directory.hasCaptcha,
    hasAntiBot: directory.hasAntiBot,
    difficulty: directory.difficulty,
    failureRate: directory.failureRate,
    selectorCount
  };
}

export async function processJob(job: JobPayload, api: ProgressApi) {
  const browser: Browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  const probabilityCalculator = getProbabilityCalculator();
  const descriptionCustomizer = getDescriptionCustomizer();
  const retryAnalyzer = getRetryAnalyzer();
  const formMapper = getFormMapper();
  const timingOptimizer = getTimingOptimizer();
  const abTesting = getABTesting();
  const feedbackLoop = getFeedbackLoop();
  const businessProfile = buildBusinessProfile(job);

  const startTime = Date.now();

  try {
    const allDirs = loadDirectories();
    const processable = allDirs
      .filter((d) => !d.requiresLogin && !d.hasCaptcha)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const limit = Number(job.directory_limit || job.package_size || 0) || computeLimit(job.package_size);
    const selected = processable.slice(0, limit);

    let submitted = 0;
    let failed = 0;
    let skipped = 0;

    for (const directory of selected) {
      const startedAt = new Date().toISOString();
      let aiScore: number | undefined;
      let aiCustomized = false;
      let skipDirectory = false;

      const jobForDirectory: JobPayload = { ...job };
      const directoryMeta = createDirectoryMeta(directory);

      // Check optimal timing for this directory
      if (timingOptimizer) {
        try {
          const timingAnalysis = await timingOptimizer.getOptimalSubmissionTime({
            directoryName: directory.name,
            timezone: 'America/New_York', // Default timezone, can be customized
            currentQueueSize: selected.length
          });
          
          if (!timingAnalysis.isOptimalNow && timingAnalysis.confidence > 0.7) {
            logger.info('Timing not optimal, but continuing (queue processing)', {
              directory: directory.name,
              optimalTime: timingAnalysis.recommendedTime,
              reason: timingAnalysis.reason
            });
            // Note: In a more sophisticated implementation, we could reschedule this job
          }
        } catch (error: any) {
          logger.debug('Timing optimization failed', {
            directory: directory.name,
            error: error?.message
          });
        }
      }

      if (probabilityCalculator) {
        try {
          const probabilityResult = await probabilityCalculator.calculateSuccessProbability({
            business: {
              ...businessProfile
            },
            directory
          });

          if (probabilityResult && typeof probabilityResult.probability === 'number') {
            aiScore = probabilityResult.probability;
            logger.debug('AI probability score computed', {
              jobId: job.id,
              directory: directory.name,
              score: aiScore
            });

            if (typeof aiScore === 'number' && aiScore < AI_PROBABILITY_THRESHOLD) {
              skipDirectory = true;
            }
          }
        } catch (error: any) {
          logger.warn('AI probability calculation failed', {
            jobId: job.id,
            directory: directory.name,
            error: error?.message
          });
        }
      }

      const shouldRouteToGemini = shouldUseGemini(directoryMeta, aiScore);

      if (skipDirectory && !shouldRouteToGemini) {
        const skipResult: SubmissionResult = {
          directoryId: directory.id,
          directoryName: directory.name,
          status: 'skipped',
          message: `Skipped by AI probability (${aiScore !== undefined ? aiScore.toFixed(2) : 'n/a'})`,
          timestamp: startedAt,
          aiScore
        };

        logger.info('Directory skipped due to low AI probability', {
          jobId: job.id,
          directory: directory.name,
          score: aiScore
        });

        await api.updateProgress(job.id, [skipResult], { status: 'in_progress' });
        skipped += 1;
        continue;
      }

      let result: SubmissionResult | null = null;
      let geminiTried = false;

      if (shouldRouteToGemini) {
        geminiTried = true;
        try {
          const geminiResponse = await callGeminiWorker(jobForDirectory, directoryMeta);
          result = {
            directoryId: directory.id,
            directoryName: directory.name,
            status: geminiResponse.success ? 'submitted' : geminiResponse.status ?? 'failed',
            message: geminiResponse.message ?? (geminiResponse.success ? 'Gemini submission successful' : 'Gemini submission failed'),
            timestamp: startedAt,
            aiScore,
            aiCustomized,
            viaGemini: true,
            metadata: geminiResponse.metadata
          };
        } catch (error: any) {
          logger.error('Gemini worker call failed, falling back to Playwright', {
            jobId: job.id,
            directory: directory.name,
            error: error?.message
          });
        }
      }

      if (!result) {
        if (descriptionCustomizer && job.description) {
          try {
            const customizationResult = await descriptionCustomizer.customizeDescription({
              directoryId: directory.id || directory.name,
              businessData: {
                ...businessProfile
              },
              originalDescription: job.description
            });

            const customizedDescription = customizationResult?.primaryCustomization?.description;
            if (customizedDescription && typeof customizedDescription === 'string') {
              jobForDirectory.description = customizedDescription;
              aiCustomized = true;
            }
          } catch (error: any) {
            logger.warn('AI description customization failed', {
              jobId: job.id,
              directory: directory.name,
              error: error?.message
            });
          }
        }

        result = await submitToDirectory(page, directory, jobForDirectory, {
          aiProbability: aiScore,
          aiCustomized
        });
      }

      if (result.status === 'submitted') {
        submitted += 1;
      } else if (result.status === 'failed') {
        failed += 1;
        
        // Use IntelligentRetryAnalyzer to analyze failure and recommend retry strategy
        if (retryAnalyzer) {
          try {
            const retryRecommendation = await retryAnalyzer.analyzeFailureAndRecommendRetry({
              jobId: job.id,
              directoryName: directory.name,
              failureReason: result.message,
              attemptNumber: (job as any).retry_count || 0,
              businessData: businessProfile
            });
            
            logger.info('Retry analysis complete', {
              jobId: job.id,
              directory: directory.name,
              shouldRetry: retryRecommendation?.shouldRetry,
              retryProbability: retryRecommendation?.retryProbability,
              suggestedDelay: retryRecommendation?.suggestedRetryDelay
            });
            
            // Store retry recommendation in result metadata
            if (result.metadata) {
              result.metadata.retryRecommendation = retryRecommendation;
            } else {
              result.metadata = { retryRecommendation };
            }
          } catch (error: any) {
            logger.warn('Retry analysis failed', {
              jobId: job.id,
              directory: directory.name,
              error: error?.message
            });
          }
        }
      } else {
        skipped += 1;
      }

      await api.updateProgress(job.id, [result], {
        status: 'in_progress',
        errorMessage: result.status === 'failed' ? result.message : undefined
      });

      // Record submission result in Performance Feedback Loop
      if (feedbackLoop) {
        try {
          await feedbackLoop.recordSubmission({
            jobId: job.id,
            customerId: job.customer_id,
            directoryId: directory.id || directory.name,
            directoryName: directory.name,
            status: result.status,
            aiProbability: aiScore,
            aiCustomized,
            processingTime: Date.now() - startTime,
            metadata: result.metadata
          });
          
          logger.debug('Submission recorded in feedback loop', {
            jobId: job.id,
            directory: directory.name,
            status: result.status
          });
        } catch (error: any) {
          logger.warn('Failed to record in feedback loop', {
            jobId: job.id,
            error: error?.message
          });
        }
      }

      if (!result.viaGemini || geminiTried) {
        await randomDelay({ min: MIN_DIRECTORY_DELAY_MS, max: MAX_DIRECTORY_DELAY_MS });
      } else {
        await wait(getDirectoryDelayMs());
      }
    }

    const summary = {
      finalStatus: 'complete',
      summary: {
        totalDirectories: selected.length,
        successfulSubmissions: submitted,
        failedSubmissions: failed,
        skippedSubmissions: skipped,
        processingTimeSeconds: Math.round((Date.now() - startTime) / 1000)
      }
    };

    await api.completeJob(job.id, summary);
  } finally {
    await browser.close();
  }
}

function computeLimit(pkg: any): number {
  const value = String(pkg || '').toLowerCase();
  const map: Record<string, number> = {
    starter: 50,
    growth: 150,
    professional: 300,
    enterprise: 500,
    pro: 500
  };
  return map[value] || Number(pkg) || 50;
}

export async function submitToDirectory(
  page: Page,
  directory: DirectoryConfig,
  job: JobPayload,
  options?: { aiProbability?: number; aiCustomized?: boolean }
): Promise<SubmissionResult> {
  const started = new Date().toISOString();

  try {
    await page.goto(directory.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await randomDelay(HUMANIZATION.delays.afterPageLoad);

    const captchaOk = await solveCaptcha(page);
    if (!captchaOk) {
      return {
        directoryId: directory.id,
        directoryName: directory.name,
        status: 'failed',
        message: 'CAPTCHA could not be solved',
        timestamp: started,
        aiScore: options?.aiProbability,
        aiCustomized: options?.aiCustomized
      };
    }

    let filledCount = 0;
    let useAIMapping = false;

    // If no form mapping exists, use AIFormMapper to detect fields
    if (!directory.formMapping || Object.keys(directory.formMapping).length === 0) {
      const formMapper = getFormMapper();
      if (formMapper) {
        try {
          logger.info('Using AI Form Mapper for unmapped directory', {
            directory: directory.name
          });
          
          const pageHtml = await page.content();
          const aiFormMapping = await formMapper.analyzeForm({
            url: directory.url,
            html: pageHtml,
            directoryName: directory.name
          });
          
          if (aiFormMapping && aiFormMapping.mapping) {
            logger.info('AI Form Mapper detected fields', {
              directory: directory.name,
              fieldsDetected: Object.keys(aiFormMapping.mapping).length,
              confidence: aiFormMapping.overallConfidence
            });
            
            // Convert AI mapping to directory.formMapping format
            directory.formMapping = {};
            for (const [fieldName, fieldData] of Object.entries(aiFormMapping.mapping)) {
              if ((fieldData as any).confidence > 0.7 && (fieldData as any).selector) {
                directory.formMapping[fieldName] = (fieldData as any).selector;
              }
            }
            useAIMapping = true;
          }
        } catch (error: any) {
          logger.warn('AI Form Mapper failed, will use manual approach', {
            directory: directory.name,
            error: error?.message
          });
        }
      }
    }

    if (directory.formMapping) {
      for (const [fieldName, selectors] of Object.entries(directory.formMapping)) {
        const value = pickField(job, fieldName);
        if (typeof value === 'string' && value.length) {
          const selectorList = toSelectorList(selectors);

          let filled = false;
          for (const selector of selectorList) {
            try {
              await page.fill(selector, '');
            } catch (error) {
              logger.debug('Initial clear failed', {
                directory: directory.name,
                field: fieldName,
                selector,
                error: (error as any)?.message
              });
            }

            try {
              const typed = await humanType(page, selector, value);
              if (typed) {
                filled = true;
                filledCount += 1;
                await randomDelay(HUMANIZATION.delays.betweenFields);
                break;
              }
            } catch (error) {
              logger.debug('Human typing failed', {
                directory: directory.name,
                field: fieldName,
                selector,
                error: (error as any)?.message
              });
            }

            if (!filled) {
              try {
                await page.fill(selector, value, { timeout: 5000 });
                filled = true;
                filledCount += 1;
                await randomDelay(HUMANIZATION.delays.betweenFields);
                break;
              } catch (error) {
                logger.debug('Fallback fill failed', {
                  directory: directory.name,
                  field: fieldName,
                  selector,
                  error: (error as any)?.message
                });
              }
            }
          }

          if (!filled) {
            logger.info('No selector worked for field', {
              directory: directory.name,
              field: fieldName
            });
          }
        }
      }
    }

    await randomDelay(HUMANIZATION.delays.beforeSubmit);

    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Create")',
      'button:has-text("Add")'
    ];

    let submittedClicked = false;
    for (const selector of submitSelectors) {
      submittedClicked = await humanClick(page, selector);
      if (submittedClicked) break;
    }

    if (!submittedClicked) {
      for (const selector of submitSelectors) {
        const element = await page.$(selector);
        if (element) {
          await element.click({ timeout: 10000 }).catch(() => undefined);
          submittedClicked = true;
          break;
        }
      }
    }

    await page.waitForTimeout(2000);

    const content = (await page.content()).toLowerCase();
    const success = /success|thank you|received|submitted/.test(content);

    return {
      directoryId: directory.id,
      directoryName: directory.name,
      status: success ? 'submitted' : 'failed',
      message: success ? 'OK' : 'No success indicator',
      timestamp: started,
      aiScore: options?.aiProbability,
      aiCustomized: options?.aiCustomized,
      metadata: {
        filledFields: filledCount,
        submittedClicked
      }
    };
  } catch (error: any) {
    return {
      directoryId: directory.id,
      directoryName: directory.name,
      status: 'failed',
      message: error?.message || 'Navigation/submit error',
      timestamp: started,
      aiScore: options?.aiProbability,
      aiCustomized: options?.aiCustomized
    };
  }
}

function pickField(job: JobPayload, field: string): string | undefined {
  const normalized = field.toLowerCase();
  const map: Record<string, any> = {
    business_name: job.business_name,
    businessname: job.business_name,
    businessName: job.business_name,
    email: job.email,
    phone: job.phone,
    website: job.website,
    address: job.address,
    city: job.city,
    state: job.state,
    zip: job.zip,
    zipcode: job.zip,
    postalcode: job.zip,
    description: job.description,
    category: job.category
  };

  if (field in map) return map[field];
  if (normalized in map) return map[normalized];
  return map[field as keyof typeof map];
}
