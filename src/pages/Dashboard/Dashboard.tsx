import { useState, useEffect } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import { useInventory } from '../../hooks/useInventory';
import { useCategories } from '../../hooks/useCategories';
import { useSuppliers } from '../../hooks/useSuppliers';

import { Menu } from 'lucide-react';
import styles from './Dashboard.module.css';
import { supabase } from '../../lib/supabase';
import type { InventoryItem } from '../../types/inventory';
import Sidebar from './components/Sidebar';
import type { DashboardView } from './components/Sidebar';
import InventoryManager from './components/InventoryManager';
import Overview from './components/Overview';
import EditItemModal from './components/EditItemModal';
import Pos from './components/Pos';
import SalesHistory from './components/SalesHistory';
import Analytics from './components/Analytics';
import Suppliers from './components/Suppliers';
import Settings from './components/Settings';
import WorkOrders from './components/WorkOrders';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import AddVariantModal from './components/AddVariantModal';

interface DashboardProps {
  onGoToHome?: () => void;
  onLogout?: () => void;
}

/**
 * Dashboard component - Main application dashboard with navigation and inventory management
 * @param onGoToHome - Callback function to navigate back to home page
 * @param onLogout - Callback function to handle user logout
 */
export default function Dashboard({ onGoToHome, onLogout }: DashboardProps) {
  // ── Inventory state from Zustand store (single source of truth) ──────────
  const { items, fetchInventory, isLoading, error } = useInventoryStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { categories, fetchCategories } = useCategories();

  // Mutator hook
  const { confirmDelete: _confirmDelete, handleSave: _handleSave } = useInventory(suppliers);
  
  // View State
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Variant Modal State
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client is not initialized.");
      return;
    }
    fetchInventory();
    fetchSuppliers();
    fetchCategories();
  }, []);

  // Inventory data is fetched and managed by useInventoryStore.fetchInventory().
  // Dashboard reads items directly from the store via destructuring above.

  /**
   * Handle delete operation for an inventory item
   * Opens delete confirmation modal with the selected item
   * @param id - The ID of the item to delete
   */
  const handleDelete = (id: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
    }
  };

  /**
   * Confirm and execute the delete operation
   * Removes product from database and updates local state
   */
  /**
   * Confirm and execute the delete operation
   * Removes product or variant from database and updates local state
   */
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const { error } = await _confirmDelete(itemToDelete);
    if (error) {
      alert(`Error deleting item: ${error.message}`);
    }

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  /**
   * Handle edit click for an inventory item
   * Opens edit modal with the selected item data
   * @param item - The item to edit (passed directly from table to avoid ID collisions)
   */
  const handleEditClick = (item: InventoryItem) => {
    setEditingItem({ ...item }); // Clone to avoid direct mutation
    setIsEditModalOpen(true);
  };

  /**
   * Handle modal close operation
   * Resets modal state and clears editing item
   */
  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  /**
   * Handle add new item operation
   * Opens edit modal with empty item template for creation
   */
  const handleAddItem = () => {
    setEditingItem({
      id: 0,
      name: '',
      sku: '',
      category: '',
      price: 0,
      stock: 0,
      minQuantity: 0,
    });
    setIsEditModalOpen(true);
  };

  /**
   * Handle save operation for create/update automotive lights
   * Creates new items or updates existing ones in the database
   * @param updatedItem - The item data to save (create or update)
   */
  const handleSave = async (updatedItem: InventoryItem, variants?: any[]) => {
    const { error } = await _handleSave(updatedItem, variants, () => {
      handleModalClose();
    });

    if (error) {
      alert(`Error saving item: ${error.message}`);
    }
  };

  /**
   * Open the modal to select a parent item for adding a variant
   */
  const handleAddVariantClick = () => {
    setIsAddVariantModalOpen(true);
  };

  /**
   * Handle selection of parent item for variant addition
   * Opens the edit modal for that item with has_variants=true
   */
  const handleSelectParentItem = (item: InventoryItem) => {
    setIsAddVariantModalOpen(false);
    // Open edit modal for this item, forcing has_variants to true so the UI shows
    setEditingItem({ ...item, has_variants: true });
    setIsEditModalOpen(true);
  };


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
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onGoToHome={onGoToHome} 
        onLogout={onLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* MOBILE HEADER */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileLogo} onClick={onGoToHome}>
          <img src="/kenslogo.jpg" alt="KEN'S GARAGE" className={styles.mobileLogoImage} />
        </div>
        <button className={styles.menuBtn} onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className={`${styles.main} ${activeView === 'pos' ? styles.posView : ''}`}>
        <div key={activeView} className={styles.pageContainer}>
          {activeView === 'overview' && <Overview items={items} />}
          
          {activeView === 'analytics' && <Analytics />}

          {activeView === 'pos' && <Pos items={items} isLoading={isLoading} onSaleComplete={fetchInventory} />}
          
          {activeView === 'inventory' && (
            <InventoryManager
              items={items}
              isLoading={isLoading}
              onAddItem={handleAddItem}
              onAddVariant={handleAddVariantClick}
              onEdit={handleEditClick}
              onDelete={handleDelete}
            />
          )}

          {activeView === 'sales' && <SalesHistory />}
          
          {activeView === 'suppliers' && <Suppliers />}
          
          {activeView === 'work-orders' && <WorkOrders />}
          
          {activeView === 'settings' && <Settings items={items} onEdit={handleEditClick} onDelete={handleDelete} onCategoryAdded={fetchCategories} />}
        </div>
      </main>

      {/* EDIT MODAL */}
      <EditItemModal 
        isOpen={isEditModalOpen}
        item={editingItem}
        categories={categories}
        variantTypes={Array.from(new Set([
          ...items.map(i => i.variant_type).filter(Boolean) as string[]
        ])).sort()}
        allItems={items}
        suppliers={suppliers.map(s => s.name)}
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
        hasVariants={itemToDelete?.has_variants || false}
      />

      {/* ADD VARIANT SELECTION MODAL */}
      <AddVariantModal
        isOpen={isAddVariantModalOpen}
        onClose={() => setIsAddVariantModalOpen(false)}
        onSelect={handleSelectParentItem}
        items={items}
      />
    </div>
  );
}
