import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from './inventoryStore';
import type { InventoryItem } from '../types/inventory';

describe('inventoryStore', () => {
  // We can grab the store's initial state so we can reset it between tests
  const initialState = useInventoryStore.getState();

  beforeEach(() => {
    // Reset store before each test
    useInventoryStore.setState(initialState, true);
  });

  it('should optimistically update an item', () => {
    // 1. Setup initial store state with one item
    const mockItem: InventoryItem = {
      id: 'p-1',
      uuid: 1,
      name: 'Old Name',
      category: 'Uncategorized',
      price: 10,
      stock: 5,
      brand: '',
      sku: '',
      barcode: '',
      description: '',
      supplier: '',
      minQuantity: 0,
      cost_price: 5,
      specifications: {},
      is_variant: false,
      has_variants: false,
      tags: [],
      notes: ''
    };

    useInventoryStore.setState({ items: [mockItem] });

    // 2. Call the optimistic update
    useInventoryStore.getState().updateItemOptimistically('p-1', { name: 'New Name', price: 15 });

    // 3. Verify the item was updated
    const items = useInventoryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('New Name');
    expect(items[0].price).toBe(15);
    // Unchanged properties should remain
    expect(items[0].stock).toBe(5);
  });

  it('should optimistically remove an item', () => {
    // 1. Setup initial store state
    const mockItem1: InventoryItem = {
      id: 'p-1', uuid: 1, name: 'Item 1', category: 'Uncategorized', price: 10, stock: 5, brand: '', sku: '', barcode: '', description: '', supplier: '', minQuantity: 0, cost_price: 5, specifications: {}, is_variant: false, has_variants: false, tags: [], notes: ''
    };
    const mockItem2: InventoryItem = {
      id: 'p-2', uuid: 2, name: 'Item 2', category: 'Uncategorized', price: 20, stock: 10, brand: '', sku: '', barcode: '', description: '', supplier: '', minQuantity: 0, cost_price: 10, specifications: {}, is_variant: false, has_variants: false, tags: [], notes: ''
    };

    useInventoryStore.setState({ items: [mockItem1, mockItem2] });

    // 2. Remove the first item
    useInventoryStore.getState().removeItemOptimistically('p-1');

    // 3. Verify it was removed
    const items = useInventoryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('p-2');
  });
});
