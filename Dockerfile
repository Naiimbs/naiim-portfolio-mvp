# =========================
# Stage 1 — Build React
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Supabase public credentials — passed in at build time via --build-arg.
# Vite embeds VITE_* variables into the JS bundle during `npm run build`,
# so they MUST be present before the build step runs.
# The .env file is excluded from the Docker build context (.dockerignore).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

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
