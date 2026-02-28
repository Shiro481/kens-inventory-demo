import { supabase } from '../lib/supabase';
import type { InventoryItem } from '../types/inventory';
import { exportToExcel } from './inventoryUtils';

/**
 * Fetches all items matching the current search query and category filters,
 * ignoring client-side pagination limits, and exports them to an Excel file.
 */
export const exportAllItems = async (
  searchQuery: string = '',
  categories: string[] = [],
  tags: string[] = [], // client-side filter
  status: 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock' = 'All' // client-side filter
): Promise<void> => {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  try {
    // Make a one-off RPC call with a very large limit to get ALL matching items
    // Since we only do this explicitly on button click, the performance hit is acceptable
    const { data, error } = await supabase.rpc('search_inventory_v2', {
      p_search_query: searchQuery,
      p_limit: 50000, // Arbitrarily high limit to ensure we get everything
      p_offset: 0,
      p_categories: categories.length > 0 ? categories : null,
      p_status: status,
    });

    if (error) {
      throw error;
    }

    // Process the raw data exactly as we do in the inventory store
    let allItems: InventoryItem[] = (data || []).map((item: any) => {
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

    // Apply the remaining client-side filters (Status and Tags) to match the current view
    // The server handles Search, Category, and Status, but we must manually handle Tags:
    
    if (tags.length > 0) {
        allItems = allItems.filter(item => {
            const itemTags = (item.tags || []).map((t: string) => t.toLowerCase());
            return tags.every(tag => itemTags.includes(tag.toLowerCase()));
        });
    }

    // Exclude Parent Containers (Product Families), just like filterAndSortItems does
    allItems = allItems.filter(item => {
        if (item.has_variants && !item.is_variant) return false;
        return true;
    });

    // Finally, pass the full list to the existing Excel generator
    exportToExcel(allItems);

  } catch (err) {
    console.error('Failed to export all items:', err);
    throw err; // Re-throw so the UI can catch it and handle loading states
  }
};
