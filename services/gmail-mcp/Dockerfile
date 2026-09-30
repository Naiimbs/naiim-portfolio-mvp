FROM node:20-alpine AS base

# Install security updates & wget for healthcheck
RUN apk update && apk upgrade && apk add --no-cache wget

WORKDIR /app

# Install dependencies as root, then switch to non-root
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts

# Copy application source
COPY src/ ./src/

# Set file ownership to non-root node user
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Environment defaults
ENV NODE_ENV=production \
    PORT=3100 \
    HOST=0.0.0.0

EXPOSE 3100

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3100/health || exit 1

CMD ["node", "src/index.js"]
