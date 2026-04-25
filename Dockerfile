FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
# Copy Prisma files before install so prisma generate can run.
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Avoid postinstall failure before full source is copied.
RUN npm ci --ignore-scripts

FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Run postinstall explicitly now that full source exists.
RUN npm run postinstall && npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

CMD ["npm", "run", "start"]
