import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, type CartItem } from './cart';

const item: Omit<CartItem, 'quantity'> = {
  productId: 'p1',
  slug: 'test-shirt',
  sku: 'SKU-001',
  title: 'Test Shirt',
  size: 'M',
  color: 'Black',
  pricePaise: 100000,
  image: 'img.jpg',
};

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({ items: [], couponCode: null });
  });

  it('adds an item to the cart', () => {
    useCartStore.getState().addItem(item);

    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].productId).toBe('p1');
    expect(items[0].quantity).toBe(1);
  });

  it('increments quantity if item already exists', () => {
    useCartStore.getState().addItem(item);
    useCartStore.getState().addItem(item);

    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(2);
  });

  it('removes an item from the cart', () => {
    useCartStore.getState().addItem(item);
    useCartStore.getState().removeItem('SKU-001');

    const items = useCartStore.getState().items;
    expect(items.length).toBe(0);
  });

  it('clears the cart completely', () => {
    useCartStore.getState().addItem(item);
    useCartStore.getState().clearCart();

    const items = useCartStore.getState().items;
    expect(items.length).toBe(0);
  });
});
