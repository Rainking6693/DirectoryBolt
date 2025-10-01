/**
 * AutoBolt Airtable Schema Enhancement
 * Comprehensive customer tracking, queue management, and package-based processing
 * 
 * This module defines the enhanced Airtable schema for transforming AutoBolt
 * into a scalable customer service platform with advanced queue management.
 */

// Enhanced Airtable Schema Configuration
const AIRTABLE_SCHEMA_CONFIG = {
    baseId: process.env.AIRTABLE_BASE_ID || 'appZDNMzebkaOkLXo',
    apiToken: process.env.AIRTABLE_API_TOKEN,
    apiUrl: 'https://api.airtable.com/v0'
};

/**
 * ENHANCED TABLE SCHEMAS
 * =====================
 * 
 * 1. Customers - Comprehensive customer management
 * 2. Packages - Package type definitions and limits
 * 3. Queue - Processing queue with priority management
 * 4. Submissions - Individual directory submission tracking
 * 5. Directories - Master directory registry
 * 6. ProcessingLogs - Audit trail and error tracking
 */

const ENHANCED_SCHEMA = {
    
    // TABLE 1: CUSTOMERS - Comprehensive Customer Management
    customers: {
        tableName: 'Customers',
        description: 'Master customer database with package tracking and status management',
        fields: {
            // Primary identification
            customer_id: {
                type: 'singleLineText',
                description: 'Unique customer identifier (UUID)',
                options: { isPrimary: true }
            },
            first_name: {
                type: 'singleLineText',
                description: 'Customer first name (captured from DirectoryBolt)'
            },
            last_name: {
                type: 'singleLineText',
                description: 'Customer last name (captured from DirectoryBolt)'
            },
            email: {
                type: 'email',
                description: 'Primary email address (linked to packages)',
                options: { unique: true }
            },
            
            // Package and subscription management
            package_type: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Starter', color: 'blue' },
                        { name: 'Growth', color: 'green' },
                        { name: 'Professional', color: 'orange' },
                        { name: 'Enterprise', color: 'red' }
                    ]
                }
            },
            purchase_date: {
                type: 'date',
                description: 'Package purchase date'
            },
            subscription_status: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Active', color: 'green' },
                        { name: 'Paused', color: 'yellow' },
                        { name: 'Cancelled', color: 'red' },
                        { name: 'Expired', color: 'gray' }
                    ]
                }
            },
            
            // Directory allocation tracking
            total_directories_allocated: {
                type: 'number',
                description: 'Total directories allocated based on package type'
            },
            directories_completed: {
                type: 'number',
                description: 'Number of directories successfully completed'
            },
            directories_remaining: {
                type: 'formula',
                description: 'Calculated: Allocated - Completed',
                formula: '{total_directories_allocated} - {directories_completed}'
            },
            
            // Customer status and priority
            customer_status: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Onboarding', color: 'blue' },
                        { name: 'Active', color: 'green' },
                        { name: 'Processing', color: 'yellow' },
                        { name: 'On Hold', color: 'orange' },
                        { name: 'Churned', color: 'red' }
                    ]
                }
            },
            priority_level: {
                type: 'number',
                description: 'Priority score (1=Highest/Enterprise, 4=Lowest/Starter)'
            },
            
            // Contact and business information
            phone: { type: 'phoneNumber' },
            business_name: { type: 'singleLineText' },
            business_website: { type: 'url' },
            business_category: { type: 'singleLineText' },
            
            // Timestamps and tracking
            created_date: {
                type: 'createdTime'
            },
            last_modified: {
                type: 'lastModifiedTime'
            },
            last_activity: {
                type: 'date',
                description: 'Last customer activity or submission'
            },
            
            // Notes and internal tracking
            customer_notes: {
                type: 'longText',
                description: 'Internal notes about customer'
            },
            onboarding_completed: {
                type: 'checkbox',
                description: 'Customer onboarding process completed'
            }
        }
    },
    
    // TABLE 2: PACKAGES - Package Configuration and Limits
    packages: {
        tableName: 'Packages',
        description: 'Package types, limits, and configuration settings',
        fields: {
            package_id: {
                type: 'singleLineText',
                description: 'Package identifier (Starter, Growth, Professional, Enterprise)',
                options: { isPrimary: true }
            },
            package_name: {
                type: 'singleLineText',
                description: 'Display name for package'
            },
            directory_limit: {
                type: 'number',
                description: 'Number of directories included (999999 for unlimited)'
            },
            priority_level: {
                type: 'number',
                description: 'Processing priority (1=highest, 4=lowest)'
            },
            processing_speed: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Standard', color: 'gray' },
                        { name: 'Priority', color: 'blue' },
                        { name: 'Rush', color: 'orange' },
                        { name: 'White-glove', color: 'red' }
                    ]
                }
            },
            price_monthly: {
                type: 'currency',
                description: 'Monthly subscription price'
            },
            price_annual: {
                type: 'currency',
                description: 'Annual subscription price'
            },
            features_included: {
                type: 'multilineText',
                description: 'List of features included in package'
            },
            max_concurrent_submissions: {
                type: 'number',
                description: 'Maximum number of simultaneous directory submissions'
            },
            support_level: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Email Support', color: 'gray' },
                        { name: 'Priority Support', color: 'blue' },
                        { name: 'Phone Support', color: 'orange' },
                        { name: 'Dedicated Support', color: 'red' }
                    ]
                }
            },
            is_active: {
                type: 'checkbox',
                description: 'Package is currently available for purchase'
            }
        }
    },
    
    // TABLE 3: QUEUE - Advanced Queue Management System
    queue: {
        tableName: 'Queue',
        description: 'Processing queue with priority management and status tracking',
        fields: {
            queue_id: {
                type: 'autoNumber',
                description: 'Auto-generated queue entry ID',
                options: { isPrimary: true }
            },
            customer_id: {
                type: 'linkedRecord',
                description: 'Link to customer record',
                options: {
                    linkedTableId: 'customers',
                    inverseLinkFieldId: 'queue_entries'
                }
            },
            
            // Business information from DirectoryBolt form
            business_name: {
                type: 'singleLineText',
                description: 'Business name from submission form'
            },
            business_website: {
                type: 'url',
                description: 'Business website URL'
            },
            business_email: {
                type: 'email',
                description: 'Business email address'
            },
            business_phone: {
                type: 'phoneNumber'
            },
            business_address: {
                type: 'multilineText',
                description: 'Complete business address'
            },
            business_category: {
                type: 'singleLineText',
                description: 'Business category/industry'
            },
            business_description: {
                type: 'longText',
                description: 'Business description for directory submissions'
            },
            
            // Package and processing configuration
            package_type: {
                type: 'linkedRecord',
                description: 'Link to package configuration',
                options: {
                    linkedTableId: 'packages'
                }
            },
            selected_directories: {
                type: 'multipleRecordLinks',
                description: 'Directories selected for submission',
                options: {
                    linkedTableId: 'directories'
                }
            },
            
            // Queue status and priority
            queue_status: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Pending', color: 'gray' },
                        { name: 'Processing', color: 'yellow' },
                        { name: 'Completed', color: 'green' },
                        { name: 'Failed', color: 'red' },
                        { name: 'Paused', color: 'orange' },
                        { name: 'Cancelled', color: 'gray' }
                    ]
                }
            },
            priority_score: {
                type: 'formula',
                description: 'Calculated priority based on package type and date',
                formula: 'IF({package_type} = "Enterprise", 1, IF({package_type} = "Professional", 2, IF({package_type} = "Growth", 3, 4)))'
            },
            
            // Timing and scheduling
            date_added: {
                type: 'createdTime'
            },
            date_started: {
                type: 'date',
                description: 'When processing began'
            },
            date_completed: {
                type: 'date',
                description: 'When processing completed'
            },
            estimated_completion: {
                type: 'date',
                description: 'Estimated completion date based on package type'
            },
            
            // Processing tracking
            total_directories: {
                type: 'count',
                description: 'Count of selected directories',
                options: {
                    linkedRecordFieldId: 'selected_directories'
                }
            },
            completed_submissions: {
                type: 'number',
                description: 'Number of successful submissions'
            },
            failed_submissions: {
                type: 'number',
                description: 'Number of failed submissions'
            },
            progress_percentage: {
                type: 'formula',
                description: 'Completion percentage',
                formula: 'ROUND(({completed_submissions} + {failed_submissions}) / {total_directories} * 100, 2)'
            },
            
            // Error handling and notes
            processing_notes: {
                type: 'longText',
                description: 'Processing notes and updates'
            },
            error_messages: {
                type: 'longText',
                description: 'Error messages and troubleshooting info'
            },
            retry_count: {
                type: 'number',
                description: 'Number of retry attempts'
            },
            
            // Additional metadata
            submission_source: {
                type: 'singleSelect',
                description: 'How this queue entry was created',
                options: {
                    choices: [
                        { name: 'DirectoryBolt Website', color: 'blue' },
                        { name: 'Chrome Extension', color: 'green' },
                        { name: 'API Integration', color: 'orange' },
                        { name: 'Manual Entry', color: 'gray' }
                    ]
                }
            },
            assigned_processor: {
                type: 'singleLineText',
                description: 'Which processing instance is handling this'
            }
        }
    },
    
    // TABLE 4: SUBMISSIONS - Individual Directory Submission Tracking
    submissions: {
        tableName: 'Submissions',
        description: 'Detailed tracking of individual directory submissions',
        fields: {
            submission_id: {
                type: 'autoNumber',
                description: 'Auto-generated submission ID',
                options: { isPrimary: true }
            },
            queue_id: {
                type: 'linkedRecord',
                description: 'Link to queue entry',
                options: {
                    linkedTableId: 'queue',
                    inverseLinkFieldId: 'submissions'
                }
            },
            customer_id: {
                type: 'linkedRecord',
                description: 'Link to customer record',
                options: {
                    linkedTableId: 'customers'
                }
            },
            directory_id: {
                type: 'linkedRecord',
                description: 'Link to directory record',
                options: {
                    linkedTableId: 'directories'
                }
            },
            
            // Submission status and tracking
            submission_status: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Queued', color: 'gray' },
                        { name: 'Processing', color: 'yellow' },
                        { name: 'Submitted', color: 'blue' },
                        { name: 'Approved', color: 'green' },
                        { name: 'Rejected', color: 'red' },
                        { name: 'Error', color: 'red' },
                        { name: 'Retry Required', color: 'orange' }
                    ]
                }
            },
            
            // Timing
            submission_date: {
                type: 'createdTime'
            },
            processing_started: {
                type: 'date'
            },
            processing_completed: {
                type: 'date'
            },
            directory_response_date: {
                type: 'date',
                description: 'When directory responded to submission'
            },
            
            // Response and error tracking
            directory_response: {
                type: 'longText',
                description: 'Response received from directory'
            },
            error_details: {
                type: 'longText',
                description: 'Detailed error information'
            },
            retry_count: {
                type: 'number',
                description: 'Number of retry attempts for this submission'
            },
            
            // Submission data
            submitted_data: {
                type: 'longText',
                description: 'JSON of data submitted to directory'
            },
            form_fields_filled: {
                type: 'multilineText',
                description: 'List of form fields that were filled'
            },
            
            // Verification and proof
            screenshot_url: {
                type: 'url',
                description: 'Screenshot of successful submission'
            },
            confirmation_number: {
                type: 'singleLineText',
                description: 'Confirmation number from directory'
            },
            listing_url: {
                type: 'url',
                description: 'URL of created directory listing'
            },
            
            // Performance tracking
            processing_time_seconds: {
                type: 'number',
                description: 'Time taken to complete submission'
            },
            automation_success: {
                type: 'checkbox',
                description: 'Whether automated submission was successful'
            }
        }
    },
    
    // TABLE 5: DIRECTORIES - Enhanced Master Directory Registry
    directories: {
        tableName: 'Directories',
        description: 'Master registry of all available directories with enhanced metadata',
        fields: {
            directory_id: {
                type: 'autoNumber',
                description: 'Auto-generated directory ID',
                options: { isPrimary: true }
            },
            directory_name: {
                type: 'singleLineText',
                description: 'Display name of directory'
            },
            directory_url: {
                type: 'url',
                description: 'Base URL of directory'
            },
            submission_url: {
                type: 'url',
                description: 'Direct URL for business submissions'
            },
            
            // Directory classification
            category: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'General Business', color: 'blue' },
                        { name: 'Local Citations', color: 'green' },
                        { name: 'Industry Specific', color: 'orange' },
                        { name: 'Social Media', color: 'purple' },
                        { name: 'Review Sites', color: 'red' },
                        { name: 'B2B Directories', color: 'yellow' }
                    ]
                }
            },
            industry_focus: {
                type: 'multipleSelects',
                description: 'Industries this directory focuses on'
            },
            geographic_scope: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Global', color: 'blue' },
                        { name: 'National', color: 'green' },
                        { name: 'Regional', color: 'orange' },
                        { name: 'Local', color: 'red' }
                    ]
                }
            },
            
            // Directory quality metrics
            domain_authority: {
                type: 'number',
                description: 'SEO domain authority score'
            },
            monthly_traffic: {
                type: 'number',
                description: 'Estimated monthly traffic'
            },
            submission_difficulty: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Easy', color: 'green' },
                        { name: 'Medium', color: 'yellow' },
                        { name: 'Hard', color: 'orange' },
                        { name: 'Very Hard', color: 'red' }
                    ]
                }
            },
            automation_success_rate: {
                type: 'percent',
                description: 'Success rate of automated submissions'
            },
            
            // Submission requirements
            requires_registration: {
                type: 'checkbox'
            },
            requires_verification: {
                type: 'checkbox'
            },
            has_captcha: {
                type: 'checkbox'
            },
            submission_cost: {
                type: 'currency',
                description: 'Cost to submit (if any)'
            },
            
            // Processing configuration
            is_active: {
                type: 'checkbox',
                description: 'Directory is active for submissions'
            },
            automation_enabled: {
                type: 'checkbox',
                description: 'Automated submission is enabled'
            },
            processing_priority: {
                type: 'number',
                description: 'Processing priority (1=highest)'
            },
            
            // Form configuration
            required_fields: {
                type: 'multilineText',
                description: 'JSON array of required form fields'
            },
            optional_fields: {
                type: 'multilineText',
                description: 'JSON array of optional form fields'
            },
            form_selectors: {
                type: 'longText',
                description: 'CSS selectors for form automation'
            },
            
            // Performance tracking
            total_submissions: {
                type: 'number',
                description: 'Total number of submissions attempted'
            },
            successful_submissions: {
                type: 'number',
                description: 'Number of successful submissions'
            },
            last_submission_date: {
                type: 'date'
            },
            last_success_date: {
                type: 'date'
            },
            
            // Maintenance and updates
            last_verified: {
                type: 'date',
                description: 'Last time directory was verified as working'
            },
            needs_update: {
                type: 'checkbox',
                description: 'Directory needs configuration update'
            },
            notes: {
                type: 'longText',
                description: 'Internal notes about directory'
            }
        }
    },
    
    // TABLE 6: PROCESSING_LOGS - Audit Trail and Error Tracking
    processingLogs: {
        tableName: 'ProcessingLogs',
        description: 'Comprehensive audit trail and error tracking for all system operations',
        fields: {
            log_id: {
                type: 'autoNumber',
                description: 'Auto-generated log entry ID',
                options: { isPrimary: true }
            },
            timestamp: {
                type: 'createdTime'
            },
            
            // Event classification
            log_level: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'INFO', color: 'blue' },
                        { name: 'WARNING', color: 'yellow' },
                        { name: 'ERROR', color: 'red' },
                        { name: 'DEBUG', color: 'gray' },
                        { name: 'SUCCESS', color: 'green' }
                    ]
                }
            },
            event_type: {
                type: 'singleSelect',
                options: {
                    choices: [
                        { name: 'Queue Processing', color: 'blue' },
                        { name: 'Directory Submission', color: 'green' },
                        { name: 'Customer Action', color: 'orange' },
                        { name: 'System Event', color: 'purple' },
                        { name: 'Error Event', color: 'red' },
                        { name: 'API Call', color: 'yellow' }
                    ]
                }
            },
            
            // Related records
            customer_id: {
                type: 'linkedRecord',
                description: 'Related customer (if applicable)',
                options: {
                    linkedTableId: 'customers'
                }
            },
            queue_id: {
                type: 'linkedRecord',
                description: 'Related queue entry (if applicable)',
                options: {
                    linkedTableId: 'queue'
                }
            },
            submission_id: {
                type: 'linkedRecord',
                description: 'Related submission (if applicable)',
                options: {
                    linkedTableId: 'submissions'
                }
            },
            directory_id: {
                type: 'linkedRecord',
                description: 'Related directory (if applicable)',
                options: {
                    linkedTableId: 'directories'
                }
            },
            
            // Event details
            event_summary: {
                type: 'singleLineText',
                description: 'Brief summary of the event'
            },
            event_details: {
                type: 'longText',
                description: 'Detailed description of the event'
            },
            error_message: {
                type: 'longText',
                description: 'Error message (if applicable)'
            },
            stack_trace: {
                type: 'longText',
                description: 'Technical stack trace (if applicable)'
            },
            
            // Processing context
            processor_instance: {
                type: 'singleLineText',
                description: 'Which processor instance generated this log'
            },
            session_id: {
                type: 'singleLineText',
                description: 'Processing session identifier'
            },
            user_agent: {
                type: 'singleLineText',
                description: 'Browser/system information'
            },
            ip_address: {
                type: 'singleLineText',
                description: 'IP address (if applicable)'
            },
            
            // Metrics and performance
            execution_time_ms: {
                type: 'number',
                description: 'Execution time in milliseconds'
            },
            memory_usage_mb: {
                type: 'number',
                description: 'Memory usage in MB'
            },
            
            // Additional metadata
            additional_data: {
                type: 'longText',
                description: 'Additional JSON data related to the event'
            },
            tags: {
                type: 'multipleSelects',
                description: 'Tags for categorizing and filtering logs'
            }
        }
    }
};

// Export schema configuration
module.exports = {
    AIRTABLE_SCHEMA_CONFIG,
    ENHANCED_SCHEMA
};