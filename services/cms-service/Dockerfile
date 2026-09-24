FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/cms-service build
ENV NODE_ENV=production PORT=4010
EXPOSE 4010
CMD ["node", "services/cms-service/dist/server.js"]
