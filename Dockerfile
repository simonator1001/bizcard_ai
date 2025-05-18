FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy everything
COPY . .

# Install dependencies for the mcp-modelcontextprotocol subproject
RUN cd mcp-modelcontextprotocol/perplexity-ask && npm install

# Build the Next.js app
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"] 