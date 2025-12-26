# apps/web Dockerfile - multi-stage production build for Next.js (standalone)

# 1) Dependencies stage
FROM node:20-slim AS deps
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod=false

# 2) Build stage
FROM node:20-slim AS build
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
COPY . .
# Copy workspace node_modules from deps (root and per-package for proper .bin resolution)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
# Build shared and web; Next output is standalone (configured in next.config.mjs)
RUN pnpm --filter @shared/core build && pnpm --filter web build

# 3) Runtime stage
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Copy standalone server and static assets
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
# Next server listens on 3000 by default
ENV PORT=3000
EXPOSE 3000
# Healthcheck for root
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
