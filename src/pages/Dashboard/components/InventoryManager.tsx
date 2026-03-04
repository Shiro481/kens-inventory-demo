import { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import styles from '../Dashboard.module.css';
import type { InventoryItem } from '../../../types/inventory';
import InventoryTable from './InventoryTable';
import { filterAndSortItems } from '../../../utils/inventoryUtils';
import { exportAllItems } from '../../../utils/exportAllItems';
import type { FilterStatus, SortBy } from '../../../utils/inventoryUtils';
import { useInventoryStore } from '../../../store/inventoryStore';

// Sub-components
import InventoryManagerHeader from './InventoryManagerHeader';
import FilterMenu from './FilterMenu';

interface InventoryManagerProps {
  items: InventoryItem[];
  globalCategories?: string[];
  isLoading?: boolean;
  onAddItem: () => void;
  onAddVariant: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: number) => void;
}

export default function InventoryManager({ 
  items, 
  globalCategories = [],
  isLoading = false,
  onAddItem, 
  onAddVariant, 
  onEdit, 
  onDelete 
}: InventoryManagerProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [searchInput, setSearchInput] = useState(''); // Fast local state for typing
  const [searchQuery, setSearchQuery] = useState(''); // Debounced state for fetching
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const { fetchInventory } = useInventoryStore();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400); // 400ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Trigger server-side fetch when debounced search query OR category filter changes
  useEffect(() => {
    fetchInventory(searchQuery, true, selectedCategories, filterStatus);
  }, [searchQuery, selectedCategories, filterStatus, fetchInventory]);

  const allAvailableTags = Array.from(new Set(items.flatMap(item => item.tags || []))).sort();
  // Override paginated map mapping with the true global categories array
  const allAvailableCategories = globalCategories.length > 0 
    ? [...globalCategories].sort()
    : Array.from(new Set(items.map(item => item.category).filter(Boolean) as string[])).sort();

  // Pass empty string for text search to `filterAndSortItems` because the
  // text search is now handled by the server-side RPC. We keep client-side
  // filtering for tags.
  const filteredItems = filterAndSortItems(
    items,
    'All', // Status is now handled server-side, keep it 'All' for client-side to prevent double-filtering 
    '', // bypass client text search
    selectedTags,
    sortBy,
    [] // Categories are handled server-side
  );

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // Wait for fetch & export
      await exportAllItems(searchQuery, selectedCategories, selectedTags, filterStatus, allAvailableCategories);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export inventory. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const activeFilterCount = (filterStatus !== 'All' ? 1 : 0) + selectedTags.length + selectedCategories.length;

  return (
    <>
      <InventoryManagerHeader onAddItem={onAddItem} onAddVariant={onAddVariant} />

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={18} color="#666" />
          <input 
            type="text" 
            placeholder="Search items..." 
            className={styles.input}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={styles.filterBtn}
            onClick={handleExport}
            disabled={isExporting}
            title="Export full inventory to Excel"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isExporting ? 0.7 : 1 }}
          >
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Export All Items'}
          </button>

          <FilterMenu 
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showFilterMenu={showFilterMenu}
            setShowFilterMenu={setShowFilterMenu}
            allAvailableTags={allAvailableTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            allAvailableCategories={allAvailableCategories}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            activeFilterCount={activeFilterCount}
          />
        </div>
      </div>

      {/* ACTIVE FILTER CHIPS */}
      {(selectedCategories.length > 0 || selectedTags.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 0 10px 0' }}>
          {selectedCategories.map(cat => (
            <span
              key={cat}
              onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}
              style={{
                fontSize: '10px', padding: '3px 10px', borderRadius: '12px',
                background: 'rgba(0,255,157,0.15)', border: '1px solid rgba(0,255,157,0.4)',
                color: '#00ff9d', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
              title="Remove filter"
            >
              {cat} ×
            </span>
          ))}
          {selectedTags.map(tag => (
            <span
              key={tag}
              onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
              style={{
                fontSize: '10px', padding: '3px 10px', borderRadius: '12px',
                background: 'rgba(255,152,0,0.15)', border: '1px solid rgba(255,152,0,0.4)',
                color: '#ff9800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
              title="Remove filter"
            >
              #{tag} ×
            </span>
          ))}
        </div>
      )}

      <InventoryTable
        key="inventory-table"
        items={filteredItems}
        isLoading={isLoading}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
