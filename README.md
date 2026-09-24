# Fashion Commerce Platform

Monorepo: 3 Next.js apps + API gateway + domain microservices + shared packages.

| App      | Path            | Port |
| -------- | --------------- | ---- |
| Storefront | apps/web      | 3000 |
| Admin      | apps/admin    | 3001 |
| Delivery   | apps/delivery | 3002 |
| Gateway    | apps/gateway  | 4000 |
| Services   | services/*    | 4001+ |

## Run locally
```bash
cp .env.example .env
pnpm install
pnpm infra:up      # MongoDB, Redis, Mailpit (http://localhost:8025)
pnpm dev           # everything, or pnpm dev:web / dev:admin / dev:delivery
```
Read `docs/architecture.md` before adding code.
