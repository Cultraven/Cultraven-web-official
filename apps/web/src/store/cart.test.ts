import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cart';

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({ items: [], isOpen: false });
  });

  it('adds an item to the cart', () => {
    const item = {
      productId: 'p1',
      sku: 'SKU-001',
      title: 'Test Shirt',
      pricePaise: 100000,
      image: 'img.jpg',
      quantity: 1
    };
    
    useCartStore.getState().addItem(item);
    
    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].productId).toBe('p1');
    expect(items[0].quantity).toBe(1);

  });

  it('increments quantity if item already exists', () => {
    const item = {
      productId: 'p1',
      sku: 'SKU-001',
      title: 'Test Shirt',
      pricePaise: 100000,
      image: 'img.jpg',
      quantity: 1
    };
    
    useCartStore.getState().addItem(item);
    useCartStore.getState().addItem(item);
    
    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(2);
  });

  it('removes an item from the cart', () => {
    const item = {
      productId: 'p1',
      sku: 'SKU-001',
      title: 'Test Shirt',
      pricePaise: 100000,
      image: 'img.jpg',
      quantity: 1
    };
    
    useCartStore.getState().addItem(item);
    useCartStore.getState().removeItem('SKU-001');
    
    const items = useCartStore.getState().items;
    expect(items.length).toBe(0);
  });

  it('clears the cart completely', () => {
    const item = {
      productId: 'p1',
      sku: 'SKU-001',
      title: 'Test Shirt',
      pricePaise: 100000,
      image: 'img.jpg',
      quantity: 1
    };
    
    useCartStore.getState().addItem(item);
    useCartStore.getState().clearCart();
    
    const items = useCartStore.getState().items;
    expect(items.length).toBe(0);
  });
});
