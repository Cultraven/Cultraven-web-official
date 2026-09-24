FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/inventory-service build
ENV NODE_ENV=production PORT=4004
EXPOSE 4004
CMD ["node", "services/inventory-service/dist/server.js"]
