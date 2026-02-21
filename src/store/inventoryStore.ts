import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { InventoryItem } from '../types/inventory';

// ─── Store Shape ──────────────────────────────────────────────────────────────
interface InventoryStore {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  /** Full re-fetch from Supabase. Use force=true to bypass cache. */
  fetchInventory: (force?: boolean) => Promise<void>;

  /**
   * Immediately patches a single item in local state before the DB round-trip
   * resolves. Eliminates the stale-data window between mutation and re-fetch.
   */
  updateItemOptimistically: (id: number, patch: Partial<InventoryItem>) => void;

  /**
   * Immediately removes an item (and optionally all its children) from local
   * state before the DB round-trip resolves.
   */
  removeItemOptimistically: (id: number, removeChildren?: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  // ── fetchInventory ──────────────────────────────────────────────────────────
  fetchInventory: async (force = false) => {
    if (!supabase) {
      set({ error: 'Supabase client not initialized. Check your .env file.' });
      return;
    }

    const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const { lastFetched, items } = get();

    // Check cache
    if (!force && lastFetched && (now - lastFetched < CACHE_DURATION_MS) && items.length > 0) {
      return; // Return cached items
    }

    set({ isLoading: true, error: null });

    try {
      // 1. Fetch all parent products with joined relations
      const { data: rawData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_categories(name),
          variant_categories(code),
          suppliers(name)
        `);

      if (productsError) {
        set({ error: `Error fetching products: ${productsError.message}`, isLoading: false });
        return;
      }

      // 2. Fetch all variants
      const { data: allVariants, error: variantsError } = await supabase
        .from('product_variants')
        .select(`
          *,
          variant_definitions(variant_name)
        `);

      if (variantsError) {
        console.error('[inventoryStore] Error fetching variants:', variantsError);
      }

      const allItems: InventoryItem[] = [];

      // 3. Map parent products → InventoryItem
      for (const item of rawData ?? []) {
        const specs =
          typeof item.specifications === 'string'
            ? JSON.parse(item.specifications || '{}')
            : (item.specifications || {});

        const itemVariants = allVariants?.filter((v: any) => v.product_id === item.id) || [];
        const variantCount = itemVariants.length;
        const hasVariants = item.has_variants || variantCount > 0;
        
        // Calculate total stock: sum of variants if it has them, else the base stock
        const totalStock = hasVariants && variantCount > 0
          ? itemVariants.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0)
          : (item.stock_quantity || 0);

        allItems.push({
          // Use the raw DB integer ID — no offset needed since UUIDs handle uniqueness
          id: typeof item.id === 'number' ? item.id : parseInt(item.id),
          uuid: item.id,
          name: item.name,
          base_name: item.name,
          sku: item.sku,
          price: item.selling_price,
          stock: totalStock,
          minQuantity: item.min_stock_level,
          category: item.product_categories?.name,
          brand: item.brand,
          description: item.description,
          image_url: item.image_url,
          barcode: item.barcode,
          cost_price: item.cost_price,
          voltage: item.voltage,
          wattage: item.wattage,
          color_temperature: item.color_temperature,
          variant_color: item.variant_color || specs?.color,
          lumens: item.lumens,
          beam_type: item.beam_type,
          // For single items, specs.socket is the canonical write target (set by useInventory save logic).
          // Fall back to variant_categories.code (FK join) for legacy data, then item.variant_type.
          variant_type: specs?.socket || item.variant_categories?.code || item.variant_type || null,
          specifications: specs,
          supplier: item.suppliers?.name,
          has_variants: hasVariants,
          variant_count: variantCount,
          created_at: item.created_at,
          updated_at: item.updated_at,
          notes: specs?.internal_notes || '',
          tags: specs?.tags || [],
          restocked_at: specs?.last_restock?.date,
          restock_quantity: specs?.last_restock?.quantity,
          is_variant: false,
        });
      }

      // 4. Map variants → InventoryItem (flattened into same list)
      for (const variant of allVariants ?? []) {
        const parentProduct = (rawData ?? []).find((p: any) => p.id === variant.product_id);
        if (!parentProduct) continue;

        const defs = variant.variant_definitions;
        const defName = Array.isArray(defs) ? defs[0]?.variant_name : defs?.variant_name;
        const variantName = variant.variant_type || defName || 'Unknown';
        const temp = variant.color_temperature ? `${variant.color_temperature}K` : '';

        const parentSpecs =
          typeof parentProduct.specifications === 'string'
            ? JSON.parse(parentProduct.specifications || '{}')
            : (parentProduct.specifications || {});
        const variantSpecs =
          typeof variant.specifications === 'string'
            ? JSON.parse(variant.specifications || '{}')
            : (variant.specifications || {});

        allItems.push({
          // Use the raw DB integer ID for variants — parent IDs and variant IDs
          // live in separate tables so collision in the flat UI list is handled
          // by uuid being the actual PK used for all DB operations.
          id: typeof variant.id === 'number' ? variant.id : parseInt(variant.id),
          uuid: variant.id,
          name: parentProduct.name,
          base_name: parentProduct.name,
          sku: variant.variant_sku || `${parentProduct.sku}-${variant.id}`,
          price:
            variant.selling_price != null && variant.selling_price !== 0
              ? variant.selling_price
              : variant.price_adjustment
              ? parentProduct.selling_price + variant.price_adjustment
              : parentProduct.selling_price,
          stock: variant.stock_quantity ?? 0,
          minQuantity: variant.min_stock_level,
          category: parentProduct.product_categories?.name,
          brand: parentProduct.brand,
          description: variant.description || parentProduct.description,
          image_url: parentProduct.image_url,
          barcode: variant.variant_barcode || variant.variant_sku,
          cost_price: variant.cost_price,
          voltage: parentProduct.voltage,
          wattage: parentProduct.wattage,
          color_temperature: variant.color_temperature || parentProduct.color_temperature,
          variant_color: variant.variant_color,
          lumens: parentProduct.lumens,
          beam_type: parentProduct.beam_type,
          variant_type: variantName,
          specifications: { ...parentSpecs, ...variantSpecs },
          supplier: parentProduct.suppliers?.name,
          has_variants: false,
          variant_count: 0,
          variant_id: variant.variant_id,
          variant_display_name: `${variantName} ${temp}`.trim(),
          is_variant: true,
          parent_product_id: variant.product_id,
          created_at: variant.created_at,
          updated_at: variant.updated_at,
          notes: variantSpecs?.internal_notes || '',
          tags: parentSpecs?.tags || [],
        });
      }

      set({ items: allItems, isLoading: false, lastFetched: Date.now() });
    } catch (err: any) {
      console.error('[inventoryStore] Unexpected error:', err);
      set({ error: 'An unexpected error occurred while fetching inventory.', isLoading: false });
    }
  },

  // ── updateItemOptimistically ────────────────────────────────────────────────
  updateItemOptimistically: (id, patch) => {
    set(state => ({
      items: state.items.map(item => (item.id === id ? { ...item, ...patch } : item)),
    }));
  },

  // ── removeItemOptimistically ────────────────────────────────────────────────
  removeItemOptimistically: (id, removeChildren = false) => {
    const target = get().items.find(i => i.id === id);
    set(state => ({
      items: state.items.filter(item => {
        if (item.id === id) return false;
        // Optionally prune orphaned variant rows with the same parent uuid
        if (removeChildren && target?.uuid && item.parent_product_id === target.uuid) return false;
        return true;
      }),
    }));
  },
}));
