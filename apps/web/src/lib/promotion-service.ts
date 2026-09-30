export interface PromotionResult {
  discountPaise: number;
  code: string | null;
  isValid: boolean;
  error?: string;
}

const ACTIVE_COUPONS: Record<string, { type: "percentage" | "fixed"; value: number; minOrderValuePaise?: number }> = {
  "RAVEN10": { type: "percentage", value: 10 },
  "WELCOME500": { type: "fixed", value: 50000, minOrderValuePaise: 150000 },
};

export function validateCoupon(code: string | undefined | null, subtotalPaise: number): PromotionResult {
  if (!code) {
    return { discountPaise: 0, code: null, isValid: true };
  }

  const normalizedCode = code.trim().toUpperCase();
  const coupon = ACTIVE_COUPONS[normalizedCode];

  if (!coupon) {
    return { discountPaise: 0, code: normalizedCode, isValid: false, error: "Invalid coupon code" };
  }

  if (coupon.minOrderValuePaise && subtotalPaise < coupon.minOrderValuePaise) {
    return { discountPaise: 0, code: normalizedCode, isValid: false, error: `Minimum order value for this coupon is ₹${coupon.minOrderValuePaise / 100}` };
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.floor((subtotalPaise * coupon.value) / 100);
  } else if (coupon.type === "fixed") {
    discount = coupon.value;
  }

  // Prevent discount from exceeding subtotal
  discount = Math.min(discount, subtotalPaise);

  return {
    discountPaise: discount,
    code: normalizedCode,
    isValid: true,
  };
}
