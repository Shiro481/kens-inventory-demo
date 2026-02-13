export interface InventoryItem {
  id: number;
  uuid?: string; // Original Supabase UUID
  name: string;
  sku?: string;
  has_variants?: boolean;
  variant_count?: number; // Number of variants available
  category?: string;
  price: number;
  stock?: number;
  quantity?: number;
  min_qty?: number;
  minQuantity?: number; // New column
  
  // Extended fields for automotive
  brand?: string;
  description?: string;
  image_url?: string;
  barcode?: string;
  cost_price?: number;
  voltage?: number;
  wattage?: number;
  color_temperature?: number | string; // Can be number (6000) or string ("6000K")
  lumens?: number;
  beam_type?: string;
  bulb_type?: string;
  supplier?: string;
  specifications?: any;

  // Variant-related fields
  variant_id?: number | string;
  variant_display_name?: string;
  variant_price?: number;
  is_variant?: boolean; // Flag to identify if this is a variant row
  parent_product_id?: string; // UUID of the parent product
  notes?: string; // Internal notes for specific item or variant

  [key: string]: any;
}

export const getStatus = (item: InventoryItem) => {
  const qty = item.stock ?? item.quantity ?? 0;
  if (qty === 0) return 'Out of Stock';
  
  // Use defined minQuantity (preferred) or min_qty, otherwise default to 10
  const minQty = item.minQuantity ?? item.min_qty ?? 10;
  return qty < minQty ? 'Low Stock' : 'In Stock';
};

export interface Supplier {
  id: number;
  created_at?: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
}
