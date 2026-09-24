# ADR 0001 — pnpm + Turborepo monorepo, domain services

Decision: one repo, apps + services + shared packages. Services are separate deployables (Cloud Run),
frontends deploy to Vercel (one Vercel project per app, root directory `apps/<name>`).
Reason: shared types/contracts, atomic changes, one CI, and services can be split further later.
