import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { InventoryItem } from '../types/inventory';

// ─── Store Shape ──────────────────────────────────────────────────────────────
interface InventoryStore {
  items: InventoryItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  
  // Pagination State
  currentPage: number;
  hasMore: boolean;
  currentSearchQuery: string;

  /** 
   * Fetches inventory from the server using the search RPC. 
   * If reset=true, it clears existing items and starts from page 0.
   * Otherwise, it appends the next page to the existing items.
   */
  fetchInventory: (searchQuery?: string, reset?: boolean) => Promise<void>;

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

const PAGE_SIZE = 50;

// ─── Store ────────────────────────────────────────────────────────────────────
export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  currentPage: 0,
  hasMore: true,
  currentSearchQuery: '',

  // ── fetchInventory (Server-Side Paginated) ──────────────────────────────────
  fetchInventory: async (searchQuery = '', reset = true) => {
    if (!supabase) {
      set({ error: 'Supabase client not initialized. Check your .env file.' });
      return;
    }

    const { currentPage, items } = get();
    const isFetchingMore = !reset;
    const targetPage = reset ? 0 : currentPage + 1;
    const offset = targetPage * PAGE_SIZE;

    // Prevent fetching more if we already hit the end
    if (isFetchingMore && !get().hasMore) return;

    if (reset) {
      set({ isLoading: true, error: null, currentSearchQuery: searchQuery });
    } else {
      set({ isLoadingMore: true, error: null });
    }

    try {
      // Call the server-side RPC for searching and paginating
      const { data, error } = await supabase.rpc('search_inventory', {
        p_search_query: searchQuery,
        p_limit: PAGE_SIZE,
        p_offset: offset
      });

      if (error) {
        throw error;
      }

      // Format data to match InventoryItem interface exactly
      const formattedItems: InventoryItem[] = (data || []).map((item: any) => {
        // Safe parsing for specifications which might come back as string or JSONB
        const specs = typeof item.specifications === 'string' 
          ? JSON.parse(item.specifications || '{}') 
          : (item.specifications || {});

        return {
          id: typeof item.id === 'number' ? item.id : parseInt(item.id),
          uuid: item.uuid,
          name: item.name,
          base_name: item.base_name,
          sku: item.sku,
          price: item.price,
          stock: item.stock,
          minQuantity: item.min_quantity,
          category: item.category,
          brand: item.brand,
          description: item.description,
          image_url: item.image_url,
          barcode: item.barcode,
          cost_price: item.cost_price,
          voltage: item.voltage,
          wattage: item.wattage,
          color_temperature: item.color_temperature,
          variant_color: item.variant_color,
          lumens: item.lumens,
          beam_type: item.beam_type,
          variant_type: item.variant_type,
          specifications: specs,
          supplier: item.supplier,
          has_variants: item.has_variants,
          variant_count: item.variant_count,
          variant_id: item.variant_id,
          variant_display_name: item.variant_display_name,
          is_variant: item.is_variant,
          parent_product_id: item.parent_product_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          notes: item.notes || '',
          tags: item.tags || [],
        };
      });

      set(state => ({
        items: reset ? formattedItems : [...state.items, ...formattedItems],
        currentPage: targetPage,
        hasMore: formattedItems.length === PAGE_SIZE, // If we got less than requested, we hit the end
        isLoading: false,
        isLoadingMore: false,
      }));

    } catch (err: any) {
      console.error('[inventoryStore] Error fetching paginated inventory:', err);
      set({ 
        error: 'An unexpected error occurred while fetching inventory.', 
        isLoading: false,
        isLoadingMore: false
      });
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
