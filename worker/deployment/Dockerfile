# Production-ready Dockerfile for DirectoryBolt AutoBolt Workers
FROM node:18-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd -r autobolt && useradd -r -g autobolt -G audio,video autobolt \
    && mkdir -p /app/data /app/logs \
    && chown -R autobolt:autobolt /app

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY worker.js ./
COPY directory-config.js ./
COPY .env.example ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright browsers
RUN npx playwright install chromium && \
    npx playwright install-deps chromium

# Create directories with proper permissions
RUN mkdir -p /app/screenshots /app/data /app/logs && \
    chown -R autobolt:autobolt /app

# Copy startup and health check scripts
COPY deployment/scripts/start.sh /app/start.sh
COPY deployment/scripts/health-check.js /app/health-check.js
RUN chmod +x /app/start.sh

# Switch to non-root user
USER autobolt

# Expose health check port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node health-check.js

# Start the worker
CMD ["./start.sh"]