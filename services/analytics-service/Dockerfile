FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/analytics-service build
ENV NODE_ENV=production PORT=4013
EXPOSE 4013
CMD ["node", "services/analytics-service/dist/server.js"]
