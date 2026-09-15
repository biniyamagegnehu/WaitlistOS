# ==============================================================================
# Multi-target Root Dockerfile for WaitlistOS
# Usage:
#   docker build --target api -t waitlistos-api .
#   docker build --target web -t waitlistos-web .
# ==============================================================================

# ------------------------------------------------------------------------------
# Target: API (NestJS + Prisma)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS api

RUN apk add --no-cache bash openssl ca-certificates libc6-compat

RUN npm i -g @nestjs/cli typescript ts-node prisma

WORKDIR /usr/src/app

COPY api/package*.json ./
RUN npm install --legacy-peer-deps

COPY api/ ./

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

COPY api/wait-for-it.sh /opt/wait-for-it.sh
COPY api/startup.prod.sh /opt/startup.prod.sh
RUN chmod +x /opt/wait-for-it.sh /opt/startup.prod.sh

RUN mkdir -p /usr/src/app/files /usr/src/app/uploads

EXPOSE 3000
CMD ["/opt/startup.prod.sh"]

# ------------------------------------------------------------------------------
# Target: Web (Next.js Standalone Runner)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS web-deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY web/package*.json ./
RUN npm install --legacy-peer-deps

FROM node:22-alpine AS web-builder
WORKDIR /usr/src/app
COPY --from=web-deps /usr/src/app/node_modules ./node_modules
COPY web/ ./

ARG NEXT_PUBLIC_API_URL=https://getlist.learnica.net
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL=https://getlist.learnica.net
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

FROM node:22-alpine AS web
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=web-builder /usr/src/app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=web-builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=web-builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; elif [ -f web/server.js ]; then node web/server.js; else npm run start; fi"]
