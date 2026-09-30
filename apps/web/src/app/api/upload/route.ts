import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

import crypto from "crypto";

function verifyAdminToken(req: Request): boolean {
  // @ts-ignore
  const cookies = req.headers.get("cookie") || "";
  const match = cookies.match(/cultraven_session=([^;]+)/);
  if (!match) return false;
  const session = match[1];
  if (!session || !session.includes(".")) return false;
  const [encodedPayload, signature] = session.split(".");
  try {
    const secret = process.env.SESSION_SECRET || "cultraven-dev-secret-change-in-prod";
    const expectedSig = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return false;
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
    }

    // Allowlist of safe image extensions
    const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
    const rawExt = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const ext = ALLOWED_EXTS.has(rawExt) ? rawExt : null;
    if (!ext) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Secure random filename — no user input in the path
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    const filename = `${uniqueSuffix}.${ext}`;
    
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);

    // Write file to /public/uploads
    await writeFile(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
