# Multi-stage build for Marqlet (Node 20 + pnpm)
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Dependencies layer
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app

# Enable pnpm in runtime for potential scripts
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Expose default port
EXPOSE 3000

CMD ["node", "dist/index.js"]

