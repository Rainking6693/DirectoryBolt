# Use official Playwright image with necessary dependencies
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app/workers/playwright-worker

# Install dependencies with cached layer
COPY workers/playwright-worker/package.json workers/playwright-worker/package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy worker source
COPY workers/playwright-worker/ ./

# Bring shared libraries and data the worker depends on
COPY lib ../../lib
COPY directories ../../directories

RUN npm run build && npx playwright install chromium --with-deps

CMD ["node", "dist/index.js"]
