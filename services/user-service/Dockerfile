FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/user-service build
ENV NODE_ENV=production PORT=4002
EXPOSE 4002
CMD ["node", "services/user-service/dist/server.js"]
