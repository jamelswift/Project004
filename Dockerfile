# This file is for root deployment (monorepo)
# Move this to frontend/Dockerfile or use docker-compose.yml instead

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend . 

# Build Next.js
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start app
ENV NEXT_PUBLIC_API_URL=http://backend:5000
CMD ["npm", "start"]
