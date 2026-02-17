import { useState } from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';
import styles from '../Dashboard.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { getStatus } from '../../../types/inventory';
import InventoryTable from './InventoryTable';

interface InventoryManagerProps {
  items: InventoryItem[];
  onAddItem: () => void;
  onAddVariant: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: number) => void;
}

export default function InventoryManager({ 
  items, 
  onAddItem, 
  onAddVariant, 
  onEdit, 
  onDelete 
}: InventoryManagerProps) {
  const [filterStatus, setFilterStatus] = useState<'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'none' | 'price-asc' | 'price-desc' | 'category' | 'newest' | 'oldest'>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags from items
  const allAvailableTags = Array.from(new Set(items.flatMap(item => item.tags || []))).sort();

  /**
   * Filter, search, and sort inventory items based on current state
   * Returns processed array of items for display
   * 
   * Processing Pipeline:
   * 1. Filter by Status (In Stock, Low Stock, Out of Stock)
   * 2. Filter by Search Query (Name, SKU, Category)
   * 3. Sort by criteria (Price, Newest, etc.)
   */
  const filteredItems = items
    .filter(item => {
      // --- 1. Filter by Status ---
      if (filterStatus !== 'All') {
        const status = getStatus(item);
        if (status !== filterStatus) return false;
      }
      
      // --- 2. Filter by Search Query ---
      // Supports multi-word searching across multiple fields
      if (searchQuery.trim() !== '') {
        const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        
        // Create a single searchable string for the item
        const searchableString = [
          item.name,
          item.sku,
          item.category,
          item.brand,
          item.variant_type,
          item.color_temperature?.toString(),
          item.notes,
          item.tags?.join(' '),
          item.specifications ? JSON.stringify(item.specifications) : ''
        ].join(' ').toLowerCase();

        // Check if EVERY word in the search query matches SOMETHING in the searchable string
        const allWordsMatch = queryWords.every(word => searchableString.includes(word));
        
        if (!allWordsMatch) {
          return false;
        }
      }

      // --- 3. Filter by Tags ---
      if (selectedTags.length > 0) {
        const itemTags = item.tags || [];
        const hasAllTags = selectedTags.every(tag => itemTags.includes(tag));
        if (!hasAllTags) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // --- 3. Sort Results ---
      
      // Price Sorting
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      
      // Category Alphabetical Sorting
      if (sortBy === 'category') {
        const catA = (a.category || '').toLowerCase();
        const catB = (b.category || '').toLowerCase();
        return catA.localeCompare(catB);
      }
      
      // Date Sorting (Newest/Oldest)
      // Falls back to ID if created_at is missing, assuming serial IDs or similar order
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
      
      return 0; // Default: no specific sort order
    });

  /**
   * Export the currently filtered and sorted items to a CSV file
   */
  const exportToCSV = () => {
    // Define headers
    const headers = [
      'Name',
      'SKU',
      'Category',
      'Brand',
      'Price',
      'Cost Price',
      'Stock',
      'Min Stock',
      'Type / Size',
      'Color Temperature',
      'Supplier',
      'Status',
      'Notes'
    ];

    // Map items to rows
    const rows = filteredItems.map(item => [
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

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Filename with timestamp
    const date = new Date().toISOString().split('T')[0];
    const filename = `inventory_export_${date}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Dashboard</h1>
          <p>Welcome back, Ken. Here's what's happening efficiently.</p>
        </div>
        <div className={styles.buttonGroup} style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={styles.addButton} 
            onClick={onAddVariant}
            style={{ backgroundColor: 'transparent', border: '1px solid #333', color: '#888' }}
          >
            <Plus size={16} />
            Add Variant
          </button>
          <button className={styles.addButton} onClick={onAddItem}>
            <Plus size={18} />
            Add New Item
          </button>
        </div>
      </header>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={18} color="#666" />
          <input 
            type="text" 
            placeholder="Search items..." 
            className={styles.input}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={styles.filterBtn}
            onClick={exportToCSV}
            title="Export to CSV"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={18} />
            Export
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              className={styles.filterBtn}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter size={18} />
              {filterStatus === 'All' ? 'Filters' : filterStatus}
            </button>
            
            {showFilterMenu && (
              <div className={styles.filterMenu}>
                <div style={{ padding: '8px 16px', fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Filter by Status
                </div>
                <div 
                  className={`${styles.filterOption} ${filterStatus === 'All' ? styles.activeFilter : ''}`}
                  onClick={() => { setFilterStatus('All'); setShowFilterMenu(false); }}
                >
                  All Items
                </div>
                <div 
                  className={`${styles.filterOption} ${filterStatus === 'In Stock' ? styles.activeFilter : ''}`}
                  onClick={() => { setFilterStatus('In Stock'); setShowFilterMenu(false); }}
                >
                  In Stock
                </div>
                <div 
                  className={`${styles.filterOption} ${filterStatus === 'Low Stock' ? styles.activeFilter : ''}`}
                  onClick={() => { setFilterStatus('Low Stock'); setShowFilterMenu(false); }}
                >
                  Low Stock
                </div>
                <div 
                  className={`${styles.filterOption} ${filterStatus === 'Out of Stock' ? styles.activeFilter : ''}`}
                  onClick={() => { setFilterStatus('Out of Stock'); setShowFilterMenu(false); }}
                >
                  Out of Stock
                </div>
                
                <div style={{ borderTop: '1px solid #333', margin: '8px 0' }}></div>
                <div style={{ padding: '8px 16px', fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Filter by Tags
                </div>
                {allAvailableTags.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px 16px' }}>
                    {allAvailableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTags(prev => 
                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                          );
                        }}
                        style={{
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          border: '1px solid #333',
                          background: selectedTags.includes(tag) ? '#00ff9d' : 'transparent',
                          color: selectedTags.includes(tag) ? '#000' : '#888',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {tag.toUpperCase()}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '8px 16px', fontSize: '10px', color: '#444', fontStyle: 'italic' }}>
                    No tags found. Add tags by editing an item.
                  </div>
                )}

                <div style={{ borderTop: '1px solid #333', margin: '8px 0' }}></div>
                
                <div style={{ padding: '8px 16px', fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Sort by
                </div>
                <div 
                  className={`${styles.filterOption} ${sortBy === 'none' ? styles.activeFilter : ''}`}
                  onClick={() => { setSortBy('none'); setShowFilterMenu(false); }}
                >
                  Default Order
                </div>
                <div 
                  className={`${styles.filterOption} ${sortBy === 'price-asc' ? styles.activeFilter : ''}`}
                  onClick={() => { setSortBy('price-asc'); setShowFilterMenu(false); }}
                >
                  Price: Low to High
                </div>
                <div 
                  className={`${styles.filterOption} ${sortBy === 'price-desc' ? styles.activeFilter : ''}`}
                  onClick={() => { setSortBy('price-desc'); setShowFilterMenu(false); }}
                >
                  Price: High to Low
                </div>
                <div 
                  className={`${styles.filterOption} ${sortBy === 'category' ? styles.activeFilter : ''}`}
                  onClick={() => { setSortBy('category'); setShowFilterMenu(false); }}
                >
                  Category (A-Z)
                </div>
                <div 
                  className={`${styles.filterOption} ${sortBy === 'newest' ? styles.activeFilter : ''}`}
                  onClick={() => { setSortBy('newest'); setShowFilterMenu(false); }}
                >
                  Newest First
                </div>
                <div 
                  className={`${styles.filterOption} ${sortBy === 'oldest' ? styles.activeFilter : ''}`}
                  onClick={() => { setSortBy('oldest'); setShowFilterMenu(false); }}
                >
                  Oldest First
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <InventoryTable 
        key={`${searchQuery}-${filterStatus}-${sortBy}`}
        items={filteredItems}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
