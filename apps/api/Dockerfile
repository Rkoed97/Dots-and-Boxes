# apps/api Dockerfile - multi-stage production build

# 1) Base dependencies: install workspace deps with pnpm
FROM node:20-slim AS deps
WORKDIR /app
# Enable corepack to use pnpm
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
# Copy full monorepo for proper workspace linking
COPY . .
# Install all dependencies (include dev for TypeScript build)
RUN pnpm install --no-frozen-lockfile

# 2) Build stage: compile shared + api
FROM node:20-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
# Prisma requires OpenSSL
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY . .
# Use the node_modules we installed in deps (pnpm virtual store)
COPY --from=deps /app/node_modules ./node_modules
# Also copy per-package node_modules for correct .bin resolution in workspace scripts
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
# Generate Prisma Client and build only the api (api prebuild builds @shared/core)
RUN pnpm --filter api prisma:generate && pnpm --filter api build

# 3) Runtime stage: minimal image
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Prisma engines require OpenSSL at runtime too
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# Copy only what we need to run
COPY --from=build /app/node_modules ./node_modules
# Also copy per-package node_modules to ensure workspace resolution (e.g., reflect-metadata)
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules
# Copy built shared workspace so pnpm workspace link resolves at runtime
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
# Default port for API
ENV PORT=3001
EXPOSE 3001
# Simple healthcheck using Node fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["sh", "-c", "apps/api/node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma || apps/api/node_modules/.bin/prisma db push --schema=apps/api/prisma/schema.prisma; node apps/api/dist/main.js"]
