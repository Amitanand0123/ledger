# File: frontend/Dockerfile

# --- Builder Stage: Installs all dependencies and builds the project ---
FROM node:20-alpine AS builder
WORKDIR /app

# Accept NEXT_PUBLIC_* vars as build args (baked into client-side JS at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci

COPY . .
RUN npm run build --workspace=frontend

# --- Production Stage: Copies only the necessary built files ---
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3021

# Copy the standalone output (includes monorepo structure due to outputFileTracingRoot)
COPY --from=builder /app/frontend/.next/standalone ./
# Copy the static assets and public files to their expected locations
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3021
# The standalone server.js is inside the frontend directory
CMD ["node", "frontend/server.js"]
