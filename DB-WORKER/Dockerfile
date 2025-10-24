# AI-Enhanced Playwright Worker Dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy package files (from root directory)
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

# Install ALL dependencies (including AI services)
RUN npm ci --no-audit --no-fund

# Verify TypeScript is installed
RUN npx tsc --version

# Copy source files (from root directory)
COPY src ./src
COPY tsconfig.json ./tsconfig.json

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