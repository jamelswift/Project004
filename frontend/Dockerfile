# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (allow lockfile updates in CI)
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build Next.js (static export)
RUN pnpm run build

# Production stage - use Nginx for static files
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remove default nginx files
RUN rm -rf ./*

# Copy built static files from builder
COPY --from=builder /app/out ./

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 (Nginx default)
EXPOSE 80

# Start Nginx (single command)
CMD ["nginx", "-g", "daemon off;"]
