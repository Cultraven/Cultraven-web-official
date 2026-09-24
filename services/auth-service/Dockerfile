FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/auth-service build
ENV NODE_ENV=production PORT=4001
EXPOSE 4001
CMD ["node", "services/auth-service/dist/server.js"]
