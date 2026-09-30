import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

const REQUIRED_ENV = ["MONGODB_URI", "SESSION_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_SECRET_TOKEN", "NEXT_PUBLIC_SITE_URL"];

/** Plain-language cause for a failed database connection. Never returns the error text itself (it can contain hostnames/credentials). */
function explain(e: unknown): string {
  const msg = String((e as any)?.message ?? e ?? "");
  const name = String((e as any)?.name ?? "");
  if (!process.env.MONGODB_URI) return "MONGODB_URI is not set on this deployment.";
  if (/MongoParseError|Invalid scheme|Invalid connection string|URI malformed|must be url encoded|escaped/i.test(name + " " + msg)) return "MONGODB_URI is malformed — use the mongodb+srv:// string from Atlas and URL-encode special characters in the password (@ → %40, # → %23, etc.).";
  if (/authentication failed|bad auth|auth failed/i.test(msg)) return "The database rejected the username or password in MONGODB_URI.";
  if (/querySrv|ENOTFOUND|getaddrinfo/i.test(msg)) return "DNS lookup for the database host failed (check the host in MONGODB_URI).";
  if (/timed out|ReplicaSetNoPrimary|Server selection|ECONNREFUSED|ETIMEDOUT|not allowed|whitelist|IP/i.test(msg))
    return "The database could not be reached. In MongoDB Atlas → Network Access, allow this host's IP (for Vercel use 0.0.0.0/0).";
  return "Unexpected database error — check the server logs.";
}

/** GET /api/health — is the site able to reach its database? Safe to expose: reports status and cause category only. */
export async function GET() {
  const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
  try {
    await Promise.race([
      connectToDatabase(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("Server selection timed out")), 8000)),
    ]);
    return NextResponse.json({ ok: true, database: "connected", missingEnv }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[health] database check failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { ok: false, database: "unreachable", reason: explain(e), errorType: String((e as any)?.name ?? "Error"), errorCode: (e as any)?.code ?? null, missingEnv },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
