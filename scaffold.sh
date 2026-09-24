#!/usr/bin/env bash
# Scaffold for a scalable fashion e-commerce monorepo (pnpm + Turborepo).
# Usage: bash scaffold.sh [project-folder-name]
set -euo pipefail

ROOT="${1:-fashion-commerce}"
mkdir -p "$ROOT"
cd "$ROOT"

# name:port:modules(csv)  -> each becomes services/<name>-service
SERVICES=(
  "auth:4001:auth,session,otp"
  "user:4002:user,address,wishlist"
  "catalog:4003:product,category,brand,attribute,size-chart"
  "inventory:4004:stock,warehouse"
  "cart:4005:cart"
  "order:4006:order,return,invoice"
  "payment:4007:payment,refund,webhook"
  "delivery:4008:partner,shipment,assignment"
  "notification:4009:email,whatsapp,template,queue"
  "cms:4010:banner,page,homepage,menu,setting"
  "promotion:4011:coupon,offer"
  "review:4012:review"
  "analytics:4013:report,event"
)

# ---------- helpers ----------
w()    { mkdir -p "$(dirname "$1")"; cat > "$1"; }                 # write stdin to file
keep() { local d; for d in "$@"; do mkdir -p "$d"; touch "$d/.gitkeep"; done; }
tpl()  { mkdir -p "$(dirname "$1")"; sed -e "s/__NAME__/$2/g" -e "s/__PORT__/$3/g" -e "s/__TITLE__/${4:-}/g" > "$1"; }

# ---------- root config ----------
w package.json <<'EOF'
{
  "name": "fashion-commerce",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=@shop/web",
    "dev:admin": "turbo run dev --filter=@shop/admin",
    "dev:delivery": "turbo run dev --filter=@shop/delivery",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write .",
    "infra:up": "docker compose -f infra/docker/docker-compose.yml up -d",
    "infra:down": "docker compose -f infra/docker/docker-compose.yml down"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "prettier": "^3.3.0",
    "turbo": "^2.3.0",
    "typescript": "^5.6.0"
  }
}
EOF

w pnpm-workspace.yaml <<'EOF'
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
EOF

w turbo.json <<'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "typecheck": {},
    "test": {}
  }
}
EOF

w tsconfig.base.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  }
}
EOF

w .prettierrc <<'EOF'
{ "singleQuote": false, "semi": true, "trailingComma": "all", "printWidth": 100 }
EOF

w .nvmrc <<'EOF'
20
EOF

w .gitignore <<'EOF'
node_modules
.next
dist
.turbo
.env
.env.*
!.env.example
*.log
.DS_Store
.vercel
coverage
EOF

w .dockerignore <<'EOF'
node_modules
.next
dist
.git
.env
.env.*
EOF

w .env.example <<'EOF'
# ---- Core ----
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# ---- Frontend apps ----
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# ---- Database / cache ----
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379

# ---- Auth ----
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too

# ---- Razorpay ----
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# ---- Email (dev: Mailpit on 1025; prod: Gmail/Workspace SMTP or a transactional provider) ----
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Your Brand <no-reply@yourdomain.com>"

# ---- WhatsApp Business Cloud API (Meta) ----
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=

# ---- File storage (product images) ----
STORAGE_PROVIDER=gcs
STORAGE_BUCKET=

# ---- Service URLs (override for production; defaults are localhost ports) ----
# AUTH_SERVICE_URL=http://localhost:4001
EOF

w README.md <<'EOF'
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
EOF

# ---------- shared packages ----------
pkg() { # name  deps-json-body
  mkdir -p "packages/$1/src"
  cat > "packages/$1/package.json" <<EOF
{
  "name": "@shop/$1",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": { ${2:-} }
}
EOF
  cat > "packages/$1/tsconfig.json" <<'EOF'
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "noEmit": true }, "include": ["src"] }
EOF
}

pkg config   '"dotenv": "^16.4.5"'
pkg logger   '"pino": "^9.5.0"'
pkg utils
pkg types    '"zod": "^3.23.8"'
pkg auth     '"@shop/types": "workspace:*"'
pkg events
pkg database '"mongoose": "^8.8.0"'
pkg api-client
pkg ui       '"react": "^19.0.0", "@types/react": "^19.0.0"'
pkg razorpay '"razorpay": "^2.9.5"'
pkg whatsapp
pkg mailer   '"nodemailer": "^6.9.16", "@types/nodemailer": "^6.4.17"'
pkg storage

# config: ports generated from the SERVICES list above (single source of truth)
{
  echo 'export const SERVICE_PORTS = {'
  echo '  gateway: 4000,'
  for s in "${SERVICES[@]}"; do IFS=: read -r n p _ <<< "$s"; echo "  $n: $p,"; done
  echo '} as const;'
  echo 'export type ServiceName = keyof typeof SERVICE_PORTS;'
} > packages/config/src/ports.ts

w packages/config/src/index.ts <<'EOF'
import { config } from "dotenv";
import path from "node:path";

// Services run from <repo>/services/<name>; the shared .env lives at the repo root.
config({ path: path.resolve(process.cwd(), "../../.env") });

export * from "./ports";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}
EOF

w packages/logger/src/index.ts <<'EOF'
import pino from "pino";

export const createLogger = (name: string) =>
  pino({ name, level: process.env.LOG_LEVEL ?? "info" });
EOF

w packages/utils/src/index.ts <<'EOF'
export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Store all money as integer paise in the database; format only at the UI edge.
export const formatINR = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
EOF

for f in user order payment delivery cms; do
  printf '// Shared %s schemas/types (zod) live here.\nexport {};\n' "$f" > "packages/types/src/$f.ts"
done
w packages/types/src/product.ts <<'EOF'
import { z } from "zod";

export const ProductVariantSchema = z.object({
  sku: z.string(),
  size: z.string(),
  color: z.string(),
  pricePaise: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
});

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  categoryIds: z.array(z.string()),
  images: z.array(z.string().url()),
  variants: z.array(ProductVariantSchema).min(1),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
EOF
w packages/types/src/index.ts <<'EOF'
export * from "./product";
export * from "./user";
export * from "./order";
export * from "./payment";
export * from "./delivery";
export * from "./cms";
EOF

w packages/auth/src/index.ts <<'EOF'
export const ROLES = ["customer", "delivery_partner", "staff", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

export interface TokenPayload {
  sub: string;
  role: Role;
  permissions?: string[];
}

// TODO(Sprint 1): signAccessToken / verifyToken (jose), requireRole(), requirePermission()
EOF

w packages/events/src/index.ts <<'EOF'
export const EVENTS = {
  USER_REGISTERED: "user.registered",
  ORDER_CREATED: "order.created",
  ORDER_PAID: "order.paid",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_SHIPPED: "order.shipped",
  ORDER_DELIVERED: "order.delivered",
  PAYMENT_CAPTURED: "payment.captured",
  PAYMENT_FAILED: "payment.failed",
  INVENTORY_LOW: "inventory.low",
  DELIVERY_ASSIGNED: "delivery.assigned",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export interface EventEnvelope<T = unknown> {
  id: string;
  name: EventName;
  occurredAt: string;
  payload: T;
}

// Implementations: Redis Streams / BullMQ first, Google Pub/Sub later — services only see this interface.
export interface EventBus {
  publish<T>(event: EventEnvelope<T>): Promise<void>;
  subscribe<T>(name: EventName, handler: (event: EventEnvelope<T>) => Promise<void>): void;
}
EOF

w packages/database/src/index.ts <<'EOF'
export * from "./repository";
export * from "./mongo/connection";
export * from "./mongo/mongo.repository";
EOF
w packages/database/src/repository.ts <<'EOF'
// Services depend on this interface only, so the DB engine can be swapped (e.g. Cloud SQL) without touching business logic.
export interface FindOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
}

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: Record<string, unknown>, opts?: FindOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
EOF
w packages/database/src/mongo/connection.ts <<'EOF'
import mongoose from "mongoose";

// One logical database per service (dbName) keeps data ownership clean.
export async function connectMongo(uri: string, dbName: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName });
  return mongoose.connection;
}
EOF
w packages/database/src/mongo/mongo.repository.ts <<'EOF'
import type { Model } from "mongoose";
import type { FindOptions, Repository } from "../repository";

export class MongoRepository<T> implements Repository<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly model: Model<any>) {}

  async findById(id: string) {
    return (await this.model.findById(id).lean()) as unknown as T | null;
  }
  async findMany(filter: Record<string, unknown> = {}, opts: FindOptions = {}) {
    const rows = await this.model
      .find(filter)
      .sort(opts.sort ?? {})
      .skip(opts.skip ?? 0)
      .limit(opts.limit ?? 20)
      .lean();
    return rows as unknown as T[];
  }
  async create(data: Partial<T>) {
    return (await this.model.create(data)).toObject() as unknown as T;
  }
  async update(id: string, data: Partial<T>) {
    return (await this.model.findByIdAndUpdate(id, data, { new: true }).lean()) as unknown as T | null;
  }
  async delete(id: string) {
    return (await this.model.findByIdAndDelete(id)) !== null;
  }
}
EOF
w packages/database/src/adapters/sql/README.md <<'EOF'
Switching to Google Cloud SQL (Postgres)? Implement `Repository<T>` here (Prisma/Drizzle/Knex)
and change the repository wiring in each service's `config/` folder. Business logic stays untouched.
EOF

w packages/api-client/src/index.ts <<'EOF'
export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | undefined | Promise<string | undefined>;
}

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken?.();
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body: JSON.stringify(body) }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  };
}
EOF

w packages/ui/src/index.ts <<'EOF'
export * from "./components/button";
EOF
w packages/ui/src/components/button.tsx <<'EOF'
import type { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} />;
}
EOF
keep packages/ui/src/tokens packages/ui/src/components/data-table packages/ui/src/components/modal packages/ui/src/components/form

w packages/razorpay/src/index.ts <<'EOF'
import crypto from "node:crypto";

// Always verify webhook signatures against the RAW request body, and treat webhooks as the source of truth.
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// TODO(Sprint 4): createOrder(), verifyCheckoutSignature(), refund()
EOF

w packages/whatsapp/src/index.ts <<'EOF'
export interface WhatsAppProvider {
  sendTemplate(to: string, template: string, params: string[]): Promise<void>;
}
// Implement with the official WhatsApp Business Cloud API (Meta). Avoid unofficial libraries — accounts get banned.
EOF

w packages/mailer/src/index.ts <<'EOF'
import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export function createSmtpMailer(opts: {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
}): Mailer {
  const transport = nodemailer.createTransport({
    host: opts.host,
    port: opts.port,
    auth: opts.user ? { user: opts.user, pass: opts.pass } : undefined,
  });
  return {
    async send(message) {
      await transport.sendMail({ from: opts.from, ...message });
    },
  };
}
EOF

w packages/storage/src/index.ts <<'EOF'
export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<{ url: string }>;
  remove(key: string): Promise<void>;
}
// Implementations: Google Cloud Storage or Cloudinary — apps/services only use this interface.
EOF

# ---------- microservices ----------
service() { # name port modules-csv
  local n="$1" p="$2" d="services/$1-service"

  tpl "$d/package.json" "$n" "$p" <<'EOF'
{
  "name": "@shop/__NAME__-service",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "test": "echo \"no tests yet\""
  },
  "dependencies": {
    "@shop/auth": "workspace:*",
    "@shop/config": "workspace:*",
    "@shop/database": "workspace:*",
    "@shop/events": "workspace:*",
    "@shop/logger": "workspace:*",
    "@shop/types": "workspace:*",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "helmet": "^8.0.0",
    "mongoose": "^8.8.0",
    "pino": "^9.5.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "tsup": "^8.3.0",
    "tsx": "^4.19.0"
  }
}
EOF

  tpl "$d/tsconfig.json" "$n" "$p" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true, "types": ["node"] },
  "include": ["src", "tsup.config.ts"]
}
EOF

  tpl "$d/tsup.config.ts" "$n" "$p" <<'EOF'
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  clean: true,
  noExternal: [/^@shop\//], // bundle our workspace packages, keep npm deps external
});
EOF

  tpl "$d/src/server.ts" "$n" "$p" <<'EOF'
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { SERVICE_PORTS } from "@shop/config";
import { connectMongo } from "@shop/database";
import { createLogger } from "@shop/logger";

const log = createLogger("__NAME__-service");
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ service: "__NAME__-service", status: "ok" });
});

// Mount module routers here, e.g.
// app.use("/api/v1/__NAME__/<module>", moduleRoutes);

async function main() {
  if (process.env.MONGODB_URI) {
    await connectMongo(process.env.MONGODB_URI, "shop___NAME__");
  }
  const port = Number(process.env.PORT ?? SERVICE_PORTS["__NAME__"]);
  app.listen(port, () => log.info(`__NAME__-service listening on :${port}`));
}

main().catch((err) => {
  log.error(err);
  process.exit(1);
});
EOF

  # Dockerfile — build from repo root: docker build -f services/<name>-service/Dockerfile .
  tpl "$d/Dockerfile" "$n" "$p" <<'EOF'
FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/__NAME__-service build
ENV NODE_ENV=production PORT=__PORT__
EXPOSE __PORT__
CMD ["node", "services/__NAME__-service/dist/server.js"]
EOF

  keep "$d/src/"{config,middlewares,events/publishers,events/subscribers,jobs,utils} "$d/tests"

  local mods m f
  IFS=',' read -ra mods <<< "$3"
  for m in "${mods[@]}"; do
    mkdir -p "$d/src/modules/$m"
    for f in routes controller service repository model schema; do
      printf '// %s.%s — layer rule: routes -> controller -> service -> repository -> model\nexport {};\n' "$m" "$f" \
        > "$d/src/modules/$m/$m.$f.ts"
    done
  done
}

for s in "${SERVICES[@]}"; do
  IFS=: read -r n p mods <<< "$s"
  service "$n" "$p" "$mods"
done

# ---------- API gateway ----------
tpl apps/gateway/package.json gateway 4000 <<'EOF'
{
  "name": "@shop/gateway",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@shop/config": "workspace:*",
    "@shop/logger": "workspace:*",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "helmet": "^8.0.0",
    "http-proxy-middleware": "^3.0.3",
    "pino": "^9.5.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "tsup": "^8.3.0",
    "tsx": "^4.19.0"
  }
}
EOF
mkdir -p apps/gateway/src
cp services/auth-service/tsconfig.json apps/gateway/tsconfig.json
cp services/auth-service/tsup.config.ts apps/gateway/tsup.config.ts
tpl apps/gateway/Dockerfile gateway 4000 <<'EOF'
FROM node:20-alpine
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @shop/gateway build
ENV NODE_ENV=production PORT=4000
EXPOSE 4000
CMD ["node", "apps/gateway/dist/server.js"]
EOF
{
  cat <<'EOF'
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICE_PORTS } from "@shop/config";
import { createLogger } from "@shop/logger";

const log = createLogger("gateway");
const app = express();

const origins = (
  process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://localhost:3002"
).split(",");

app.use(helmet());
app.use(cors({ origin: origins, credentials: true }));
// NOTE: no body parser here — the proxy must stream request bodies untouched.

app.get("/health", (_req, res) => {
  res.json({ service: "gateway", status: "ok" });
});

// /api/v1/<name>/* -> <NAME>_SERVICE_URL (falls back to localhost:<port>)
const routes = [
EOF
  for s in "${SERVICES[@]}"; do IFS=: read -r n _ <<< "$s"; echo "  \"$n\","; done
  cat <<'EOF'
] as const;

for (const name of routes) {
  const target =
    process.env[`${name.toUpperCase()}_SERVICE_URL`] ?? `http://localhost:${SERVICE_PORTS[name]}`;
  app.use(createProxyMiddleware({ pathFilter: `/api/v1/${name}`, target, changeOrigin: true }));
}

const port = Number(process.env.PORT ?? SERVICE_PORTS.gateway);
app.listen(port, () => log.info(`gateway listening on :${port}`));
EOF
} > apps/gateway/src/server.ts

# ---------- Next.js apps ----------
next_app() { # dir port title
  local d="apps/$1" p="$2" t="$3"

  tpl "$d/package.json" "$1" "$p" "$t" <<'EOF'
{
  "name": "@shop/__NAME__",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p __PORT__",
    "build": "next build",
    "start": "next start -p __PORT__",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@shop/api-client": "workspace:*",
    "@shop/types": "workspace:*",
    "@shop/ui": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
EOF

  tpl "$d/next.config.ts" "$1" "$p" "$t" <<'EOF'
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@shop/ui", "@shop/types", "@shop/api-client"],
};

export default config;
EOF

  tpl "$d/tsconfig.json" "$1" "$p" "$t" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "noEmit": true,
    "allowJs": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

  tpl "$d/src/app/layout.tsx" "$1" "$p" "$t" <<'EOF'
import type { ReactNode } from "react";

export const metadata = { title: "__TITLE__" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

  tpl "$d/src/middleware.ts" "$1" "$p" "$t" <<'EOF'
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  // TODO: verify auth cookie + role for protected routes
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
EOF

  keep "$d/public" "$d/src/components/common" "$d/src/hooks" "$d/src/lib" "$d/src/store" "$d/src/styles" "$d/src/config"
}

route() { # app route title
  local f="apps/$1/src/app/$2/page.tsx"
  mkdir -p "$(dirname "$f")"
  printf 'export default function Page() {\n  return (\n    <main>\n      <h1>%s</h1>\n    </main>\n  );\n}\n' "$3" > "$f"
}

# Storefront :3000
next_app web 3000 "Storefront"
route web "(shop)" "Home"
route web "(shop)/category/[slug]" "Category"
route web "(shop)/product/[slug]" "Product"
route web "(shop)/search" "Search"
route web "(shop)/cart" "Cart"
route web "(shop)/pages/[slug]" "CMS Page"
route web "(checkout)/checkout" "Checkout"
route web "(checkout)/order-success/[orderId]" "Order Success"
route web "(auth)/login" "Login"
route web "(auth)/register" "Register"
route web "(auth)/forgot-password" "Forgot Password"
route web "(account)/account" "My Account"
route web "(account)/account/orders" "My Orders"
route web "(account)/account/orders/[id]" "Order Detail"
route web "(account)/account/addresses" "Addresses"
route web "(account)/account/wishlist" "Wishlist"
keep apps/web/src/components/{layout,product,cart,checkout} apps/web/src/features/{catalog,cart,checkout,account,auth}

# Admin :3001
next_app admin 3001 "Admin"
route admin "(auth)/login" "Admin Login"
route admin "(dashboard)" "Dashboard"
for r in products products/new "products/[id]" categories inventory orders "orders/[id]" returns \
         customers "customers/[id]" delivery-partners shipments coupons reviews payments reports \
         cms/banners cms/homepage cms/pages cms/menus notifications/templates staff settings; do
  route admin "(dashboard)/$r" "$(basename "$r")"
done
keep apps/admin/src/components/{layout,tables,forms,charts} \
     apps/admin/src/features/{products,orders,customers,inventory,cms,promotions,delivery,notifications,reports,settings,staff}

# Delivery partner :3002
next_app delivery 3002 "Delivery Partner"
route delivery "(auth)/login" "Partner Login"
route delivery "(partner)" "Dashboard"
route delivery "(partner)/assigned" "Assigned Orders"
route delivery "(partner)/orders/[id]" "Delivery Detail"
route delivery "(partner)/history" "History"
route delivery "(partner)/earnings" "Earnings"
route delivery "(partner)/profile" "Profile"
keep apps/delivery/src/components/layout apps/delivery/src/features/{assignments,tracking,earnings,auth}

# ---------- infra / CI / docs ----------
w infra/docker/docker-compose.yml <<'EOF'
# Local infrastructure only. Run the apps with `pnpm dev`.
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  mailpit:            # catches all outgoing dev email — UI at http://localhost:8025
    image: axllent/mailpit
    ports: ["1025:1025", "8025:8025"]
volumes:
  mongo_data:
EOF
keep infra/cloud-run infra/scripts

w .github/workflows/ci.yml <<'EOF'
name: CI
on:
  pull_request:
  push:
    branches: [main, develop]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
EOF

w docs/architecture.md <<'EOF'
# Architecture rules

1. **Layers (inside every service module):** routes -> controller -> service -> repository -> model.
   Controllers never touch the DB; services never touch `req/res`.
2. **Ownership:** each service owns its own MongoDB database (`shop_<service>`). No cross-service DB reads —
   call the service's API or react to its events.
3. **Sync vs async:** browser -> gateway -> service is synchronous REST (`/api/v1/<service>/...`).
   Side effects (emails, WhatsApp, stock updates, analytics) go through events (`@shop/events`).
4. **Money** is stored as integer paise. **IDs, roles, events** come from shared packages, never re-declared.
5. **Config as data:** homepage sections, menus, banners, shipping/GST rules, message templates and store
   settings live in `cms-service` so admins change them without a deploy.
6. **Payments:** Razorpay webhook (signature-verified, idempotent) is the source of truth for order paid state.
7. **Provider interfaces:** mailer, whatsapp, storage, database and event bus are interfaces — swap providers
   without touching business code.
8. **Every service** exposes `/health`, validates input with zod, logs with `@shop/logger`, ships a Dockerfile.
EOF

w docs/agile/roadmap.md <<'EOF'
# Sprint roadmap (2-week sprints, suggested)

- **Sprint 0** Foundation: repo, CI, design tokens, Tailwind/shadcn, auth skeleton, deploy pipelines
- **Sprint 1** Auth + users (email/OTP login, roles, RBAC), admin shell
- **Sprint 2** Catalog + inventory: admin product/category CRUD, image upload, variants (size/color)
- **Sprint 3** Storefront browse: home, category, product page, search, cart
- **Sprint 4** Checkout + Razorpay + orders (webhooks, idempotency, invoices)
- **Sprint 5** Notifications: email + WhatsApp templates, order lifecycle messages
- **Sprint 6** Delivery: partner onboarding, assignment, status updates, earnings
- **Sprint 7** CMS + promotions: homepage builder, banners, menus, coupons/offers
- **Sprint 8** Returns/refunds, reports, reviews, hardening, load test, launch

Definition of done: typed, validated, tested, documented, deployed to staging, demoed.
EOF

w docs/adr/0001-monorepo-modular-services.md <<'EOF'
# ADR 0001 — pnpm + Turborepo monorepo, domain services

Decision: one repo, apps + services + shared packages. Services are separate deployables (Cloud Run),
frontends deploy to Vercel (one Vercel project per app, root directory `apps/<name>`).
Reason: shared types/contracts, atomic changes, one CI, and services can be split further later.
EOF

echo "✔ Scaffold created in $(pwd)"
