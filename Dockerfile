FROM oven/bun:1.3.10 as builder

WORKDIR /app

COPY bun.lock ./

COPY package.json ./

RUN bun install

COPY . .

RUN bun run build

FROM node:22-alpine as runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

COPY .env .env

EXPOSE 3000

CMD npm run db:deploy && node .output/server/index.mjs
