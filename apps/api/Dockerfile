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

# Copy package files from apps/api directory
COPY apps/api/package*.json ./

# Install dependencies (native modules will compile correctly on Debian)
RUN npm ci --only=production && npm cache clean --force

# Copy source code from apps/api directory (exclude node_modules)
COPY apps/api/ ./

# Create directories and set ownership
RUN mkdir -p logs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]