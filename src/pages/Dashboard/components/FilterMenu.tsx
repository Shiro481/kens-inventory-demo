import { Filter } from 'lucide-react';
import styles from '../Dashboard.module.css';
import type { FilterStatus, SortBy } from '../../../utils/inventoryUtils';

interface FilterMenuProps {
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  showFilterMenu: boolean;
  setShowFilterMenu: (show: boolean) => void;
  allAvailableTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[] | ((prev: string[]) => string[])) => void;
  allAvailableCategories: string[];
  selectedCategories: string[];
  setSelectedCategories: (cats: string[] | ((prev: string[]) => string[])) => void;
  activeFilterCount?: number;
}

export default function FilterMenu({
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  showFilterMenu,
  setShowFilterMenu,
  allAvailableTags,
  selectedTags,
  setSelectedTags,
  allAvailableCategories,
  selectedCategories,
  setSelectedCategories,
  activeFilterCount = 0
}: FilterMenuProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button 
        className={styles.filterBtn}
        onClick={() => setShowFilterMenu(!showFilterMenu)}
        style={{ position: 'relative' }}
      >
        <Filter size={18} />
        Filters
        {activeFilterCount > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px',
            background: '#00ff9d', color: '#000', borderRadius: '50%',
            width: '16px', height: '16px', fontSize: '9px', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {activeFilterCount}
          </span>
        )}
      </button>
      
      {showFilterMenu && (
        <div className={styles.filterMenu}>

          {/* CATEGORY FILTER */}
          <div style={{ padding: '8px 16px', fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Filter by Category
          </div>
          {allAvailableCategories.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px 16px 8px' }}>
              {allAvailableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategories((prev: string[]) =>
                      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                    );
                  }}
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    background: selectedCategories.includes(cat) ? '#00ff9d' : 'transparent',
                    color: selectedCategories.includes(cat) ? '#000' : '#888',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: '4px 16px 8px', fontSize: '10px', color: '#444', fontStyle: 'italic' }}>
              No categories found.
            </div>
          )}

          <div style={{ borderTop: '1px solid #333', margin: '4px 0' }}></div>

          {/* STATUS FILTER */}
          <div style={{ padding: '8px 16px', fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Filter by Status
          </div>
          {(['All', 'In Stock', 'Low Stock', 'Out of Stock'] as FilterStatus[]).map(status => (
            <div 
              key={status}
              className={`${styles.filterOption} ${filterStatus === status ? styles.activeFilter : ''}`}
              onClick={() => { setFilterStatus(status); setShowFilterMenu(false); }}
            >
              {status === 'All' ? 'All Items' : status}
            </div>
          ))}
          
          <div style={{ borderTop: '1px solid #333', margin: '8px 0' }}></div>

          {/* TAG FILTER */}
          <div style={{ padding: '8px 16px', fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Filter by Tags
          </div>
          {allAvailableTags.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px 16px 8px' }}>
              {allAvailableTags.map(tag => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTags((prev: string[]) => 
                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                    );
                  }}
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    background: selectedTags.includes(tag) ? '#ff9800' : 'transparent',
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
            <div style={{ padding: '4px 16px 8px', fontSize: '10px', color: '#444', fontStyle: 'italic' }}>
              No tags found.
            </div>
          )}

          <div style={{ borderTop: '1px solid #333', margin: '4px 0' }}></div>
          
          {/* SORT */}
          <div style={{ padding: '8px 16px', fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Sort by
          </div>
          {[
            { label: 'Default Order', value: 'none' },
            { label: 'Price: Low to High', value: 'price-asc' },
            { label: 'Price: High to Low', value: 'price-desc' },
            { label: 'Category (A-Z)', value: 'category' },
            { label: 'Newest First', value: 'newest' },
            { label: 'Oldest First', value: 'oldest' }
          ].map(sort => (
            <div 
              key={sort.value}
              className={`${styles.filterOption} ${sortBy === sort.value ? styles.activeFilter : ''}`}
              onClick={() => { setSortBy(sort.value as SortBy); setShowFilterMenu(false); }}
            >
              {sort.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
