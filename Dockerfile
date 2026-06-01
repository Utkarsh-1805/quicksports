# syntax=docker/dockerfile:1.7
# Multi-stage production build for QuickCourt (Next.js 16, App Router, Prisma 7).

#############################
# Stage 1: deps — install with strict lockfile
#############################
FROM node:20-alpine AS deps
WORKDIR /app

# Prisma needs OpenSSL
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

#############################
# Stage 2: builder — generate Prisma client + next build
#############################
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# DB connection isn't required at build time; build only inlines NEXT_PUBLIC_*.
# Real env values are injected at run time.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

#############################
# Stage 3: runner — minimal runtime image
#############################
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for safety
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy build output + only the runtime dependencies and Prisma client
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/prisma ./src/prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
