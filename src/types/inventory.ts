/**
 * Core interface representing an item in the inventory system.
 * This interface normalizes data from the 'products' and 'product_variants' tables.
 */
export interface InventoryItem {
  /** Numeric ID generated from UUID for UI compatibility */
  id: number;
  /** Original Supabase UUID (PK in database) */
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
  /** Current Stock Quantity (preferred field) */
  stock?: number;
  /** Legacy field for quantity (deprecated, use stock) */
  quantity?: number;
  /** Legacy field for minimum quantity (deprecated, use minQuantity) */
  min_qty?: number;
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
  specifications?: any;

  // --- Variant-related fields ---
  /** ID of the specific variant if this item is a variant */
  variant_id?: number | string;
  /** Display name suffix for the variant */
  variant_display_name?: string;
  variant_price?: number;
  /** Flag to identify if this is a variant row in the flat list */
  is_variant?: boolean; 
  /** UUID of the parent product if this is a variant */
  parent_product_id?: string; 
  /** Internal notes for specific item or variant */
  notes?: string; 
  /** Custom tags for filtering and categorization */
  tags?: string[];

  // Allow for other dynamic fields
  [key: string]: any;
}

/**
 * Helper to determine the stock status of an item.
 * 
 * Logic:
 * - 0 quantity -> "Out of Stock"
 * - quantity < minQuantity -> "Low Stock"
 * - otherwise -> "In Stock"
 * 
 * Handles fallback for legacy field names (stock vs quantity, minQuantity vs min_qty)
 */
export const getStatus = (item: InventoryItem) => {
  // Check stock, falling back to quantity, lastly 0
  const qty = item.stock ?? item.quantity ?? 0;
  
  if (qty === 0) return 'Out of Stock';
  
  // Use defined minQuantity (preferred) or min_qty, otherwise default to 10
  const minQty = item.minQuantity ?? item.min_qty ?? 10;
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
