FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/order-service build
ENV NODE_ENV=production PORT=4006
EXPOSE 4006
CMD ["node", "services/order-service/dist/server.js"]
