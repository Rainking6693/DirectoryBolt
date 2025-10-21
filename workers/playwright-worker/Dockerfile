# Render-optimized Dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy package files (with explicit paths from root)
COPY workers/playwright-worker/package.json ./package.json
COPY workers/playwright-worker/package-lock.json ./package-lock.json

# Install ALL dependencies (including devDependencies for TypeScript)
RUN npm ci --no-audit --no-fund

# Verify TypeScript is installed
RUN npx tsc --version

# Copy source files
COPY workers/playwright-worker/src ./src
COPY workers/playwright-worker/tsconfig.json ./tsconfig.json

# Build TypeScript
RUN npm run build

# Verify build output exists
RUN ls -la dist/

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Expose port for health checks
EXPOSE 3000

# Start the worker
CMD ["node", "dist/index.js"]
