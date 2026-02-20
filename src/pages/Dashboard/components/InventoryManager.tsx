import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import styles from '../Dashboard.module.css';
import type { InventoryItem } from '../../../types/inventory';
import InventoryTable from './InventoryTable';
import { filterAndSortItems, exportToCSV } from '../../../utils/inventoryUtils';
import type { FilterStatus, SortBy } from '../../../utils/inventoryUtils';

// Sub-components
import InventoryManagerHeader from './InventoryManagerHeader';
import FilterMenu from './FilterMenu';

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
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const allAvailableTags = Array.from(new Set(items.flatMap(item => item.tags || []))).sort();
  const allAvailableCategories = Array.from(
    new Set(items.map(item => item.category).filter(Boolean) as string[])
  ).sort();

  const filteredItems = filterAndSortItems(
    items,
    filterStatus,
    searchQuery,
    selectedTags,
    sortBy,
    selectedCategories
  );

  const handleExport = () => exportToCSV(filteredItems);

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={styles.filterBtn}
            onClick={handleExport}
            title="Export to CSV"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={18} />
            Export
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

      {/* INVENTORY TABLE */}
      <InventoryTable 
        key={`${searchQuery}-${filterStatus}-${sortBy}-${selectedCategories.join(',')}-${selectedTags.join(',')}`}
        items={filteredItems}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
