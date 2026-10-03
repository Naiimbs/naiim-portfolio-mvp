# =========================
# Stage 1 — Build React
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# =========================
# Stage 2 — Production
# =========================
FROM nginx:alpine

# Install custom Nginx configuration with explicit 301 redirects and SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production React build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
