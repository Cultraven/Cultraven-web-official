FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/catalog-service build
ENV NODE_ENV=production PORT=4003
EXPOSE 4003
CMD ["node", "services/catalog-service/dist/server.js"]
