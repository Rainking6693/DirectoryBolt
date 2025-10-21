# Use official Playwright image with necessary dependencies
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Copy package files from worker directory
COPY workers/playwright-worker/package.json workers/playwright-worker/package-lock.json* ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy AI services FIRST (they need to be available during build)
COPY lib/ai-services ./lib/ai-services

# Copy worker source files
COPY workers/playwright-worker/src ./src
COPY workers/playwright-worker/tsconfig.json ./tsconfig.json

# Build TypeScript and install Playwright
RUN npm run build && npx playwright install chromium --with-deps

# Start command
CMD ["node", "dist/index.js"]
