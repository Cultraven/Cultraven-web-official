import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { EMAIL_LOGO_PNG_BASE64, LOGO_CID, withInlineLogo } from "./email-logo";
import { customerOrderEmail, type MailOrder } from "./email-templates";

const order: MailOrder = {
  id: "64b0000000000000000abc12", createdAt: new Date(), paymentMethod: "cod", paymentStatus: "pending",
  items: [{ title: "Raven Tee", size: "M", quantity: 1, pricePaise: 149900 }],
  subtotalPaise: 149900, discountPaise: 0, shippingPaise: 9900, codFeePaise: 4900, totalPaise: 164700,
  deliveryAddress: { name: "Asha Verma", phone: "9456782310", line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
};

describe("inline email logo", () => {
  it("the embedded logo is a real PNG and is the same file as public/email-logo.png", () => {
    const bytes = Buffer.from(EMAIL_LOGO_PNG_BASE64, "base64");
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(bytes.readUInt32BE(16)).toBe(570); // width
    expect(bytes.readUInt32BE(20)).toBe(119); // height
    expect(bytes.equals(fs.readFileSync(path.join(__dirname, "../../public/email-logo.png")))).toBe(true);
  });

  it("swaps the website logo link for the inline attachment, so it can't show as a broken image", () => {
    const m = customerOrderEmail(order, "https://cultraven.com");
    expect(m.html).toContain('src="https://cultraven.com/email-logo.png"'); // as authored (previews, tests)
    const r = withInlineLogo(m.html);
    expect(r.html).toContain(`src="cid:${LOGO_CID}"`);
    expect(r.html).not.toContain("/email-logo.png");
    expect(r.attachment).toMatchObject({ cid: LOGO_CID, contentType: "image/png", contentDisposition: "inline", filename: "cultraven-logo.png" });
    expect(r.attachment!.content.length).toBeGreaterThan(1000);
  });

  it("leaves html without the logo alone", () => {
    expect(withInlineLogo("<p>hi</p>")).toEqual({ html: "<p>hi</p>" });
    // calling it repeatedly (a global regex keeps state) must behave the same every time
    const m = customerOrderEmail(order, "https://cultraven.com");
    expect(withInlineLogo(m.html).attachment).toBeTruthy();
    expect(withInlineLogo(m.html).attachment).toBeTruthy();
  });
});
