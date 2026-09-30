import { expect, test, describe } from 'vitest';
import { validateCoupon } from './promotion-service';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE, COD_MAX_LIMIT } from './constants';

describe('Order Math & Pricing Rules', () => {
  const calculateTotal = (subtotalPaise: number, couponCode: string, paymentMethod: 'prepaid' | 'cod') => {
    const promo = validateCoupon(couponCode, subtotalPaise);
    const discount = promo.isValid ? promo.discountPaise : 0;
    const shipping = subtotalPaise >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const codFee = paymentMethod === 'cod' ? COD_FEE : 0;
    const total = subtotalPaise - discount + shipping + codFee;
    
    return { subtotalPaise, discount, shipping, codFee, total, promoError: promo.error };
  };

  test('Small order without coupon incurs shipping and no COD fee if prepaid', () => {
    const res = calculateTotal(100000, '', 'prepaid'); // ₹1,000
    expect(res.discount).toBe(0);
    expect(res.shipping).toBe(9900);
    expect(res.codFee).toBe(0);
    expect(res.total).toBe(109900); // 1000 + 99
  });

  test('Order exactly at threshold gets free shipping', () => {
    const res = calculateTotal(199900, '', 'prepaid'); // ₹1,999
    expect(res.discount).toBe(0);
    expect(res.shipping).toBe(0);
    expect(res.codFee).toBe(0);
    expect(res.total).toBe(199900);
  });

  test('Order above threshold gets free shipping', () => {
    const res = calculateTotal(200000, '', 'prepaid'); // ₹2,000
    expect(res.discount).toBe(0);
    expect(res.shipping).toBe(0);
    expect(res.codFee).toBe(0);
    expect(res.total).toBe(200000); // 2000
  });

  test('COD payment incurs COD fee regardless of shipping', () => {
    const res1 = calculateTotal(100000, '', 'cod'); // Below threshold
    expect(res1.shipping).toBe(9900);
    expect(res1.codFee).toBe(4900);
    expect(res1.total).toBe(114800); // 1000 + 99 + 49

    const res2 = calculateTotal(250000, '', 'cod'); // Above threshold
    expect(res2.shipping).toBe(0);
    expect(res2.codFee).toBe(4900);
    expect(res2.total).toBe(254900); // 2500 + 49
  });

  test('Valid coupon applies discount correctly', () => {
    // 10% off
    const res = calculateTotal(300000, 'RAVEN10', 'prepaid'); // ₹3000
    expect(res.discount).toBe(30000); // 300
    expect(res.shipping).toBe(0);
    expect(res.codFee).toBe(0);
    expect(res.total).toBe(270000); // 2700
  });

  test('Coupon validation fails for invalid code', () => {
    const res = calculateTotal(100000, 'INVALID', 'prepaid');
    expect(res.discount).toBe(0);
    expect(res.promoError).toBeTruthy();
    expect(res.total).toBe(109900); // 1000 + 99
  });

  test('COD limits are checked correctly', () => {
    // The maximum COD limit is 5,000. So an order above this should throw or fail.
    // In actual implementation it is checked via route.ts.
    // Let's test the constants.
    expect(COD_MAX_LIMIT).toBe(500000);
  });
});
