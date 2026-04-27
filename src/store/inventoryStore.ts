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
  currentCategories: string[];
  
  // Global lookups (Non-paginated)
  allParentProducts: { 
    id: number; 
    uuid: string; 
    name: string; 
    category: string; 
    category_id: number; 
    brand: string;
    sku: string;
    barcode: string;
    supplier: string;
    description: string;
    image_url: string;
  }[];
  isLoadingParents: boolean;
  fetchAllParents: () => Promise<void>;

  // Brands (Normalized)
  brands: { id: number; name: string }[];
  isLoadingBrands: boolean;
  fetchBrands: () => Promise<void>;
  
  // Aggregate Stats for Dashboard
  aggregateStats: {
    total_items: number;
    low_stock: number;
    out_of_stock: number;
    today_sales_count?: number;
    today_revenue?: number;
  } | null;

  fetchInventoryStats: () => Promise<void>;

  /** 
   * Fetches inventory from the server using the search RPC. 
   * If reset=true, it clears existing items and starts from page 0.
   * Otherwise, it appends the next page to the existing items.
   * Optionally filter to specific categories server-side.
   */
  fetchInventory: (searchQuery?: string, reset?: boolean, categories?: string[], statusFilter?: string) => Promise<void>;

  /**
   * Immediately patches a single item in local state before the DB round-trip
   * resolves. Eliminates the stale-data window between mutation and re-fetch.
   */
  updateItemOptimistically: (id: string | number, patch: Partial<InventoryItem>) => void;

  /**
   * Immediately removes an item (and optionally all its children) from local
   * state before the DB round-trip resolves.
   */
  removeItemOptimistically: (id: string | number, removeChildren?: boolean) => void;
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
  currentCategories: [],
  currentSearchQuery: '',
  currentStatus: 'active',
  aggregateStats: null,
  allParentProducts: [],
  isLoadingParents: false,

  // ── fetchAllParents (Non-Paginated Lookup) ──────────────────────────────────
  fetchAllParents: async () => {
    if (!supabase) return;
    set({ isLoadingParents: true });
    try {
      // Fetch all base products for the "Add Variant To..." picker
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          brand,
          sku,
          barcode,
          description,
          image_url,
          has_variants,
          category_id, 
          product_categories(name),
          suppliers(name)
        `)
        .order('name');

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        uuid: item.id,
        name: item.name,
        brand: item.brand || '',
        sku: item.sku || '',
        barcode: item.barcode || '',
        description: item.description || '',
        image_url: item.image_url || '',
        supplier: item.suppliers?.name || '',
        category_id: item.category_id,
        category: item.product_categories?.name || 'Uncategorized',
        has_variants: item.has_variants || false
      }));

      set({ allParentProducts: formatted, isLoadingParents: false });
    } catch (err) {
      console.error('Failed to fetch parent products:', err);
    }
  },

  brands: [],
  isLoadingBrands: false,
  fetchBrands: async () => {
    if (get().isLoadingBrands) return;
    set({ isLoadingBrands: true });
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      set({ brands: data || [], isLoadingBrands: false });
    } catch (err) {
      console.error('[inventoryStore] Error fetching brands:', err);
      set({ isLoadingBrands: false });
    }
  },

  // ── fetchInventory (Server-Side Paginated) ──────────────────────────────────
  fetchInventory: async (searchQuery = '', reset = true, categories: string[] = [], statusFilter = 'All') => {
    if (!supabase) {
      set({ error: 'Supabase client not initialized. Check your .env file.' });
      return;
    }

    const { currentPage } = get();
    const isFetchingMore = !reset;
    const targetPage = reset ? 0 : currentPage + 1;
    const offset = targetPage * PAGE_SIZE;

    // Prevent fetching more if we already hit the end
    if (isFetchingMore && !get().hasMore) return;

    if (reset) {
      set({ isLoading: true, error: null, currentSearchQuery: searchQuery, currentCategories: categories });
    } else {
      set({ isLoadingMore: true, error: null });
    }

    try {
      // Determine which categories to filter by:
      // On load-more, reuse the persisted categories from the store
      const categoriesToUse = reset ? categories : get().currentCategories;

      // Call the server-side RPC for searching and paginating
      const { data, error } = await supabase.rpc('search_inventory_v2', {
        p_search_query: searchQuery,
        p_limit: PAGE_SIZE,
        p_offset: offset,
        p_categories: categoriesToUse.length > 0 ? categoriesToUse : null,
        p_status: statusFilter
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
          ...item,
          id: `${item.is_variant ? 'v' : 'p'}-${item.id}`,
          uuid: Number(item.id),
          stock: Number(item.stock) || 0,
          price: Number(item.price) || 0,
          cost_price: Number(item.cost_price) || 0,
          minQuantity: Number(item.min_quantity) || 0,
          specifications: specs,
          tags: item.tags || [],
          notes: item.notes || '',
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

  // ── fetchInventoryStats ─────────────────────────────────────────────────────
  fetchInventoryStats: async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;
      set({ aggregateStats: data });
    } catch (err) {
      console.error('[inventoryStore] Error fetching inventory stats:', err);
    }
  },
}));
