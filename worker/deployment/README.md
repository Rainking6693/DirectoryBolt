# DirectoryBolt AutoBolt Worker Deployment Guide

## Overview

This deployment configuration provides production-ready, scalable AutoBolt workers that replace the Chrome extension with backend Playwright automation. The system includes:

- **Playwright-based Workers**: Replace Chrome extension with headless browser automation
- **2Captcha Integration**: Automatic captcha solving with API key `your_production_2captcha_api_key`
- **HTTP Proxy Rotation**: Enterprise-scale proxy support for avoiding rate limits
- **Auto-scaling**: CPU/memory-based scaling from 2 to 8 workers
- **Health Monitoring**: Comprehensive health checks and auto-restart capabilities
- **Secure Communications**: API authentication between workers and Netlify Functions

## Quick Start

### 1. Railway Deployment (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from project root
cd worker/deployment
railway up
```

### 2. Docker Compose Deployment

```bash
# Copy environment variables
cp .env.production .env

# Edit .env with your actual values
nano .env

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Configuration

### Environment Variables

**Required:**

- `TWO_CAPTCHA_KEY`: `your_production_2captcha_api_key` (already configured)
- `ORCHESTRATOR_URL`: `https://directorybolt.netlify.app/api`
- `WORKER_AUTH_TOKEN`: Secure token for worker authentication

**HTTP Proxy Configuration:**

- `HTTP_PROXY_ENABLED`: `true`
- `HTTP_PROXY_SERVER`: Primary proxy server URL
- `HTTP_PROXY_USERNAME`: Proxy authentication username
- `HTTP_PROXY_PASSWORD`: Proxy authentication password
- `PROXY_LIST`: Comma-separated list for rotation

**Scaling Configuration:**

- `MIN_WORKERS`: `2` (minimum worker instances)
- `MAX_WORKERS`: `8` (maximum worker instances)
- `SCALE_UP_THRESHOLD`: `10` (queue size trigger for scaling up)
- `SCALE_DOWN_THRESHOLD`: `2` (queue size trigger for scaling down)
- `CPU_THRESHOLD`: `80` (CPU usage % for scaling up)
- `MEMORY_THRESHOLD`: `85` (memory usage % for scaling up)

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Netlify       │    │     Workers      │    │   Proxy         │
│   Functions     │◄──►│   (2-8 instances)│◄──►│   Manager       │
│   (Orchestrator)│    │   + Playwright   │    │   + Rotation    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▲                       ▲
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    Queue        │    │   Monitoring     │    │     Redis       │
│  Management     │    │   & Scaling      │    │  Coordination   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Services

### 1. AutoBolt Workers (`autobolt-worker-*`)

**Features:**

- Playwright browser automation
- 2Captcha integration for solving captchas
- HTTP proxy support with authentication
- Advanced field mapping (migrated from extension)
- Dynamic form detection
- Fallback selector engines
- Error handling and retry logic

**Resources:**

- Memory: 2GB per worker
- CPU: 1 core per worker
- Auto-restart on failure

### 2. Proxy Manager (`proxy-manager`)

**Features:**

- Health monitoring of proxy endpoints
- Automatic rotation based on performance
- Redis-backed proxy state management
- HTTP API for proxy requests
- Failed proxy detection and removal

**Endpoints:**

- `GET /health` - Service health check
- `GET /proxy/next` - Get next available proxy
- `GET /proxy/status` - Get all proxy statuses
- `POST /proxy/rotate` - Force proxy rotation

### 3. Auto-Scaler (`scaling-controller`)

**Features:**

- Queue size monitoring
- CPU/memory usage tracking
- Automatic worker scaling (2-8 instances)
- Docker Compose integration
- Cooldown periods to prevent thrashing

**Scaling Rules:**

- **Scale Up**: Queue ≥ 10 jobs OR CPU > 80% OR Memory > 85%
- **Scale Down**: Queue ≤ 2 jobs AND CPU < 30% AND Memory < 50%
- **Cooldown**: 5 min scale-up, 10 min scale-down

### 4. Redis Coordination

**Features:**

- Worker state coordination
- Proxy health state storage
- Queue status caching
- Performance metrics storage

## Migration from Chrome Extension

### Completed Migrations

✅ **Content Script → Playwright Automation**

- `content.js` → Worker Playwright page interactions
- DOM manipulation → `page.click()`, `page.fill()`, `page.evaluate()`

✅ **Extension Field Mapping → Worker Helpers**

- `AdvancedFieldMapper.js` → Playwright element analysis
- `DynamicFormDetector.js` → Multi-strategy form detection
- `FallbackSelectorEngine.js` → Retry mechanisms with XPath

✅ **Background Scripts → Orchestrator**

- `background-batch.js` → Netlify Functions queue management
- Extension messaging → HTTP API calls

✅ **Cache Busting → Proxy Rotation**

- `cache-buster.js` → Random query params + proxy rotation
- Extension throttling → Enterprise proxy scaling

### Extension Dependencies Removed

🗑️ **Deleted Extension Files:**

- `manifest.json` - No longer needed
- `popup.html/css/js` - Replaced by staff dashboard
- Extension-specific authentication - Replaced by JWT

## Security Features

### API Communications

- **HTTPS Only**: All worker-to-orchestrator communication
- **JWT Authentication**: Secure token-based auth
- **API Key Validation**: X-API-Key headers for worker requests
- **Rate Limiting**: Orchestrator-side request throttling

### Worker Security

- **Non-root containers**: All services run as dedicated users
- **Resource limits**: Memory and CPU constraints
- **Network isolation**: Internal Docker network
- **Secure environment variables**: No secrets in code

### Proxy Security

- **Authenticated proxies**: Username/password support
- **Health monitoring**: Automatic bad proxy removal
- **Rotation strategy**: Regular proxy switching
- **Failure tracking**: Statistical proxy performance

## Monitoring & Health Checks

### Worker Health Checks

- **HTTP endpoint**: `GET /health` on port 3000
- **Status file**: `/app/data/worker-status.json`
- **Criteria**: Updated within 2 minutes = healthy
- **Auto-restart**: Docker/Railway automatic restart

### System Monitoring

- **Prometheus**: Metrics collection on port 9090
- **Health endpoints**: All services expose `/health`
- **Log aggregation**: Centralized logging
- **Performance metrics**: CPU, memory, job processing rates

### Alerting Thresholds

- Queue backup > 50 jobs
- Worker response time > 60 seconds
- Database connection failures
- Captcha API rate limit reached
- Memory usage > 80%

## Scaling Configuration

### Auto-scaling Rules

**Scale Up Triggers:**

```javascript
// Queue size threshold
queueSize >= 10

// Resource usage thresholds
avgCpu > 80% || avgMemory > 85%

// Cooldown period
(now - lastScaleUp) > 5 minutes
```

**Scale Down Triggers:**

```javascript
// Low load conditions
queueSize <= 2 && avgCpu < 30% && avgMemory < 50%

// Cooldown period
(now - lastScaleDown) > 10 minutes
```

### Manual Scaling

```bash
# Scale to specific number
docker-compose up -d --scale autobolt-worker-1=4

# Railway scaling
railway scale --replicas 6

# Check current scale
docker ps --filter name=autobolt-worker
```

## Deployment Platforms

### Railway (Recommended)

✅ **Pros:**

- Simple Git-based deployment
- Built-in environment variable management
- Automatic HTTPS and domain management
- Integrated monitoring and logs
- Pay-per-use pricing

**Deployment:**

```bash
railway login
railway init
railway up
```

### Docker Compose

✅ **Pros:**

- Full control over environment
- Local development capability
- Custom networking configuration
- Multi-service orchestration

**Deployment:**

```bash
cp .env.production .env
# Edit .env with values
docker-compose up -d
```

### Fly.io

✅ **Pros:**

- Global edge deployment
- Docker-native platform
- Built-in load balancing

**Deployment:**

```bash
fly auth login
fly launch
fly deploy
```

## API Endpoints

### Worker → Orchestrator Communication

**Job Management:**

- `GET /api/jobs-next` - Get next pending job
- `POST /api/jobs-update` - Update job status
- `POST /api/jobs-complete` - Mark job complete
- `POST /api/jobs-retry` - Retry failed job

**Status & Health:**

- `GET /api/autobolt-status` - Get system status
- `GET /api/healthz` - Health check endpoint
- `GET /api/version` - Version information

### Internal Service APIs

**Proxy Manager:**

- `GET /proxy/next` - Get next proxy
- `GET /proxy/status` - Proxy health status

**Auto-scaler:**

- `GET /scaling/status` - Current scaling state
- `POST /scaling/manual` - Manual scaling trigger

## Troubleshooting

### Common Issues

**Workers not connecting to orchestrator:**

```bash
# Check environment variables
docker-compose exec autobolt-worker-1 env | grep ORCHESTRATOR

# Test API connectivity
curl -H "Authorization: Bearer $WORKER_AUTH_TOKEN" \
  https://directorybolt.netlify.app/api/healthz
```

**Proxy connection failures:**

```bash
# Check proxy manager logs
docker-compose logs proxy-manager

# Test proxy manually
curl --proxy $HTTP_PROXY_SERVER \
  -u $HTTP_PROXY_USERNAME:$HTTP_PROXY_PASSWORD \
  https://httpbin.org/ip
```

**Captcha solving failures:**

```bash
# Verify 2Captcha balance
curl "http://2captcha.com/res.php?key=your_production_2captcha_api_key&action=getbalance"

# Check worker logs for captcha attempts
docker-compose logs autobolt-worker-1 | grep -i captcha
```

### Log Analysis

**Worker logs:**

```bash
# All workers
docker-compose logs -f --tail=100 autobolt-worker-1 autobolt-worker-2

# Specific worker
docker exec autobolt-worker-1 tail -f /app/logs/worker-*.log
```

**System metrics:**

```bash
# Container resource usage
docker stats

# Prometheus metrics
curl http://localhost:9090/metrics
```

## Performance Optimization

### Worker Performance

- **Concurrent jobs**: 3 per worker (configurable)
- **Browser reuse**: Single browser instance per worker
- **Memory management**: Automatic cleanup after jobs
- **Timeout handling**: 5-minute job timeout

### Proxy Performance

- **Health checks**: 1-minute intervals
- **Rotation strategy**: Round-robin with health weighting
- **Failure handling**: 3-strike rule for proxy removal
- **Response time tracking**: Performance-based selection

### Scaling Performance

- **Check interval**: 30-second monitoring cycles
- **Scale-up speed**: 1 worker per 5 jobs in queue
- **Scale-down patience**: 10-minute cooldown
- **Resource limits**: Prevent runaway scaling

## Security Checklist

- ✅ All API communications use HTTPS
- ✅ Worker authentication via secure tokens
- ✅ Non-root container execution
- ✅ Resource limits prevent DoS
- ✅ Proxy credentials securely stored
- ✅ No secrets in container images
- ✅ Network isolation between services
- ✅ Health check endpoints secured
- ✅ Log sanitization (no sensitive data)
- ✅ Regular security updates

## Hudson Approval Required

This deployment configuration requires Hudson's approval for:

1. **Worker deployment platform selection** (Railway vs others)
2. **Proxy service provider configuration**
3. **Production environment variable values**
4. **Security token generation and distribution**
5. **Final production deployment authorization**

---

**Status**: DEPLOYMENT READY - AWAITING HUDSON APPROVAL

**Next Steps**:

1. Hudson reviews deployment configuration
2. Hudson approves proxy provider and platform
3. Hudson provides production environment variables
4. Deploy to selected platform
5. Perform end-to-end testing with Blake
