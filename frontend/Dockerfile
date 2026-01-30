# --- Stage 1: Build Stage ---
# Use the same Node version as your dev environment for consistency
FROM node:24-alpine AS builder

WORKDIR /app

# pass VITE_ vars in as build args
ARG VITE_PUBLIC_API_KEY
ARG VITE_API_BASE_URL
ARG VITE_SITE_TITLE
ARG VITE_SITE_DESCRIPTION
ARG VITE_SITE_URL
ARG VITE_OG_IMAGE
ARG VITE_TWITTER_IMAGE
ARG VITE_TWITTER_HANDLE

ENV VITE_PUBLIC_API_KEY=${VITE_PUBLIC_API_KEY}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SITE_TITLE=${VITE_SITE_TITLE}
ENV VITE_SITE_DESCRIPTION=${VITE_SITE_DESCRIPTION}
ENV VITE_SITE_URL=${VITE_SITE_URL}
ENV VITE_OG_IMAGE=${VITE_OG_IMAGE}
ENV VITE_TWITTER_IMAGE=${VITE_TWITTER_IMAGE}
ENV VITE_TWITTER_HANDLE=${VITE_TWITTER_HANDLE}

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy the rest of your source code
COPY . .

# Run the production build command
RUN pnpm build


# --- Stage 2: Production Stage ---
# Use a tiny, production-ready web server image
FROM nginx:1.29-alpine

# Copy the built static files from the 'builder' stage
# The source path (/app/dist) depends on your framework's output directory
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# The default Nginx command starts the server automatically
CMD ["nginx", "-g", "daemon off;"]
