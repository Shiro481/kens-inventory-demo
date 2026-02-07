export interface InventoryItem {
  id: number;
  name: string;
  sku?: string;
  category?: string;
  price: number;
  stock?: number;
  quantity?: number;
  min_qty?: number;
  minQuantity?: number; // New column
  [key: string]: any;
}

export const getStatus = (item: InventoryItem) => {
  const qty = item.stock ?? item.quantity ?? 0;
  if (qty === 0) return 'Out of Stock';
  
  // Use defined minQuantity (preferred) or min_qty, otherwise default to 10
  const minQty = item.minQuantity ?? item.min_qty ?? 10;
  return qty < minQty ? 'Low Stock' : 'In Stock';
};
