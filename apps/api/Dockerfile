FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Development stage
FROM base AS development

COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY prisma ./prisma

RUN npm install

COPY packages/shared-types ./packages/shared-types
RUN npm run build --workspace=@uhv/shared-types

COPY apps/api ./apps/api

RUN npx prisma generate

RUN mkdir -p /app/uploads && chmod 777 /app/uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npx ts-node prisma/seed.ts && cd apps/api && npm run start:dev"]

# Build stage for production
FROM base AS builder

COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY prisma ./prisma

RUN npm install

COPY packages/shared-types ./packages/shared-types
RUN npm run build --workspace=@uhv/shared-types

COPY apps/api ./apps/api
RUN npx prisma generate
RUN cd apps/api && npm run build

# Production runner stage
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY prisma ./prisma

RUN npm install --omit=dev

COPY packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p /app/uploads && chmod 777 /app/uploads

EXPOSE 3000

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy && node apps/api/dist/main"]
