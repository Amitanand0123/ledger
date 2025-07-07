# backend/Dockerfile

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY worker/package.json ./worker/

# Install all dependencies for the monorepo
RUN npm run install:all

# Copy the entire monorepo context
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=./backend/prisma/schema.prisma

# Build the backend workspace
RUN npm run build --workspace=backend

# Prune development dependencies
RUN npm prune --production


# --- Stage 2: Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy pruned node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy the built backend application from the builder stage
COPY --from=builder /app/backend/dist ./backend/dist

# Copy the Prisma schema needed for runtime
COPY --from=builder /app/backend/prisma/schema.prisma ./backend/prisma/schema.prisma

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD [ "node", "--es-module-specifier-resolution=node", "backend/dist/server.js" ]