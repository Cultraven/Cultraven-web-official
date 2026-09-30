import { z } from "zod";

export const AddressInput = z.object({
  label: z.enum(["Home", "Work", "Other"]).default("Home"),
  name: z.string().trim().min(1).max(100),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  phone: z.string().transform((v) => v.replace(/\s/g, "")).pipe(z.string().regex(/^\d{10}$/, "Phone must be 10 digits")),
  isDefault: z.boolean().optional().default(false),
});

export const shape = (a: any) => ({
  id: String(a._id), label: a.label, name: a.name, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state,
  pincode: a.pincode, phone: a.phone, isDefault: !!a.isDefault,
});
