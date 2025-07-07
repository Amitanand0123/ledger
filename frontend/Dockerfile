# frontend/Dockerfile

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy all package.json and package-lock.json files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY worker/package.json ./worker/

# Install dependencies for the whole monorepo
RUN npm run install:all

# Copy the rest of the monorepo source code
COPY . .

# Build the Next.js application
RUN npm run build --workspace=frontend


# --- Stage 2: Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=3021

# Copy production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules

# Copy Next.js standalone output
COPY --from=builder /app/frontend/.next/standalone ./frontend
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

# Expose the port the app runs on
EXPOSE 3021

# Command to run the application
CMD ["node", "frontend/server.js"]