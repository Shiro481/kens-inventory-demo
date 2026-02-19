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

  const allAvailableTags = Array.from(new Set(items.flatMap(item => item.tags || []))).sort();

  const filteredItems = filterAndSortItems(
    items,
    filterStatus,
    searchQuery,
    selectedTags,
    sortBy
  );

  const handleExport = () => exportToCSV(filteredItems);

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
          />
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
