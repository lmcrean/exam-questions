# Workers App Dockerfile
# Optimized for background job processing

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Set environment
ENV NODE_ENV=production

# Start workers
CMD ["node", "dist/index.js"]

# Health check (can be customized based on your monitoring setup)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "console.log('Workers running')" || exit 1
