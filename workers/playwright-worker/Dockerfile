# Simple Railway-optimized Dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy package files
COPY workers/playwright-worker/package.json workers/playwright-worker/package-lock.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy source files
COPY workers/playwright-worker/src ./src
COPY workers/playwright-worker/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Start the worker
CMD ["node", "dist/index.js"]
