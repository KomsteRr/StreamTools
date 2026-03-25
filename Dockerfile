# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the Next.js app
ENV NODE_ENV=production
RUN pnpm run build

# ─── Stage 3: runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Add a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Install pnpm (needed for the prisma db push at startup)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only what is needed to run
COPY --from=builder /app/public           ./public
COPY --from=builder /app/.next/standalone  ./
COPY --from=builder /app/.next/static      ./.next/static
COPY --from=builder /app/prisma           ./prisma
COPY --from=builder /app/node_modules/.pnpm  ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma  ./node_modules/prisma
COPY --from=builder /app/package.json     ./package.json

# Directory for the SQLite database file (mount a volume here)
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# DATABASE_URL should point to a path inside /data, e.g.:
#   DATABASE_URL="file:/data/prod.db"

# Push the schema then start the server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
