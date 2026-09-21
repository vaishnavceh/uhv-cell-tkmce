FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Development stage
FROM base AS development

COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY packages/shared-types ./packages/shared-types
RUN npm run build --workspace=@uhv/shared-types

COPY apps/web ./apps/web

EXPOSE 5173

CMD ["sh", "-c", "cd apps/web && npm run dev"]

# Build stage for production
FROM base AS builder

COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY packages/shared-types ./packages/shared-types
RUN npm run build --workspace=@uhv/shared-types

COPY apps/web ./apps/web
RUN cd apps/web && npm run build

# Production static serving stage
FROM nginx:alpine AS production

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
