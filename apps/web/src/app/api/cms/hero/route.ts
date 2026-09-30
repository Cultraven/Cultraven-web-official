import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { HeroBanner, HeroConfig } from "@/lib/models/HeroBanner";
import { isAdminRequest } from "@/lib/admin-auth";
import { normalizeMode, validateSlides } from "@/lib/hero";

export const dynamic = "force-dynamic";

const SLIDE_DEFAULTS = {
  type: "image", srcMobile: "", posterSrc: "", altText: "", eyebrow: "", headline: "", subheadline: "", ctaLabel: "SHOP NOW",
  ctaHref: "/collections/all", objectPosition: "center center", overlayOpacity: 0.4, durationMs: 5000, active: true, sortOrder: 0,
};

/** Records saved before newer fields existed are filled with the same defaults the schema uses. */
function serialize(doc: any) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return {
    ...SLIDE_DEFAULTS,
    ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined && v !== null)),
    id: String(_id),
    startsAt: doc.startsAt ? new Date(doc.startsAt).toISOString() : null,
    endsAt: doc.endsAt ? new Date(doc.endsAt).toISOString() : null,
  };
}

/** Admin read of the saved hero (incl. hidden/scheduled slides). The website reads the same records server-side. */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const [docs, config] = await Promise.all([
      HeroBanner.find().sort({ sortOrder: 1, createdAt: 1 }).lean(),
      HeroConfig.findOne({ key: "homepage" }).lean() as Promise<any>,
    ]);
    return NextResponse.json({
      mode: normalizeMode(config?.mode),
      banners: docs.map(serialize),
    });
  } catch (error) {
    console.error("Failed to fetch hero banners:", error);
    return NextResponse.json({ error: "Hero data unavailable" }, { status: 503 });
  }
}

/**
 * Admin save. Validates the full payload first, then upserts/inserts, and only
 * deletes removed slides last — so a failure part-way never wipes existing hero data.
 */
export async function PUT(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slides, errors } = validateSlides(body?.banners);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }
  const mode = normalizeMode(body?.mode);

  try {
    await connectToDatabase();

    // Every slide gets a known _id up front (existing id, or a fresh one), so the final cleanup is exact.
    const ids = slides.map((_, i) => {
      const rawId = body.banners[i]?.id;
      return typeof rawId === "string" && mongoose.isValidObjectId(rawId)
        ? new mongoose.Types.ObjectId(rawId)
        : new mongoose.Types.ObjectId();
    });

    if (slides.length > 0) {
      await HeroBanner.bulkWrite(
        slides.map((slide, i) => ({
          updateOne: { filter: { _id: ids[i] }, update: { $set: slide }, upsert: true },
        })) as any,
        { ordered: true }
      );
    }

    // Remove slides that are no longer in the payload — done last, after the writes above succeeded.
    await HeroBanner.deleteMany({ _id: { $nin: ids } });

    await HeroConfig.updateOne({ key: "homepage" }, { $set: { mode } }, { upsert: true });

    const docs = await HeroBanner.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, mode, banners: docs.map(serialize) });
  } catch (error) {
    console.error("Failed to update hero banners:", error);
    return NextResponse.json({ error: "Failed to save hero. Existing hero was not changed." }, { status: 500 });
  }
}
