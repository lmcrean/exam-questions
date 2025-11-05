# Use Node.js LTS Debian slim image for better native module compatibility
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (bcrypt, sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security (Debian syntax)
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Copy monorepo package files for workspace setup
COPY package*.json ./
COPY packages/db/package*.json ./packages/db/
COPY packages/db/tsconfig.json ./packages/db/
COPY apps/api/package*.json ./apps/api/

# Install workspace dependencies (needed for building)
RUN npm ci --workspaces --include-workspace-root

# Copy and build @repo/db package source
COPY packages/db/src ./packages/db/src
RUN cd packages/db && npm run build

# Copy API source code
COPY apps/api/ ./apps/api/

# Build the API TypeScript code
RUN cd apps/api && npm run build

# Clean npm cache to reduce image size
RUN npm cache clean --force

# Set working directory to API
WORKDIR /app/apps/api

# Create directories and set ownership
RUN mkdir -p logs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]