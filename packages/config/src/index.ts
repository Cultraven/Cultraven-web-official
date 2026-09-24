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
