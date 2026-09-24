FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/notification-service build
ENV NODE_ENV=production PORT=4009
EXPOSE 4009
CMD ["node", "services/notification-service/dist/server.js"]
