import type { InventoryItem } from '../types/inventory';
import { getStatus } from '../types/inventory';

export type FilterStatus = 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock';
export type SortBy = 'none' | 'price-asc' | 'price-desc' | 'category' | 'newest' | 'oldest';

/**
 * Filter and sort inventory items
 */
export const filterAndSortItems = (
  items: InventoryItem[],
  filterStatus: FilterStatus,
  searchQuery: string,
  selectedTags: string[],
  sortBy: SortBy,
  selectedCategories: string[] = []
): InventoryItem[] => {
  return items
    .filter(item => {
      // 1. Filter by Status
      if (filterStatus !== 'All') {
        if (getStatus(item) !== filterStatus) return false;
      }
      
      // 2. Filter by Search Query
      if (searchQuery.trim() !== '') {
        const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        const searchableString = [
          item.name,
          item.sku,
          item.category,
          item.brand,
          item.variant_type,
          item.variant_display_name,
          item.variant_color,
          item.color_temperature?.toString(),
          item.voltage?.toString(),
          item.wattage?.toString(),
          item.lumens?.toString(),
          item.notes,
          item.tags?.join(' '),
          item.specifications ? JSON.stringify(item.specifications) : ''
        ].join(' ').toLowerCase();

        if (!queryWords.every(word => searchableString.includes(word))) return false;
      }

      // 3. Filter by Tags
      if (selectedTags.length > 0) {
        const itemTags = item.tags || [];
        if (!selectedTags.every(tag => itemTags.includes(tag))) return false;
      }

      // 4. Filter by Category
      if (selectedCategories.length > 0) {
        const itemCategory = (item.category || '').toLowerCase();
        if (!selectedCategories.some(cat => cat.toLowerCase() === itemCategory)) return false;
      }
      
      // 5. Exclude Parent Containers (Product Families)
      // Only show Single Products or specific Variants in the main list
      if (item.has_variants && !item.is_variant) return false;
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      
      if (sortBy === 'category') {
        return (a.category || '').toLowerCase().localeCompare((b.category || '').toLowerCase());
      }
      
      if (sortBy === 'newest') {
        const timeA = (a as any).created_at ? new Date((a as any).created_at).getTime() : a.id;
        const timeB = (b as any).created_at ? new Date((b as any).created_at).getTime() : b.id;
        return timeB - timeA;
      }
      
      if (sortBy === 'oldest') {
        const timeA = (a as any).created_at ? new Date((a as any).created_at).getTime() : a.id;
        const timeB = (b as any).created_at ? new Date((b as any).created_at).getTime() : b.id;
        return timeA - timeB;
      }
      
      return 0;
    });
};

import * as XLSX from 'xlsx';

/**
 * Build a flat row array from one InventoryItem
 */
const itemToRow = (item: InventoryItem) => ({
  'Name':              item.name || '',
  'SKU':               item.sku || '',
  'Brand':             item.brand || '',
  'Variant / Type':    item.variant_type || '',
  'Color Temp':        item.color_temperature ? String(item.color_temperature) : '',
  'Price':             item.price || 0,
  'Cost Price':        item.cost_price || 0,
  'Stock':             item.stock ?? item.quantity ?? 0,
  'Min Stock':         item.minQuantity ?? item.min_qty ?? 0,
  'Supplier':          item.supplier || '',
  'Status':            getStatus(item),
  'Notes':             item.notes || '',
});

/**
 * Export items to Excel (.xlsx) with one sheet per category + an "All Items" summary sheet.
 */
export const exportToExcel = (items: InventoryItem[]) => {
  const wb = XLSX.utils.book_new();

  // ── All Items (summary sheet always first) ─────────────────────────────────
  const allRows = items.map(itemToRow);
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  applyColumnWidths(wsAll, allRows);
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Items');

  // ── One sheet per category, sorted alphabetically ─────────────────────────
  const byCategory = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const cat = (item.category || 'Uncategorized').trim();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  Object.keys(byCategory).sort().forEach(category => {
    const rows = byCategory[category].map(itemToRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    applyColumnWidths(ws, rows);
    // Sheet names max 31 chars, no special chars
    const sheetName = category.replace(/[\\/*?[\]:]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const filename = `inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/** Auto-size column widths based on content */
function applyColumnWidths(ws: XLSX.WorkSheet, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const colKeys = Object.keys(rows[0]);
  ws['!cols'] = colKeys.map(key => ({
    wch: Math.max(
      key.length,
      ...rows.map(r => String(r[key] ?? '').length)
    ) + 2
  }));
}

/**
 * Cleans an item name by stripping redundant variant details (color, type, temp).
 * Used to avoid "Wiper Blade - Green" redundancy when "Color: Green" is already in sub-info.
 */
export const cleanItemName = (item: InventoryItem): string => {
  let name = item.name || '';
  if (!item.is_variant) return name;

  const toStrip = [
    item.variant_type,
    item.variant_color,
    item.color_temperature ? String(item.color_temperature) : null
  ].filter(Boolean);

  toStrip.forEach(val => {
    // Strip words with length > 2 to avoid over-cleaning specific letters/numbers
    const words = String(val).toLowerCase().split(/\s+/).filter(w => w.length > 2);
    words.forEach(word => {
      // Use word boundary regex to replace exact matches
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      name = name.replace(regex, '');
    });
  });

  // Cleanup: remove extra dashes, multiple spaces, leading/trailing non-alphanumerics
  const cleaned = name
    .replace(/\s+-/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^-\s+/, '')
    .trim();

  // Fallback to original name if cleaning results in empty string or too short
  return cleaned.length > 2 ? cleaned : item.name;
};
