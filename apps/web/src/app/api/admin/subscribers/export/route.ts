/** GET /api/admin/subscribers/export: the whole subscriber list as a CSV file (opens in Excel / Google Sheets). Admin-only. */
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { isAdminRequest } from "@/lib/admin-auth";
import { toCsv, toRow } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const docs = (await NewsletterSubscriber.find({}).sort({ createdAt: -1 }).limit(50000).lean()) as any[];
    const day = new Date().toISOString().slice(0, 10);
    return new NextResponse(toCsv(docs.map(toRow)), {
      status: 200,
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="cultraven-subscribers-${day}.csv"`, "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Could not export the list" }, { status: 500 });
  }
}
