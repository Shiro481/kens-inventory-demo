import { useState, useEffect } from 'react';

import { Plus, Search, Filter } from 'lucide-react';
import styles from './Dashboard.module.css';
import { supabase } from '../../lib/supabase';
import type { InventoryItem } from '../../types/inventory';
import { getStatus } from '../../types/inventory';
import Sidebar from './components/Sidebar';
import type { DashboardView } from './components/Sidebar';
import InventoryTable from './components/InventoryTable';
import EditItemModal from './components/EditItemModal';
import Overview from './components/Overview';
import Pos from './components/Pos';
import SalesHistory from './components/SalesHistory';
import Analytics from './components/Analytics';
import Suppliers from './components/Suppliers';
import DeleteConfirmModal from './components/DeleteConfirmModal';

interface DashboardProps {
  onGoToHome?: () => void;
  onLogout?: () => void;
}

export default function Dashboard({ onGoToHome, onLogout }: DashboardProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // View State
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'none' | 'price-asc' | 'price-desc' | 'category' | 'newest' | 'oldest'>('none');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!supabase) {
      setError("Supabase client is not initialized. Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    fetchParts();
  }, []);

  async function fetchParts() {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('Parts')
        .select('*');
      
      if (error) {
        console.error('Error fetching parts:', error);
        setError(`Error fetching parts: ${error.message}`);
      } else {
        setItems(data as unknown as InventoryItem[]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while fetching data.');
    }
  }

  const handleDelete = (id: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!supabase || !itemToDelete) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('Parts')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) {
        console.error('Error deleting item:', error);
        alert(`Error deleting item: ${error.message}`);
        fetchParts();
      } else {
        setItems(items.filter(item => item.id !== itemToDelete.id));
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEditClick = (id: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setEditingItem({ ...item }); // Clone to avoid direct mutation
      setIsEditModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleAddItem = () => {
    setEditingItem({
      id: 0, // 0 indicates a new item
      name: '',
      sku: '',
      category: '',
      price: 0,
      stock: 0,
      min_qty: 0,
      minQuantity: 0 // Init new column
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async (updatedItem: InventoryItem) => {
    if (!supabase) return;

    // Use preferred min val
    const minVal = updatedItem.minQuantity ?? updatedItem.min_qty;
    const stockVal = updatedItem.stock ?? updatedItem.quantity;

    if (updatedItem.id === 0) {
      // FOR CREATE: We don't know schema for sure if empty table, 
      // but usually we can try to insert into both or just prefer new?
      // Best bet: Check if items[0] exists to sniff schema, else assume 'minQuantity' is future.
      // But safe approach: insert object, let Supabase ignore unknown columns? No, it errors.
      // We will try to rely on 'items' having data. If empty, we might fail if we guess wrong column.
      // Let's assume 'minQuantity' is the target as requested.
      
      const payload: any = {
        name: updatedItem.name,
        sku: updatedItem.sku,
        category: updatedItem.category,
        price: updatedItem.price,
      };

      // We can check columns from a previous fetch if items.length > 0
      const sample = items[0];
      const keys = sample ? Object.keys(sample) : [];
      
      if (keys.includes('stock')) payload.stock = stockVal;
      else payload.quantity = stockVal;

      if (keys.includes('minQuantity')) payload.minQuantity = minVal;
      else payload.min_qty = minVal;

      const { data, error } = await supabase
        .from('Parts')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error creating item:', error);
        alert(`Error creating item: ${error.message}`);
      } else if (data) {
        setItems([...items, data[0] as unknown as InventoryItem]);
      }
    } else {
      // HANDLE UPDATE
      setItems(items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));

      // Simplified: Check keys on the original item we are updating
      const original = items.find(i => i.id === updatedItem.id);
      const keys = original ? Object.keys(original) : [];
      const payload: any = {
        name: updatedItem.name,
        sku: updatedItem.sku,
        category: updatedItem.category,
        price: updatedItem.price,
      };

      if (keys.includes('stock')) payload.stock = stockVal;
      else if (keys.includes('quantity')) payload.quantity = stockVal;

      if (keys.includes('minQuantity')) payload.minQuantity = minVal;
      else if (keys.includes('min_qty')) payload.min_qty = minVal;

      const { error } = await supabase
        .from('Parts')
        .update(payload)
        .eq('id', updatedItem.id);
      
      if (error) {
        console.error('Error updating item:', error);
        alert(`Error saving: ${error.message}`);
        fetchParts(); // Revert on error
      }
    }
    
    handleModalClose();
  };

  // Filter, search, and sort items
  const filteredItems = items
    .filter(item => {
      // Filter by status
      if (filterStatus !== 'All') {
        const status = getStatus(item);
        if (status !== filterStatus) return false;
      }
      
      // Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesSku = (item.sku || '').toLowerCase().includes(query);
        const matchesCategory = (item.category || '').toLowerCase().includes(query);
        
        if (!matchesName && !matchesSku && !matchesCategory) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'category') {
        const catA = (a.category || '').toLowerCase();
        const catB = (b.category || '').toLowerCase();
        return catA.localeCompare(catB);
      }
      if (sortBy === 'newest') {
        // Sort by created_at if available, otherwise by id (descending = newest first)
        const timeA = (a as any).created_at ? new Date((a as any).created_at).getTime() : a.id;
        const timeB = (b as any).created_at ? new Date((b as any).created_at).getTime() : b.id;
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        // Sort by created_at if available, otherwise by id (ascending = oldest first)
        const timeA = (a as any).created_at ? new Date((a as any).created_at).getTime() : a.id;
        const timeB = (b as any).created_at ? new Date((b as any).created_at).getTime() : b.id;
        return timeA - timeB;
      }
      return 0; // no sort
    });

  if (error) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <h2 style={{ color: '#ef4444' }}>Connection Error</h2>
        <p>{error}</p>
        <p style={{ color: '#888', marginTop: '10px' }}>
          Make sure you have created a <code>.env</code> file with your Supabase credentials.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Sidebar activeView={activeView} onViewChange={setActiveView} onGoToHome={onGoToHome} onLogout={onLogout} />

      {/* MAIN CONTENT */}
      <main className={`${styles.main} ${activeView === 'pos' ? styles.posView : ''}`}>
        <div key={activeView} className={styles.pageContainer}>
          {activeView === 'overview' && <Overview items={items} />}
          
          {activeView === 'analytics' && <Analytics />}

          {activeView === 'pos' && <Pos items={items} onSaleComplete={fetchParts} />}
          
          {activeView === 'inventory' && (
            <>
              <header className={styles.header}>
                <div className={styles.title}>
                  <h1>Dashboard</h1>
                  <p>Welcome back, Ken. Here's what's happening efficiently.</p>
                </div>
                <button className={styles.addButton} onClick={handleAddItem}>
                  <Plus size={18} />
                  Add New Item
                </button>
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

              {/* INVENTORY TABLE */}
              <InventoryTable 
                key={`${searchQuery}-${filterStatus}-${sortBy}`}
                items={filteredItems}
                onEdit={handleEditClick}
                onDelete={handleDelete}
              />
            </>
          )}

          {activeView === 'sales' && <SalesHistory />}
          
          {activeView === 'suppliers' && <Suppliers />}
          
          {activeView === 'settings' && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <h2>{activeView.toUpperCase()}</h2>
              <p>This module is coming soon.</p>
            </div>
          )}
        </div>
      </main>

      {/* EDIT MODAL */}
      <EditItemModal 
        isOpen={isEditModalOpen}
        item={editingItem}
        categories={Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[]}
        onClose={handleModalClose}
        onSave={handleSave}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        itemName={itemToDelete?.name || ''}
        loading={isDeleting}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
