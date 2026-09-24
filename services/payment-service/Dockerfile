FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/payment-service build
ENV NODE_ENV=production PORT=4007
EXPOSE 4007
CMD ["node", "services/payment-service/dist/server.js"]
