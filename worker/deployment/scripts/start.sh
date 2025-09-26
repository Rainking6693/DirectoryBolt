#!/bin/bash

# DirectoryBolt Worker Startup Script
# Handles graceful startup, proxy configuration, and health monitoring

set -e

echo "🚀 Starting DirectoryBolt AutoBolt Worker..."
echo "Worker ID: ${WORKER_ID:-unknown}"
echo "Environment: ${NODE_ENV:-development}"
echo "Orchestrator: ${ORCHESTRATOR_URL:-not-configured}"

# Validate required environment variables
if [ -z "$TWO_CAPTCHA_KEY" ]; then
    echo "❌ ERROR: TWO_CAPTCHA_KEY is required"
    exit 1
fi

if [ -z "$ORCHESTRATOR_URL" ]; then
    echo "❌ ERROR: ORCHESTRATOR_URL is required"
    exit 1
fi

if [ -z "$WORKER_AUTH_TOKEN" ]; then
    echo "⚠️  WARNING: WORKER_AUTH_TOKEN not set, worker may not authenticate properly"
fi

# Set up logging
export LOG_FILE="/app/logs/worker-${WORKER_ID:-unknown}-$(date +%Y%m%d).log"
mkdir -p /app/logs

# Create startup log entry
echo "$(date -Iseconds) [STARTUP] Worker ${WORKER_ID} starting..." >> "$LOG_FILE"

# Health check endpoint setup
cat > /app/health-server.js << 'EOF'
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
        // Check if main worker process is running
        try {
            const statusFile = '/app/data/worker-status.json';
            if (fs.existsSync(statusFile)) {
                const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
                const lastUpdate = new Date(status.lastUpdate);
                const now = new Date();
                
                // Consider healthy if updated within last 2 minutes
                if ((now - lastUpdate) < 120000) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'healthy',
                        workerId: process.env.WORKER_ID,
                        uptime: process.uptime(),
                        lastUpdate: status.lastUpdate,
                        jobsProcessed: status.jobsProcessed || 0
                    }));
                } else {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'unhealthy',
                        reason: 'Worker not responding',
                        lastUpdate: status.lastUpdate
                    }));
                }
            } else {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'starting',
                    reason: 'Status file not found'
                }));
            }
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'error',
                reason: error.message
            }));
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Health check server running on port 3000');
});
EOF

# Start health check server in background
node /app/health-server.js &

# Function to handle graceful shutdown
cleanup() {
    echo "$(date -Iseconds) [SHUTDOWN] Received shutdown signal..." >> "$LOG_FILE"
    echo "🛑 Shutting down worker gracefully..."
    
    # Send SIGTERM to main worker process
    if [ ! -z "$WORKER_PID" ]; then
        kill -TERM "$WORKER_PID" 2>/dev/null || true
        wait "$WORKER_PID" 2>/dev/null || true
    fi
    
    # Clean shutdown log
    echo "$(date -Iseconds) [SHUTDOWN] Worker stopped" >> "$LOG_FILE"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Proxy configuration
if [ "$HTTP_PROXY_ENABLED" = "true" ] && [ ! -z "$HTTP_PROXY_SERVER" ]; then
    echo "🌐 Configuring HTTP proxy: $HTTP_PROXY_SERVER"
    export HTTP_PROXY="$HTTP_PROXY_SERVER"
    export HTTPS_PROXY="$HTTP_PROXY_SERVER"
    
    if [ ! -z "$HTTP_PROXY_USERNAME" ] && [ ! -z "$HTTP_PROXY_PASSWORD" ]; then
        # Extract host and port from proxy server
        PROXY_HOST=$(echo "$HTTP_PROXY_SERVER" | sed 's|http://||' | sed 's|https://||' | cut -d':' -f1)
        PROXY_PORT=$(echo "$HTTP_PROXY_SERVER" | sed 's|http://||' | sed 's|https://||' | cut -d':' -f2)
        
        export HTTP_PROXY="http://${HTTP_PROXY_USERNAME}:${HTTP_PROXY_PASSWORD}@${PROXY_HOST}:${PROXY_PORT}"
        export HTTPS_PROXY="$HTTP_PROXY"
        
        echo "✅ Proxy authentication configured"
    fi
fi

# Start the main worker process
echo "🔄 Starting main worker process..."
echo "$(date -Iseconds) [START] Main worker process starting..." >> "$LOG_FILE"

# Start worker and capture PID
node worker.js >> "$LOG_FILE" 2>&1 &
WORKER_PID=$!

echo "✅ Worker process started with PID: $WORKER_PID"

# Wait for worker process to complete
wait "$WORKER_PID"

# If we reach here, the worker exited (potentially due to error)
WORKER_EXIT_CODE=$?
echo "⚠️  Worker process exited with code: $WORKER_EXIT_CODE"
echo "$(date -Iseconds) [EXIT] Worker process exited with code $WORKER_EXIT_CODE" >> "$LOG_FILE"

# Exit with same code as worker
exit "$WORKER_EXIT_CODE"