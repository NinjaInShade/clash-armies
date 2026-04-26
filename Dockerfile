# Build: builds distribution code.
FROM node:24-alpine AS build
WORKDIR /app
# Copy lockfile first so this layer caches when only source changes
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY static ./static
COPY svelte.config.js vite.config.ts tsconfig.json CHANGELOG.md ./
RUN npm run build

# Prod deps: a *separate* node_modules with only runtime deps.
# Done in its own stage so dev deps never reach the final image.
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Runtime: minimal image, non-root, only what's needed to run.
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build     /app/dist         ./dist
COPY package.json ./
USER node
EXPOSE 3000
HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=20s \
    --retries=3 \
    CMD wget -q --spider http://127.0.0.1:$PORT/healthcheck || exit 1
CMD ["node", "dist/index.js"]
