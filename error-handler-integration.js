/**
 * Error Handler Integration Module
 * Integrates Enhanced Error Handler with existing AutoBolt components
 * 
 * This module provides seamless integration between the new enhanced error handling
 * system and existing AutoBolt components, ensuring backward compatibility while
 * adding advanced error recovery capabilities.
 */

class ErrorHandlerIntegration {
    constructor() {
        this.enhancedErrorHandler = null;
        this.legacyErrorHandler = null;
        this.integrationConfig = {
            enableEnhancedHandling: true,
            fallbackToLegacy: true,
            enableErrorHybridization: true,
            enableMetricsCollection: true,
            enableProgressIntegration: true
        };
        
        this.componentIntegrations = new Map();
        this.errorMappings = new Map();
        this.metrics = {
            enhancedHandlerCalls: 0,
            legacyHandlerCalls: 0,
            hybridRecoveries: 0,
            integrationFailures: 0
        };
    }

    /**
     * Initialize integration system
     */
    async initialize() {
        console.log('🔗 Initializing Error Handler Integration...');
        
        try {
            // Initialize enhanced error handler
            this.enhancedErrorHandler = new EnhancedErrorHandler({
                baseTimeout: 30000,
                maxTimeout: 300000,
                maxRetries: 5,
                progressPersistenceEnabled: true,
                userFriendlyErrors: true,
                enableAnalytics: true
            });
            
            // Initialize legacy error handler if exists
            if (typeof ErrorHandlerV2 !== 'undefined') {
                this.legacyErrorHandler = new ErrorHandlerV2();
                await this.legacyErrorHandler.initialize();
            }
            
            // Setup component integrations
            await this.setupComponentIntegrations();
            
            // Setup error mappings
            this.setupErrorMappings();
            
            console.log('✅ Error Handler Integration initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Error Handler Integration:', error);
            throw error;
        }
    }

    /**
     * Main error handling entry point for all components
     */
    async handleError(error, context = {}, componentName = 'unknown') {
        console.log(`🚨 Integrated error handling for ${componentName}: ${error.message}`);
        
        try {
            // Determine handling strategy
            const strategy = this.determineHandlingStrategy(error, context, componentName);
            
            let result;
            switch (strategy) {
                case 'enhanced_only':
                    result = await this.handleWithEnhanced(error, context);
                    this.metrics.enhancedHandlerCalls++;
                    break;
                    
                case 'legacy_only':
                    result = await this.handleWithLegacy(error, context);
                    this.metrics.legacyHandlerCalls++;
                    break;
                    
                case 'hybrid':
                    result = await this.handleWithHybrid(error, context);
                    this.metrics.hybridRecoveries++;
                    break;
                    
                default:
                    result = await this.handleWithEnhanced(error, context);
                    this.metrics.enhancedHandlerCalls++;
            }
            
            // Update component-specific metrics
            this.updateComponentMetrics(componentName, result);
            
            return result;
            
        } catch (integrationError) {
            console.error('❌ Integration error handling failed:', integrationError);
            this.metrics.integrationFailures++;
            
            // Fallback to basic error handling
            return {
                success: false,
                errorType: 'integration_failure',
                userMessage: 'Error handling system encountered an issue. Please try again.',
                requiresManualIntervention: true
            };
        }
    }

    /**
     * Content script error handling integration
     */
    async handleContentScriptError(error, context = {}) {
        const enhancedContext = {
            ...context,
            componentName: 'content_script',
            url: window.location?.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        };
        
        return await this.handleError(error, enhancedContext, 'content_script');
    }

    /**
     * Background script error handling integration
     */
    async handleBackgroundError(error, context = {}) {
        const enhancedContext = {
            ...context,
            componentName: 'background_script',
            extensionId: chrome.runtime?.id,
            timestamp: Date.now()
        };
        
        return await this.handleError(error, enhancedContext, 'background_script');
    }

    /**
     * Queue processor error handling integration
     */
    async handleQueueProcessorError(error, queueEntry, context = {}) {
        const enhancedContext = {
            ...context,
            componentName: 'queue_processor',
            queueId: queueEntry?.id,
            customerId: queueEntry?.fields?.customer_id,
            packageType: queueEntry?.fields?.package_type,
            directoryCount: queueEntry?.fields?.selected_directories?.length,
            processingStage: context.stage || 'unknown',
            timestamp: Date.now()
        };
        
        const result = await this.handleError(error, enhancedContext, 'queue_processor');
        
        // If recovery successful, allow queue processor to continue
        if (result.success) {
            return {
                ...result,
                continueProcessing: true,
                updatedContext: enhancedContext
            };
        }
        
        // If manual intervention required, pause queue processing
        if (result.requiresManualIntervention) {
            return {
                ...result,
                pauseProcessing: true,
                escalateToHuman: true
            };
        }
        
        return result;
    }

    /**
     * Directory form filler error handling integration
     */
    async handleFormFillerError(error, directory, businessData, context = {}) {
        const enhancedContext = {
            ...context,
            componentName: 'form_filler',
            directoryId: directory?.id,
            directoryName: directory?.fields?.directory_name,
            directoryUrl: directory?.fields?.submission_url,
            businessName: businessData?.business_name,
            formFields: businessData ? Object.keys(businessData) : [],
            timestamp: Date.now()
        };
        
        return await this.handleError(error, enhancedContext, 'form_filler');
    }

    /**
     * Package manager error handling integration
     */
    async handlePackageManagerError(error, packageInfo, context = {}) {
        const enhancedContext = {
            ...context,
            componentName: 'package_manager',
            packageType: packageInfo?.type,
            customerId: packageInfo?.customerId,
            directoryLimit: packageInfo?.directoryLimit,
            timestamp: Date.now()
        };
        
        return await this.handleError(error, enhancedContext, 'package_manager');
    }

    /**
     * Airtable connector error handling integration
     */
    async handleAirtableError(error, operation, recordId, context = {}) {
        const enhancedContext = {
            ...context,
            componentName: 'airtable_connector',
            operation: operation,
            recordId: recordId,
            timestamp: Date.now()
        };
        
        // Special handling for Airtable rate limits
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
            return await this.enhancedErrorHandler.handleRateLimiting(error, enhancedContext);
        }
        
        return await this.handleError(error, enhancedContext, 'airtable_connector');
    }

    /**
     * Determine optimal handling strategy
     */
    determineHandlingStrategy(error, context, componentName) {
        // Always use enhanced handler for network/timeout errors
        if (this.isNetworkError(error)) {
            return 'enhanced_only';
        }
        
        // Use enhanced handler for user experience critical errors
        if (this.isUserExperienceCritical(error)) {
            return 'enhanced_only';
        }
        
        // Use hybrid approach for complex scenarios
        if (this.integrationConfig.enableErrorHybridization && 
            this.requiresHybridHandling(error, context)) {
            return 'hybrid';
        }
        
        // Default to enhanced handler
        return this.integrationConfig.enableEnhancedHandling ? 'enhanced_only' : 'legacy_only';
    }

    /**
     * Handle error with enhanced handler
     */
    async handleWithEnhanced(error, context) {
        try {
            return await this.enhancedErrorHandler.handleError(error, context);
        } catch (enhancedError) {
            console.error('❌ Enhanced handler failed:', enhancedError);
            
            if (this.integrationConfig.fallbackToLegacy && this.legacyErrorHandler) {
                console.log('🔄 Falling back to legacy handler...');
                return await this.handleWithLegacy(error, context);
            }
            
            throw enhancedError;
        }
    }

    /**
     * Handle error with legacy handler
     */
    async handleWithLegacy(error, context) {
        if (!this.legacyErrorHandler) {
            return {
                success: false,
                errorType: 'no_legacy_handler',
                userMessage: 'Legacy error handler not available',
                requiresManualIntervention: true
            };
        }
        
        try {
            // Convert context to legacy format
            const legacyContext = this.convertToLegacyContext(context);
            const errorType = this.mapToLegacyErrorType(error);
            
            return await this.legacyErrorHandler.handleError(errorType, error, legacyContext);
            
        } catch (legacyError) {
            console.error('❌ Legacy handler failed:', legacyError);
            throw legacyError;
        }
    }

    /**
     * Handle error with hybrid approach
     */
    async handleWithHybrid(error, context) {
        console.log('🔀 Using hybrid error handling approach...');
        
        try {
            // Try enhanced handler first
            const enhancedResult = await this.enhancedErrorHandler.handleError(error, context);
            
            // If enhanced handler succeeds, return result
            if (enhancedResult.success) {
                return {
                    ...enhancedResult,
                    handlingMethod: 'enhanced_primary'
                };
            }
            
            // If enhanced handler fails but has useful recovery data, combine with legacy approach
            if (this.legacyErrorHandler && !enhancedResult.requiresManualIntervention) {
                console.log('🔄 Enhanced failed, trying legacy with enhanced context...');
                
                const hybridContext = {
                    ...context,
                    enhancedAttempts: enhancedResult.attempts,
                    enhancedStrategy: enhancedResult.errorType,
                    preservedProgress: enhancedResult.preservedProgress
                };
                
                const legacyResult = await this.handleWithLegacy(error, hybridContext);
                
                return {
                    ...legacyResult,
                    handlingMethod: 'hybrid',
                    enhancedData: enhancedResult,
                    preservedProgress: enhancedResult.preservedProgress || legacyResult.preservedProgress
                };
            }
            
            // Return enhanced result as final attempt
            return {
                ...enhancedResult,
                handlingMethod: 'enhanced_final'
            };
            
        } catch (hybridError) {
            console.error('❌ Hybrid handling failed:', hybridError);
            return {
                success: false,
                errorType: 'hybrid_failure',
                userMessage: 'Both error handling systems encountered issues',
                requiresManualIntervention: true,
                handlingMethod: 'hybrid_failed'
            };
        }
    }

    /**
     * Setup component integrations
     */
    async setupComponentIntegrations() {
        console.log('🔧 Setting up component integrations...');
        
        // Content Script Integration
        this.componentIntegrations.set('content_script', {
            errorTypes: ['form_error', 'selector_error', 'injection_error'],
            specialHandling: 'form_focused',
            progressTracking: true
        });
        
        // Background Script Integration
        this.componentIntegrations.set('background_script', {
            errorTypes: ['message_error', 'storage_error', 'permission_error'],
            specialHandling: 'system_level',
            progressTracking: false
        });
        
        // Queue Processor Integration
        this.componentIntegrations.set('queue_processor', {
            errorTypes: ['processing_error', 'batch_error', 'timeout_error'],
            specialHandling: 'queue_management',
            progressTracking: true
        });
        
        // Form Filler Integration
        this.componentIntegrations.set('form_filler', {
            errorTypes: ['field_error', 'validation_error', 'submission_error'],
            specialHandling: 'form_recovery',
            progressTracking: true
        });
        
        console.log('✅ Component integrations setup complete');
    }

    /**
     * Setup error mappings between systems
     */
    setupErrorMappings() {
        // Map enhanced error types to legacy error types
        this.errorMappings.set('NETWORK_TIMEOUT', 'TIMEOUT_ERROR');
        this.errorMappings.set('NETWORK_OFFLINE', 'NETWORK_ERROR');
        this.errorMappings.set('RATE_LIMITED', 'RATE_LIMIT_ERROR');
        this.errorMappings.set('CAPTCHA_DETECTED', 'CAPTCHA_ERROR');
        this.errorMappings.set('FORM_STRUCTURE_CHANGED', 'FORM_ERROR');
        this.errorMappings.set('DIRECTORY_UNAVAILABLE', 'API_ERROR');
        this.errorMappings.set('USER_INTERRUPTION', 'USER_ERROR');
        this.errorMappings.set('AUTHENTICATION_FAILED', 'AUTH_ERROR');
        this.errorMappings.set('ANTI_BOT_DETECTED', 'ANTI_BOT_ERROR');
        this.errorMappings.set('VALIDATION_ERROR', 'VALIDATION_ERROR');
    }

    /**
     * Error classification helpers
     */
    isNetworkError(error) {
        const message = error.message?.toLowerCase() || '';
        return message.includes('timeout') ||
               message.includes('network') ||
               message.includes('connection') ||
               message.includes('dns') ||
               !navigator.onLine;
    }

    isUserExperienceCritical(error) {
        const message = error.message?.toLowerCase() || '';
        return message.includes('captcha') ||
               message.includes('rate limit') ||
               message.includes('progress') ||
               message.includes('interrupted');
    }

    requiresHybridHandling(error, context) {
        return context.componentName === 'queue_processor' ||
               context.packageType === 'Enterprise' ||
               context.retryAttempts > 2;
    }

    /**
     * Context conversion helpers
     */
    convertToLegacyContext(context) {
        return {
            packageType: context.packageType || 'Starter',
            queueId: context.queueId,
            customerId: context.customerId,
            businessName: context.businessName || context.business_name,
            directoryCount: context.directoryCount,
            processingStage: context.processingStage || context.stage
        };
    }

    mapToLegacyErrorType(error) {
        const message = error.message?.toLowerCase() || '';
        
        if (message.includes('timeout')) return 'TIMEOUT_ERROR';
        if (message.includes('network')) return 'NETWORK_ERROR';
        if (message.includes('rate')) return 'RATE_LIMIT_ERROR';
        if (message.includes('captcha')) return 'CAPTCHA_ERROR';
        if (message.includes('form')) return 'FORM_ERROR';
        if (message.includes('auth')) return 'AUTH_ERROR';
        
        return 'SYSTEM_ERROR';
    }

    /**
     * Component-specific error handling wrappers
     */
    wrapContentScript() {
        if (typeof AutoBoltContentScript !== 'undefined') {
            const originalHandleError = AutoBoltContentScript.prototype.handleError;
            
            AutoBoltContentScript.prototype.handleError = async function(error, context = {}) {
                if (window.errorHandlerIntegration) {
                    return await window.errorHandlerIntegration.handleContentScriptError(error, context);
                }
                
                // Fallback to original method
                return originalHandleError?.call(this, error, context) || { success: false };
            };
        }
    }

    wrapQueueProcessor() {
        if (typeof QueueProcessor !== 'undefined') {
            const originalHandleError = QueueProcessor.prototype.handleError;
            
            QueueProcessor.prototype.handleError = async function(error, context = {}) {
                if (window.errorHandlerIntegration) {
                    return await window.errorHandlerIntegration.handleQueueProcessorError(error, this.currentEntry, context);
                }
                
                return originalHandleError?.call(this, error, context) || { success: false };
            };
        }
    }

    /**
     * Metrics and monitoring
     */
    updateComponentMetrics(componentName, result) {
        const integration = this.componentIntegrations.get(componentName);
        if (integration) {
            if (!integration.metrics) {
                integration.metrics = {
                    totalErrors: 0,
                    successfulRecoveries: 0,
                    failedRecoveries: 0,
                    manualInterventions: 0
                };
            }
            
            integration.metrics.totalErrors++;
            
            if (result.success) {
                integration.metrics.successfulRecoveries++;
            } else if (result.requiresManualIntervention) {
                integration.metrics.manualInterventions++;
            } else {
                integration.metrics.failedRecoveries++;
            }
        }
    }

    /**
     * Get integration metrics
     */
    getIntegrationMetrics() {
        return {
            overall: this.metrics,
            components: Array.from(this.componentIntegrations.entries()).map(([name, config]) => ({
                name,
                config,
                metrics: config.metrics || {}
            })),
            errorMappings: Array.from(this.errorMappings.entries()),
            enhancedHandler: this.enhancedErrorHandler?.getErrorMetrics(),
            timestamp: Date.now()
        };
    }

    /**
     * Shutdown and cleanup
     */
    async shutdown() {
        console.log('🛑 Shutting down Error Handler Integration...');
        
        if (this.enhancedErrorHandler) {
            await this.enhancedErrorHandler.shutdown();
        }
        
        if (this.legacyErrorHandler) {
            await this.legacyErrorHandler.shutdown();
        }
        
        this.componentIntegrations.clear();
        this.errorMappings.clear();
        
        console.log('✅ Error Handler Integration shutdown complete');
    }
}

// Auto-initialize on load
let errorHandlerIntegration = null;

if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        try {
            errorHandlerIntegration = new ErrorHandlerIntegration();
            await errorHandlerIntegration.initialize();
            
            // Wrap existing components
            errorHandlerIntegration.wrapContentScript();
            errorHandlerIntegration.wrapQueueProcessor();
            
            // Make globally available
            window.errorHandlerIntegration = errorHandlerIntegration;
            
            console.log('🎯 Error Handler Integration loaded and ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Error Handler Integration:', error);
        }
    });
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandlerIntegration;
} else if (typeof window !== 'undefined') {
    window.ErrorHandlerIntegration = ErrorHandlerIntegration;
}