FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/promotion-service build
ENV NODE_ENV=production PORT=4011
EXPOSE 4011
CMD ["node", "services/promotion-service/dist/server.js"]
