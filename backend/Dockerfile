# File: backend/Dockerfile

# --- Builder Stage: Installs all dependencies and builds the project ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci

COPY . .

RUN npm run build --workspace=backend
# Remove development dependencies to create a lean production image
RUN npm prune --production

# --- Production Stage: Copies only the necessary built files ---
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy pruned dependencies and built code from the builder stage
COPY --from=builder /app/node_modules ./node_modules
# Some packages might be in the workspace node_modules, copy that too
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/package.json ./package.json

EXPOSE 5000
# The production start command
CMD [ "npm", "run", "start", "--workspace=backend" ]
