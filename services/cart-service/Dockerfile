FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/cart-service build
ENV NODE_ENV=production PORT=4005
EXPOSE 4005
CMD ["node", "services/cart-service/dist/server.js"]
