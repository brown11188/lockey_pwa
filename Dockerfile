FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_SECRET=build_placeholder
ENV AUTH_SECRET=build_placeholder
ENV NEXT_PUBLIC_BASE_PATH=/apps/p8rnlryi0yd1sa6uufs1j1ur
ENV DATABASE_URL=/tmp/build.db
RUN mkdir -p /tmp && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BASE_PATH=/apps/p8rnlryi0yd1sa6uufs1j1ur
ENV AUTH_SECRET=lockey-super-secret-auth-key-2026-p8rnlryi0yd1sa6uufs1j1ur
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/start.sh ./start.sh
RUN chmod +x ./start.sh
RUN mkdir -p /app/db && chown -R nextjs:nodejs /app/db
RUN touch /app/.env.production \
 && chown nextjs:nodejs /app/.env.production \
 && chmod 644 /app/.env.production
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["./start.sh"]
