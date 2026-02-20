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

/**
 * Export items to CSV
 */
export const exportToCSV = (items: InventoryItem[]) => {
  const headers = [
    'Name', 'SKU', 'Category', 'Brand', 'Price', 'Cost Price', 
    'Stock', 'Min Stock', 'Type / Size', 'Color Temperature', 
    'Supplier', 'Status', 'Notes'
  ];

  const rows = items.map(item => [
    `"${(item.name || '').replace(/"/g, '""')}"`,
    `"${(item.sku || '').replace(/"/g, '""')}"`,
    `"${(item.category || '').replace(/"/g, '""')}"`,
    `"${(item.brand || '').replace(/"/g, '""')}"`,
    item.price || 0,
    item.cost_price || 0,
    item.stock ?? item.quantity ?? 0,
    item.minQuantity ?? item.min_qty ?? 10,
    `"${(item.variant_type || '').replace(/"/g, '""')}"`,
    `"${(item.color_temperature || '').toString().replace(/"/g, '""')}"`,
    `"${(item.supplier || '').replace(/"/g, '""')}"`,
    `"${getStatus(item)}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
