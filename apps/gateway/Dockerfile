FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/gateway build
ENV NODE_ENV=production PORT=4000
EXPOSE 4000
CMD ["node", "apps/gateway/dist/server.js"]
