# Use official Playwright image with necessary dependencies
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npx playwright install chromium --with-deps

CMD ["node", "dist/index.js"]
