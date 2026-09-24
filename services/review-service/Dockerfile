FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/review-service build
ENV NODE_ENV=production PORT=4012
EXPOSE 4012
CMD ["node", "services/review-service/dist/server.js"]
