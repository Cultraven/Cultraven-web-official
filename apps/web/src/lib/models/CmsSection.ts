import mongoose from "mongoose";

/**
 * One document per CMS-managed content section (keyed, e.g. "home.trending").
 * `data` is validated server-side against the field schema in lib/cms/registry.ts
 * before every write. Hero slides, Shop the Look and Products keep their own
 * dedicated models; everything else lives here so there is exactly one record
 * per section for both the Admin Panel and the public website.
 */
const CmsSectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true, minimize: false }
);

export const CmsSection =
  mongoose.models.CmsSection || mongoose.model("CmsSection", CmsSectionSchema);
