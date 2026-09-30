import mongoose, { Schema, model, models } from "mongoose";

const LookProductSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  href: { type: String, required: true },
  image: { type: String, required: true },
  pricePaise: { type: Number, required: true },
  color: { type: String, required: true },
}, { _id: false });

const ShopLookSchema = new Schema({
  lookLabel: { type: String, default: "LOOK 01" },
  modelImage: { type: String, default: "" },
  products: { type: [LookProductSchema], default: [] },
}, { timestamps: true });

export const ShopLook = models.ShopLook || model("ShopLook", ShopLookSchema);
