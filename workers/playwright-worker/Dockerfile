# Use official Playwright image with necessary dependencies
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Copy package files from worker directory
COPY workers/playwright-worker/package.json workers/playwright-worker/package-lock.json* ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy worker source files individually to avoid symlink issues
COPY workers/playwright-worker/src ./src
COPY workers/playwright-worker/tsconfig.json ./tsconfig.json

# Copy AI services that the worker depends on
# The compiled code expects them at ../../../lib/ai-services from /app/dist/
# So we need to create the directory structure that matches the import paths
# From /app/dist/, the path ../../../lib/ai-services resolves to /lib/ai-services
# Let's create the expected directory structure
RUN mkdir -p /lib
COPY lib/ai-services /lib/ai-services

# Also copy AI services to the app directory so they can access node_modules
# This ensures they have access to the installed dependencies
COPY lib/ai-services ./lib/ai-services

# Note: directories folder is NOT required for worker operation
# The worker loads directory data from the database via API

# Build TypeScript and install Playwright
RUN npm run build && npx playwright install chromium --with-deps

# Start command
CMD ["node", "dist/index.js"]
