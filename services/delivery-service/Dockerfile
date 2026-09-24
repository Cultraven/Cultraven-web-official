FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/delivery-service build
ENV NODE_ENV=production PORT=4008
EXPOSE 4008
CMD ["node", "services/delivery-service/dist/server.js"]
