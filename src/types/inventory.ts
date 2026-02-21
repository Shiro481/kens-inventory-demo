/**
 * Core interface representing an item in the inventory system.
 * This interface normalizes data from the 'products' and 'product_variants' tables.
 */
export interface InventoryItem {
  /** Raw DB integer ID (used as React list key and optimistic-update target) */
  id: number;
  /** Original Supabase UUID / bigint PK — used for ALL database operations */
  uuid?: string;
  /** Display name of the product or variant */
  name: string;
  /** Stock Keeping Unit code */
  sku?: string;
  /** Boolean flag indicating if this product has sub-variants */
  has_variants?: boolean;
  /** Count of variants if has_variants is true */
  variant_count?: number;
  /** Product Category Name */
  category?: string;
  /** Selling Price */
  price: number;
  /** Current Stock Quantity */
  stock?: number;
  /** Minimum stock level before "Low Stock" warning */
  minQuantity?: number;

  // --- Extended fields for automotive ---
  brand?: string;
  description?: string;
  image_url?: string;
  barcode?: string;
  cost_price?: number;
  voltage?: number;
  wattage?: number;
  /** Color temperature in Kelvin (e.g. 6000 or "6000K") */
  color_temperature?: number | string;
  lumens?: number;
  beam_type?: string;
  /** Socket type, Size, or specific model variant (H1, 22-inch, etc.) */
  variant_type?: string;
  supplier?: string;
  /** JSONB specifications blob from database */
  specifications?: Specifications;

  // --- Variant-related fields ---
  /** ID of the specific variant if this item is a variant */
  variant_id?: number | string;
  /** Display name suffix for the variant */
  variant_display_name?: string;
  variant_price?: number;
  /** The specific color of the variant from the product_variants table */
  variant_color?: string;
  /** Flag to identify if this is a variant row in the flat list */
  is_variant?: boolean;
  /** UUID of the parent product if this is a variant */
  parent_product_id?: string;
  /** Internal notes for specific item or variant */
  notes?: string;
  // Allow for other dynamic fields
  [key: string]: any;
}

export interface Specifications {
  tags?: string[];
  last_restock?: string;
  internal_notes?: string;
  color?: string;
  socket?: string;
  material?: string;
  warranty_months?: number;
  [key: string]: any; // Allow open-ended but strong type base
}

/**
 * Helper to determine the stock status of an item.
 *
 * Logic:
 * - 0 quantity -> "Out of Stock"
 * - quantity < minQuantity -> "Low Stock"
 * - otherwise -> "In Stock"
 */
export const getStatus = (item: InventoryItem) => {
  const qty = item.stock ?? 0;
  if (qty === 0) return 'Out of Stock';
  const minQty = item.minQuantity ?? 10;
  return qty < minQty ? 'Low Stock' : 'In Stock';
};

/**
 * Interface representing a supplier entity
 */
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
