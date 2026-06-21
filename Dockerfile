# ── Build frontend ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder-front
WORKDIR /front
COPY front/package*.json ./
RUN npm ci
COPY front/ .
RUN npm run build

# ── Build backend ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder-back
WORKDIR /back
COPY back/package*.json ./
RUN npm ci
COPY back/ .
RUN npm run build

# ── Production image ────────────────────────────────────────────────────────
FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY back/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder-back /back/dist ./dist
COPY --from=builder-front /front/dist ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
