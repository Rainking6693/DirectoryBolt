# AI-Enhanced Playwright Worker Dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy package files
COPY workers/playwright-worker/package.json ./package.json
COPY workers/playwright-worker/package-lock.json ./package-lock.json

# Install ALL dependencies (including AI services)
RUN npm ci --no-audit --no-fund

# Verify TypeScript is installed
RUN npx tsc --version

# Copy AI services from lib directory
COPY lib/ai-services ./lib/ai-services

# Copy source files
COPY workers/playwright-worker/src ./src
COPY workers/playwright-worker/tsconfig.json ./tsconfig.json

# Build TypeScript
RUN npm run build

# Verify build output exists
RUN ls -la dist/

# Install Playwright browsers with all dependencies
RUN npx playwright install chromium --with-deps

# Expose port for health checks
EXPOSE 3000

# Start the AI-Enhanced worker
CMD ["node", "dist/aiWorker.js"]