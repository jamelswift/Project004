# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy app from builder
COPY --from=builder /app . 

# Expose port
EXPOSE 5000

# Start server
ENV NODE_ENV=production
CMD ["node", "server.js"]
