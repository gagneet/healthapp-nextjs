# Multi-stage build for production optimization
FROM node:22.18.0-alpine AS deps
RUN apk add --no-cache libc6-compat build-base
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Build stage
FROM node:22.18.0-alpine AS builder
WORKDIR /app
RUN apk add --no-cache build-base
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# For development, we don't need to build - we'll use hot reload
# RUN npm run build

# Production image
FROM node:22.18.0-alpine AS runner
WORKDIR /app

# Install debugging and networking utilities
RUN apk add --no-cache \
    build-base \
    vim \
    iputils \
    busybox-extras \
    mysql-client \
    iproute2 \
    net-tools

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]