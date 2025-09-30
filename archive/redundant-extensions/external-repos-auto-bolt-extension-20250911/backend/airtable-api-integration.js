/**
 * AutoBolt Airtable API Integration
 * RESTful API endpoints for DirectoryBolt website integration
 * 
 * Provides secure endpoints for customer onboarding, queue management,
 * and real-time status tracking with comprehensive error handling.
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const AirtableQueueManager = require('./airtable-queue-manager.js');
const { AIRTABLE_SCHEMA_CONFIG, ENHANCED_SCHEMA } = require('./airtable-schema-enhancement.js');

class AutoBoltAPIServer {
    constructor(config = {}) {
        this.config = {
            port: process.env.PORT || 3000,
            jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            ...config
        };
        
        this.app = express();
        this.queueManager = null;
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                }
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin || this.config.allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP',
                retryAfter: 900
            }
        });
        this.app.use('/api/', limiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`📥 ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check endpoint
        this.app.get('/api/health', this.handleHealthCheck.bind(this));
        
        // Public endpoints (no authentication required)
        this.app.post('/api/customers/register', this.handleCustomerRegistration.bind(this));
        this.app.post('/api/queue/submit', this.handleQueueSubmission.bind(this));
        this.app.get('/api/packages', this.handleGetPackages.bind(this));
        
        // Protected endpoints (require authentication)
        this.app.use('/api/protected', this.authenticateToken.bind(this));
        this.app.get('/api/protected/customers/:customerId', this.handleGetCustomer.bind(this));
        this.app.put('/api/protected/customers/:customerId', this.handleUpdateCustomer.bind(this));
        this.app.get('/api/protected/queue/:customerId', this.handleGetCustomerQueue.bind(this));
        this.app.get('/api/protected/submissions/:customerId', this.handleGetCustomerSubmissions.bind(this));
        
        // Admin endpoints (require admin token)
        this.app.use('/api/admin', this.authenticateAdmin.bind(this));
        this.app.get('/api/admin/queue', this.handleGetAllQueue.bind(this));
        this.app.put('/api/admin/queue/:queueId', this.handleUpdateQueueEntry.bind(this));
        this.app.get('/api/admin/analytics', this.handleGetAnalytics.bind(this));
        this.app.get('/api/admin/logs', this.handleGetLogs.bind(this));
        
        // Webhook endpoints
        this.app.post('/api/webhooks/directory-response', this.handleDirectoryWebhook.bind(this));
        
        // Error handling
        this.app.use(this.errorHandler.bind(this));
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found'
            });
        });
    }

    /**
     * Initialize the API server
     */
    async initialize() {
        try {
            console.log('🚀 Initializing AutoBolt API Server...');
            
            // Initialize queue manager
            this.queueManager = new AirtableQueueManager();
            await this.queueManager.initialize();
            
            console.log('✅ API Server initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize API Server:', error);
            throw error;
        }
    }

    /**
     * Start the server
     */
    async start() {
        await this.initialize();
        
        this.server = this.app.listen(this.config.port, () => {
            console.log(`🌐 AutoBolt API Server running on port ${this.config.port}`);
        });
        
        return this.server;
    }

    /**
     * Stop the server
     */
    async stop() {
        if (this.queueManager) {
            this.queueManager.stop();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        console.log('✅ API Server stopped');
    }

    // ==================== ROUTE HANDLERS ====================

    /**
     * Health check endpoint
     */
    async handleHealthCheck(req, res) {
        try {
            const queueStatus = this.queueManager ? 'running' : 'stopped';
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                services: {
                    queue: queueStatus,
                    airtable: 'connected'
                }
            };
            
            res.json(health);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Health check failed',
                details: error.message
            });
        }
    }

    /**
     * Customer registration endpoint
     */
    async handleCustomerRegistration(req, res) {
        try {
            const {
                firstName,
                lastName,
                email,
                phone,
                businessName,
                businessWebsite,
                businessCategory,
                packageType
            } = req.body;

            // Validate required fields
            if (!firstName || !lastName || !email || !packageType) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    required: ['firstName', 'lastName', 'email', 'packageType']
                });
            }

            // Validate package type
            const validPackages = ['Starter', 'Growth', 'Professional', 'Enterprise'];
            if (!validPackages.includes(packageType)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid package type',
                    validPackages
                });
            }

            // Check if customer already exists
            const existingCustomer = await this.findCustomerByEmail(email);
            if (existingCustomer) {
                return res.status(409).json({
                    success: false,
                    error: 'Customer with this email already exists'
                });
            }

            // Get package configuration
            const packageConfig = await this.getPackageConfig(packageType);
            
            // Create customer record
            const customerId = uuidv4();
            const customerData = {
                customer_id: customerId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || '',
                business_name: businessName || '',
                business_website: businessWebsite || '',
                business_category: businessCategory || '',
                package_type: packageType,
                purchase_date: new Date().toISOString().split('T')[0],
                subscription_status: 'Active',
                total_directories_allocated: packageConfig?.directory_limit || 50,
                directories_completed: 0,
                customer_status: 'Onboarding',
                priority_level: packageConfig?.priority_level || 4,
                onboarding_completed: false
            };

            const customer = await this.createAirtableRecord('Customers', customerData);

            // Generate access token
            const token = this.generateToken({
                customerId: customer.id,
                email: email,
                packageType: packageType
            });

            res.status(201).json({
                success: true,
                message: 'Customer registered successfully',
                data: {
                    customerId: customer.id,
                    email: email,
                    packageType: packageType,
                    directoriesAllocated: customerData.total_directories_allocated,
                    token: token
                }
            });

        } catch (error) {
            console.error('❌ Customer registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed',
                details: error.message
            });
        }
    }

    /**
     * Queue submission endpoint
     */
    async handleQueueSubmission(req, res) {
        try {
            const {
                customerId,
                businessName,
                businessWebsite,
                businessEmail,
                businessPhone,
                businessAddress,
                businessCategory,
                businessDescription,
                selectedDirectories
            } = req.body;

            // Validate required fields
            if (!customerId || !businessName || !businessWebsite || !selectedDirectories?.length) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    required: ['customerId', 'businessName', 'businessWebsite', 'selectedDirectories']
                });
            }

            // Verify customer exists and is active
            const customer = await this.getAirtableRecord('Customers', customerId);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found'
                });
            }

            if (customer.fields.subscription_status !== 'Active') {
                return res.status(403).json({
                    success: false,
                    error: 'Customer subscription is not active',
                    status: customer.fields.subscription_status
                });
            }

            // Check directory limits
            const remainingDirectories = customer.fields.directories_remaining || 0;
            if (selectedDirectories.length > remainingDirectories) {
                return res.status(403).json({
                    success: false,
                    error: 'Requested directories exceed remaining allocation',
                    requested: selectedDirectories.length,
                    remaining: remainingDirectories
                });
            }

            // Create queue entry
            const queueData = {
                customer_id: [customerId],
                business_name: businessName,
                business_website: businessWebsite,
                business_email: businessEmail || '',
                business_phone: businessPhone || '',
                business_address: businessAddress || '',
                business_category: businessCategory || '',
                business_description: businessDescription || '',
                package_type: [await this.getPackageRecordId(customer.fields.package_type)],
                selected_directories: selectedDirectories,
                queue_status: 'Pending',
                submission_source: 'DirectoryBolt Website'
            };

            const queueEntry = await this.createAirtableRecord('Queue', queueData);

            res.status(201).json({
                success: true,
                message: 'Queue entry created successfully',
                data: {
                    queueId: queueEntry.id,
                    status: 'Pending',
                    directoriesRequested: selectedDirectories.length,
                    estimatedCompletion: this.calculateEstimatedCompletion(
                        customer.fields.package_type,
                        selectedDirectories.length
                    )
                }
            });

        } catch (error) {
            console.error('❌ Queue submission error:', error);
            res.status(500).json({
                success: false,
                error: 'Queue submission failed',
                details: error.message
            });
        }
    }

    /**
     * Get packages endpoint
     */
    async handleGetPackages(req, res) {
        try {
            const response = await this.makeAirtableRequest('GET', 'Packages', {
                filterByFormula: '{is_active} = TRUE()',
                sort: [{ field: 'priority_level', direction: 'asc' }]
            });

            const packages = response.records.map(record => ({
                id: record.fields.package_id,
                name: record.fields.package_name,
                directoryLimit: record.fields.directory_limit,
                priceMonthly: record.fields.price_monthly,
                priceAnnual: record.fields.price_annual,
                processingSpeed: record.fields.processing_speed,
                supportLevel: record.fields.support_level,
                features: record.fields.features_included?.split('\n') || []
            }));

            res.json({
                success: true,
                data: packages
            });

        } catch (error) {
            console.error('❌ Get packages error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch packages',
                details: error.message
            });
        }
    }

    /**
     * Get customer endpoint
     */
    async handleGetCustomer(req, res) {
        try {
            const { customerId } = req.params;
            
            const customer = await this.getAirtableRecord('Customers', customerId);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found'
                });
            }

            res.json({
                success: true,
                data: {
                    customerId: customer.id,
                    firstName: customer.fields.first_name,
                    lastName: customer.fields.last_name,
                    email: customer.fields.email,
                    phone: customer.fields.phone,
                    businessName: customer.fields.business_name,
                    businessWebsite: customer.fields.business_website,
                    packageType: customer.fields.package_type,
                    subscriptionStatus: customer.fields.subscription_status,
                    directoriesAllocated: customer.fields.total_directories_allocated,
                    directoriesCompleted: customer.fields.directories_completed,
                    directoriesRemaining: customer.fields.directories_remaining,
                    customerStatus: customer.fields.customer_status,
                    lastActivity: customer.fields.last_activity,
                    onboardingCompleted: customer.fields.onboarding_completed
                }
            });

        } catch (error) {
            console.error('❌ Get customer error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch customer',
                details: error.message
            });
        }
    }

    /**
     * Get customer queue endpoint
     */
    async handleGetCustomerQueue(req, res) {
        try {
            const { customerId } = req.params;
            
            const filter = `{customer_id} = '${customerId}'`;
            const response = await this.makeAirtableRequest('GET', 'Queue', {
                filterByFormula: filter,
                sort: [{ field: 'date_added', direction: 'desc' }],
                maxRecords: 50
            });

            const queueEntries = response.records.map(record => ({
                queueId: record.id,
                businessName: record.fields.business_name,
                businessWebsite: record.fields.business_website,
                status: record.fields.queue_status,
                dateAdded: record.fields.date_added,
                dateStarted: record.fields.date_started,
                dateCompleted: record.fields.date_completed,
                totalDirectories: record.fields.total_directories,
                completedSubmissions: record.fields.completed_submissions,
                failedSubmissions: record.fields.failed_submissions,
                progressPercentage: record.fields.progress_percentage
            }));

            res.json({
                success: true,
                data: queueEntries
            });

        } catch (error) {
            console.error('❌ Get customer queue error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch customer queue',
                details: error.message
            });
        }
    }

    /**
     * Directory webhook handler
     */
    async handleDirectoryWebhook(req, res) {
        try {
            const { submissionId, directoryName, status, response, confirmationNumber } = req.body;

            if (!submissionId || !status) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required webhook fields'
                });
            }

            // Update submission record
            const updateData = {
                directory_response_date: new Date().toISOString(),
                directory_response: response || '',
                confirmation_number: confirmationNumber || ''
            };

            // Map webhook status to our status
            if (status === 'approved' || status === 'accepted') {
                updateData.submission_status = 'Approved';
            } else if (status === 'rejected' || status === 'declined') {
                updateData.submission_status = 'Rejected';
            }

            await this.updateAirtableRecord('Submissions', submissionId, updateData);

            res.json({
                success: true,
                message: 'Webhook processed successfully'
            });

        } catch (error) {
            console.error('❌ Directory webhook error:', error);
            res.status(500).json({
                success: false,
                error: 'Webhook processing failed',
                details: error.message
            });
        }
    }

    // ==================== AUTHENTICATION ====================

    /**
     * Generate JWT token
     */
    generateToken(payload) {
        return jwt.sign(payload, this.config.jwtSecret, { expiresIn: '30d' });
    }

    /**
     * Authenticate JWT token middleware
     */
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        jwt.verify(token, this.config.jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
            }
            req.user = user;
            next();
        });
    }

    /**
     * Authenticate admin token middleware
     */
    authenticateAdmin(req, res, next) {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({
                success: false,
                error: 'Admin API key required'
            });
        }

        next();
    }

    // ==================== HELPER METHODS ====================

    /**
     * Make Airtable API request
     */
    async makeAirtableRequest(method, tableName, params = {}) {
        const url = `${AIRTABLE_SCHEMA_CONFIG.apiUrl}/${AIRTABLE_SCHEMA_CONFIG.baseId}/${tableName}`;
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_SCHEMA_CONFIG.apiToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (method === 'GET' && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(key, JSON.stringify(item)));
                } else {
                    searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
                }
            });
            url += `?${searchParams.toString()}`;
        } else if (method !== 'GET') {
            options.body = JSON.stringify(params);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * Create Airtable record
     */
    async createAirtableRecord(tableName, data) {
        const response = await this.makeAirtableRequest('POST', tableName, {
            fields: data
        });
        return response;
    }

    /**
     * Get Airtable record
     */
    async getAirtableRecord(tableName, recordId) {
        try {
            return await this.makeAirtableRequest('GET', `${tableName}/${recordId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Update Airtable record
     */
    async updateAirtableRecord(tableName, recordId, data) {
        return await this.makeAirtableRequest('PATCH', `${tableName}/${recordId}`, {
            fields: data
        });
    }

    /**
     * Find customer by email
     */
    async findCustomerByEmail(email) {
        try {
            const filter = `{email} = '${email}'`;
            const response = await this.makeAirtableRequest('GET', 'Customers', {
                filterByFormula: filter,
                maxRecords: 1
            });
            return response.records[0] || null;
        } catch (error) {
            console.error('❌ Find customer error:', error);
            return null;
        }
    }

    /**
     * Get package configuration
     */
    async getPackageConfig(packageType) {
        try {
            const filter = `{package_id} = '${packageType}'`;
            const response = await this.makeAirtableRequest('GET', 'Packages', {
                filterByFormula: filter,
                maxRecords: 1
            });
            return response.records[0]?.fields || null;
        } catch (error) {
            console.error('❌ Get package config error:', error);
            return null;
        }
    }

    /**
     * Calculate estimated completion time
     */
    calculateEstimatedCompletion(packageType, directoryCount) {
        const processingDays = {
            'Enterprise': 1,    // 1 day for white-glove service
            'Professional': 2,  // 2 days for rush service
            'Growth': 3,        // 3 days for priority service
            'Starter': 5        // 5 days for standard service
        };
        
        const days = processingDays[packageType] || 5;
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + days);
        
        return estimatedDate.toISOString().split('T')[0];
    }

    /**
     * Error handler middleware
     */
    errorHandler(error, req, res, next) {
        console.error('❌ API Error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
}

module.exports = AutoBoltAPIServer;