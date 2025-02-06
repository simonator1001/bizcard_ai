# Build stage
FROM node:lts AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install dependencies with increased memory limit and production only
RUN npm cache clean --force && \
    NODE_OPTIONS="--max_old_space_size=4096" npm install --legacy-peer-deps --production=false

# Copy all files
COPY . .

# Build the application with increased memory limit
RUN NODE_OPTIONS="--max_old_space_size=4096" npm run build

# Production stage
FROM node:lts AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production --legacy-peer-deps

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Start the application
CMD ["node", "server.js"] 