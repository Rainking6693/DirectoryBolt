# DirectoryBolt Queue Processing API - Phase 2.2 Documentation

## Overview

The Queue Processing API is a comprehensive backend system that handles directory submission workflows, batch processing, VA task management, and automated retry mechanisms. Built with scalability, reliability, and monitoring in mind.

## Architecture

### Core Components

1. **Queue Management System** (`lib/queue-manager.js`)
   - Advanced priority scheduling
   - Rate limiting per subscription tier
   - Predictive capacity planning
   - Real-time system health monitoring

2. **Background Job Processing** (`lib/queue-worker.js`)
   - Redis/Bull Queue integration
   - Browser automation with Puppeteer
   - API integration fallbacks
   - Graceful error handling and retries

3. **Validation & Security** (`lib/queue-validation.js`)
   - Comprehensive input validation
   - Security threat detection
   - Data sanitization
   - Structured error responses

### Database Schema Integration

The API integrates with the enhanced database schema from Phase 2.1:

- `user_submissions` - Core submission tracking
- `batch_submissions` - Bulk operation management
- `verification_actions` - VA task assignment
- `processing_jobs` - Background job tracking
- `queue_activity_log` - Audit trail and analytics

## API Endpoints

### 1. POST /api/queue/add
**Customer enrollment in directory submission queue**

Handles business data validation, directory selection, and subscription tier integration.

#### Request Body
```json
{
  "user_id": "uuid",
  "business_data": {
    "business_name": "string (2-255 chars, required)",
    "business_description": "string (max 2000 chars)",
    "business_url": "url (required)",
    "business_email": "email (required)",
    "business_phone": "string (optional)",
    "business_address": "string (optional)",
    "business_category": "string (optional)"
  },
  "directory_selection": {
    "directory_ids": ["uuid", "uuid"] (1-50 items),
    "priority_level": "integer (1-5, default 3)",
    "target_da_range": {
      "min": "integer (0-100)",
      "max": "integer (0-100)"
    }
  },
  "processing_options": {
    "batch_name": "string (optional)",
    "scheduling": {
      "start_immediately": "boolean (default true)",
      "processing_speed": "slow|normal|fast"
    }
  },
  "subscription_context": {
    "tier": "basic|professional|enterprise",
    "credits_available": "integer",
    "monthly_limit": "integer"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "batch_id": "uuid",
    "queue_summary": {
      "total_directories": 25,
      "estimated_completion_time": "2025-01-15T10:30:00Z",
      "success_rate_estimate": 85
    },
    "subscription_usage": {
      "credits_used": 25,
      "credits_remaining": 475
    }
  }
}
```

#### Rate Limits
- Basic: 50 requests/hour
- Professional: 200 requests/hour  
- Enterprise: 1000 requests/hour

### 2. GET /api/queue/status
**Real-time progress tracking for customers**

Provides batch processing status, ETA calculations, and detailed progress information.

#### Query Parameters
- `batch_id` (uuid, optional)
- `submission_id` (uuid, optional)  
- `user_id` (uuid, required if no batch_id/submission_id)
- `include_details` (boolean, default false)
- `include_timeline` (boolean, default false)
- `include_analytics` (boolean, default false)

#### Response
```json
{
  "success": true,
  "data": {
    "batch_id": "uuid",
    "status": "processing",
    "progress": {
      "percentage": 65,
      "completed_count": 16,
      "processing_count": 4,
      "remaining_count": 5,
      "estimated_completion_time": "2025-01-15T14:30:00Z"
    },
    "statistics": {
      "total": 25,
      "success_rate": 88,
      "average_processing_time_minutes": 12
    }
  }
}
```

### 3. POST /api/queue/process
**Batch processing trigger for automation systems**

Handles queue priority management, browser automation integration, and system-level processing.

#### Request Body
```json
{
  "batch_id": "uuid (optional)",
  "submission_ids": ["uuid"] (optional, max 100),
  "processing_options": {
    "automation_mode": "browser|api|hybrid",
    "concurrent_limit": "integer (1-50)",
    "processing_speed": "slow|normal|fast"
  },
  "system_context": {
    "triggered_by": "admin|scheduler|api|webhook",
    "system_id": "string",
    "priority_reason": "string"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "processing_job_id": "uuid",
    "processing_summary": {
      "total_submissions": 25,
      "estimated_duration_minutes": 45,
      "automation_mode": "browser"
    },
    "monitoring": {
      "status_endpoint": "/api/queue/status?batch_id=...",
      "webhook_url": "/api/webhooks/processing-updates/..."
    }
  }
}
```

### 4. GET /api/queue/pending
**VA task assignment and management**

Retrieves pending verification actions with intelligent prioritization and workload balancing.

#### Query Parameters
- `va_id` (uuid, optional)
- `action_type` (enum, optional): verification_needed, manual_submission, captcha_required, etc.
- `priority` (enum, optional): urgent, high, normal, low
- `assigned_only` (boolean, default false)
- `limit` (integer, 1-100, default 20)
- `deadline_filter` (enum, optional): overdue, today, this_week, this_month

#### Response
```json
{
  "success": true,
  "data": {
    "pending_actions": [
      {
        "id": "uuid",
        "action_details": {
          "type": "captcha_required",
          "priority_score": 8.5,
          "estimated_time": 120,
          "deadline": "2025-01-15T16:00:00Z",
          "is_overdue": false
        },
        "assignment_info": {
          "can_assign_to_me": true,
          "skill_match_percentage": 95,
          "recommended_for_va": true
        },
        "submission_info": {
          "business_name": "Example Corp",
          "directory_name": "Local Business Directory"
        }
      }
    ],
    "workload_summary": {
      "assigned_tasks": 3,
      "recommended_tasks": 7,
      "capacity_percentage": 60,
      "availability_status": "available"
    }
  }
}
```

### 5. POST /api/queue/complete
**Task completion with results tracking**

Handles success/failure tracking, screenshot storage, and customer notifications.

#### Request Body
```json
{
  "submission_id": "uuid (optional)",
  "verification_action_id": "uuid (optional)", 
  "batch_completion": {
    "batch_id": "uuid",
    "submission_results": [
      {
        "submission_id": "uuid",
        "status": "completed_success",
        "result_data": {
          "external_submission_id": "ext_12345",
          "screenshots": ["base64_data"]
        }
      }
    ]
  },
  "completion_data": {
    "status": "completed_success|completed_failed|requires_manual_review",
    "result_data": {
      "processing_time": 180,
      "quality_score": 95,
      "automation_method": "browser|api",
      "manual_notes": "string"
    }
  },
  "va_context": {
    "va_id": "uuid",
    "quality_rating": "integer (1-5)",
    "effort_level": "low|medium|high|very_high"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "completion_id": "uuid",
    "submissions_updated": 5,
    "notifications_sent": 3,
    "processing_summary": {
      "success_count": 4,
      "failure_count": 1,
      "processing_time_total": 900
    },
    "performance_impact": {
      "quality_score": 95,
      "efficiency_rating": 87
    }
  }
}
```

### 6. PUT /api/queue/retry
**Failure recovery and retry mechanisms**

Handles automatic retry scheduling, manual retry triggers, and intelligent failure analysis.

#### Request Body
```json
{
  "submission_id": "uuid (optional)",
  "batch_id": "uuid (optional)",
  "retry_multiple": {
    "submission_ids": ["uuid"],
    "filter_criteria": {
      "failure_type": "string",
      "min_retry_count": 0,
      "failed_after": "2025-01-15T00:00:00Z"
    }
  },
  "retry_config": {
    "retry_type": "automatic|manual|scheduled",
    "retry_delay": 3600,
    "max_retry_attempts": 3,
    "method_override": "browser|api|hybrid"
  },
  "failure_analysis": {
    "analyze_failure": true,
    "root_cause": "string",
    "requires_manual_intervention": false
  },
  "system_context": {
    "initiated_by": "admin|va|scheduler|customer|system",
    "retry_context": "string",
    "business_justification": "string"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "retry_job_id": "uuid",
    "items_scheduled_for_retry": 8,
    "items_escalated": 2,
    "retry_summary": {
      "immediate_retries": 3,
      "scheduled_for_later": 5,
      "escalated_to_manual": 2
    },
    "failure_analysis": {
      "most_common_failure": "network_timeout",
      "patterns_found": 3,
      "recommendations": [
        "Use browser method with increased timeout"
      ]
    }
  }
}
```

## Advanced Features

### Priority Scheduling System

The queue uses intelligent priority calculation based on:
- Subscription tier (Enterprise > Professional > Basic)
- Directory success rates and DA scores
- Deadline urgency and retry penalties
- Processing method efficiency

### Rate Limiting

Tier-based rate limiting with Redis backend:
- **Basic**: 50 requests/hour, 2 concurrent jobs, 25 directories/batch
- **Professional**: 200 requests/hour, 8 concurrent jobs, 100 directories/batch  
- **Enterprise**: 1000 requests/hour, 20 concurrent jobs, 500 directories/batch

### Health Monitoring

Comprehensive system monitoring includes:
- Queue depth and processing rates
- Database connection health
- Browser automation pool status
- Error patterns and success rates
- Resource utilization (CPU, memory, network)

### Predictive Capacity Planning

The system analyzes historical usage patterns to:
- Predict peak load periods
- Recommend capacity scaling
- Optimize resource allocation
- Prevent system overload

## Security & Validation

### Input Validation
- Comprehensive Joi schema validation
- Data type and format validation
- Business rule validation
- SQL injection protection

### Security Features
- Malicious content detection
- File upload validation
- Request size limits
- Authentication per endpoint type

### Error Handling
- Structured error responses
- Request ID tracking
- Comprehensive logging
- Performance monitoring

## Integration Requirements

### Environment Variables
```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Redis/Queue
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# API Keys
SYSTEM_API_KEY=your_system_key
ADMIN_API_KEY=your_admin_key

# Processing
MAX_CONCURRENT_JOBS=20
MAX_SUBMISSIONS_PER_JOB=100
BROWSER_POOL_SIZE=5
```

### Dependencies
```json
{
  "bull": "^4.10.4",
  "ioredis": "^5.3.2",
  "puppeteer": "^21.0.0",
  "joi": "^17.11.0",
  "express-rate-limit": "^7.1.0",
  "isomorphic-dompurify": "^2.0.0"
}
```

## Performance Characteristics

### Throughput
- **Basic tier**: ~50 submissions/hour
- **Professional tier**: ~200 submissions/hour
- **Enterprise tier**: ~1000 submissions/hour

### Scalability
- Horizontal scaling via Redis clustering
- Browser pool auto-scaling
- Database connection pooling
- Load balancing across multiple workers

### Reliability
- Automatic failover and retry logic
- Graceful degradation under load  
- Circuit breaker patterns
- Comprehensive error recovery

## Monitoring & Analytics

### Real-time Metrics
- Processing rates and success rates
- Queue depths and wait times
- Error patterns and retry rates
- VA performance and workload

### Health Checks
- Automated health monitoring
- System capacity alerts
- Performance degradation detection
- Predictive failure analysis

### Audit Trail
- Complete activity logging
- User action tracking
- System event recording
- Performance analytics

## Deployment Notes

1. **Redis Setup**: Required for queue operations and rate limiting
2. **Database Migrations**: Run Phase 2.1 schema migrations first
3. **Environment Config**: Set all required environment variables
4. **Worker Processes**: Start queue workers separately from API servers
5. **Monitoring**: Configure health check endpoints and alerting
6. **Scaling**: Use PM2 or similar for process management

## API Response Codes

- **200 OK**: Successful operation
- **201 Created**: Resource created successfully
- **400 Bad Request**: Validation or business logic error
- **401 Unauthorized**: Authentication required/failed
- **403 Forbidden**: Authorization failed
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: System error
- **503 Service Unavailable**: System overloaded

## Support & Maintenance

The Queue Processing API is designed for:
- Zero-downtime deployments
- Automatic scaling and load balancing
- Comprehensive monitoring and alerting
- Self-healing error recovery
- Performance optimization

For additional configuration options, troubleshooting, and advanced features, refer to the individual module documentation and inline code comments.