import { useState, useEffect } from 'react';

import { Plus, Search, Filter, Menu } from 'lucide-react';
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
import Settings from './components/Settings';
import WorkOrders from './components/WorkOrders';
import DeleteConfirmModal from './components/DeleteConfirmModal';

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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  /**
   * Fetch automotive lights data from Supabase database
   * Updates the items state with fetched data or sets error state
   * Fetches both base products and all variants from product_bulb_variants
   */
  async function fetchParts() {
    if (!supabase) return;

    try {
      // Fetch all products
      const { data: rawData, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories(name),
          bulb_types(code),
          suppliers(name)
        `);
      
      if (error) {
        console.error('Error fetching products:', error);
        setError(`Error fetching products: ${error.message}`);
        return;
      }

      // Fetch ALL variants from product_bulb_variants table
      const { data: allVariants, error: variantsError } = await supabase
        .from('product_bulb_variants')
        .select('*');
      
      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
      }

      console.log(`📦 [Dashboard] Fetched ${rawData.length} products and ${allVariants?.length || 0} variants`);

      const allItems: InventoryItem[] = [];
      
      // Add ALL base products (including those with variants)
      for (const item of rawData) {
        const baseItem = {
          id: parseInt(item.id.toString().replace('-', '').substring(0, 8), 16) % 1000000,
          uuid: item.id,
          name: item.name,
          sku: item.sku,
          price: item.selling_price,
          stock: item.stock_quantity,
          quantity: item.stock_quantity,
          minQuantity: item.min_stock_level,
          min_qty: item.min_stock_level,
          category: item.product_categories?.name,
          brand: item.brand,
          description: item.description,
          image_url: item.image_url,
          barcode: item.barcode,
          cost_price: item.cost_price,
          voltage: item.voltage,
          wattage: item.wattage,
          color_temperature: item.color_temperature,
          lumens: item.lumens,
          beam_type: item.beam_type,
          bulb_type: item.bulb_type || item.specifications?.socket || item.bulb_types?.code,
          specifications: item.specifications,
          supplier: item.suppliers?.name,
          has_variants: item.has_variants,
          variant_count: 0,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
        
        // Add ALL base products
        allItems.push(baseItem);
      }
      
      // Now add ALL variants as separate items
      if (allVariants && allVariants.length > 0) {
        for (const variant of allVariants) {
          // Find the parent product
          const parentProduct = rawData.find((p: any) => p.id === variant.product_id);
          
          if (parentProduct) {
            const variantItem: InventoryItem = {
              id: parseInt(variant.id.toString().replace('-', '').substring(0, 8), 16) % 1000000,
              uuid: variant.id,
              name: `${parentProduct.name} - ${variant.bulb_type}${variant.color_temperature ? ` (${variant.color_temperature}K)` : ''}`,
              sku: variant.variant_sku || `${parentProduct.sku}-${variant.id}`,
              price: variant.selling_price,
              stock: variant.stock_quantity,
              quantity: variant.stock_quantity,
              minQuantity: variant.min_stock_level,
              min_qty: variant.min_stock_level,
              category: parentProduct.product_categories?.name,
              brand: parentProduct.brand,
              description: parentProduct.description,
              image_url: parentProduct.image_url,
              barcode: variant.variant_sku,
              cost_price: variant.cost_price,
              voltage: parentProduct.voltage,
              wattage: parentProduct.wattage,
              color_temperature: variant.color_temperature,
              lumens: parentProduct.lumens,
              beam_type: parentProduct.beam_type,
              bulb_type: variant.bulb_type,
              specifications: parentProduct.specifications,
              supplier: parentProduct.suppliers?.name,
              has_variants: false,
              variant_count: 0,
              variant_id: variant.id,
              variant_display_name: `${variant.bulb_type}${variant.color_temperature ? ` (${variant.color_temperature}K)` : ''}`,
              is_variant: true,
              parent_product_id: variant.product_id,
              created_at: variant.created_at,
              updated_at: variant.updated_at
            };
            
            allItems.push(variantItem);
            console.log(`  ➕ [Dashboard] Added variant: ${variantItem.name}`);
          } else {
            console.warn(`⚠️ [Dashboard] Variant ${variant.id} has no parent product`);
          }
        }
      }
      
      console.log(`📦 [Dashboard] Total items in inventory: ${allItems.length}`);
      setItems(allItems);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while fetching data.');
    }
  }

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
  const confirmDelete = async () => {
    if (!supabase || !itemToDelete) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) {
        console.error('Error deleting product:', error);
        alert(`Error deleting product: ${error.message}`);
      } else {
        setItems(items.filter(item => item.id !== itemToDelete.id));
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred while deleting.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  /**
   * Handle edit click for an inventory item
   * Opens edit modal with the selected item data
   * @param id - The ID of the item to edit
   */
  const handleEditClick = (id: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setEditingItem({ ...item }); // Clone to avoid direct mutation
      setIsEditModalOpen(true);
    }
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

  /**
   * Handle save operation for create/update automotive lights
   * Creates new items or updates existing ones in the database
   * @param updatedItem - The item data to save (create or update)
   */
  const handleSave = async (updatedItem: InventoryItem) => {
    if (!supabase) return;

    // Use preferred min val
    const minVal = updatedItem.minQuantity ?? updatedItem.min_qty;
    const stockVal = updatedItem.stock ?? updatedItem.quantity;

    if (updatedItem.id === 0) {
      // CREATE NEW PRODUCT
      const payload: any = {
        name: updatedItem.name,
        sku: updatedItem.sku || null,
        barcode: updatedItem.barcode,
        brand: updatedItem.brand || 'Aftermarket',
        selling_price: updatedItem.price,
        cost_price: updatedItem.cost_price || 0,
        stock_quantity: stockVal,
        reorder_level: minVal || 10,
        min_stock_level: minVal || 5,
        description: updatedItem.description,
        image_url: updatedItem.image_url,
        voltage: updatedItem.voltage,
        wattage: updatedItem.wattage,
        color_temperature: updatedItem.color_temperature,
        lumens: updatedItem.lumens,
        beam_type: updatedItem.beam_type,
        has_variants: updatedItem.has_variants || false,
        specifications: { ...(updatedItem.specifications || {}), socket: updatedItem.bulb_type },
      };

      // First, get the category_id
      let categoryId = null;
      if (updatedItem.category) {
        const { data: categoryData } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', updatedItem.category)
          .single();
        categoryId = categoryData?.id;
      }

      if (categoryId) {
        payload.category_id = categoryId;
      }

      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select(`
          *,
          product_categories(name),
          bulb_types(code),
          suppliers(name)
        `);

      if (error) {
        console.error('Error creating product:', error);
        alert(`Error creating product: ${error.message}`);
      } else if (data && data[0]) {
        // Transform the new item to match InventoryItem interface
        const newItem = {
          id: parseInt(data[0].id.toString().replace('-', '').substring(0, 8), 16) % 1000000,
          uuid: data[0].id, // Crucial: Store real UUID for future updates
          name: data[0].name,
          sku: data[0].sku,
          price: data[0].selling_price,
          stock: data[0].stock_quantity,
          quantity: data[0].stock_quantity,
          minQuantity: data[0].min_stock_level,
          min_qty: data[0].min_stock_level,
          category: data[0].product_categories?.name,
          brand: data[0].brand,
          description: data[0].description,
          image_url: data[0].image_url,
          barcode: data[0].barcode,
          cost_price: data[0].cost_price,
          voltage: data[0].voltage,
          wattage: data[0].wattage,
          color_temperature: data[0].color_temperature,
          lumens: data[0].lumens,
          beam_type: data[0].beam_type,
          bulb_type: data[0].bulb_types?.code,
          supplier: data[0].suppliers?.name,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at
        };
        setItems([...items, newItem]);
      }
    } else {
      // UPDATE EXISTING PRODUCT
      const payload: any = {
        name: updatedItem.name,
        sku: updatedItem.sku,
        barcode: updatedItem.barcode,
        brand: updatedItem.brand,
        selling_price: updatedItem.price,
        cost_price: updatedItem.cost_price,
        stock_quantity: stockVal,
        reorder_level: minVal || 10,
        min_stock_level: minVal || 5,
        description: updatedItem.description,
        image_url: updatedItem.image_url,
        voltage: updatedItem.voltage,
        wattage: updatedItem.wattage,
        color_temperature: updatedItem.color_temperature,
        lumens: updatedItem.lumens,
        beam_type: updatedItem.beam_type,
        has_variants: updatedItem.has_variants || false,
        specifications: { ...(updatedItem.specifications || {}), socket: updatedItem.bulb_type },
      };

      // Update category if provided
      if (updatedItem.category) {
        const { data: categoryData } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', updatedItem.category)
          .single();
        if (categoryData) {
          payload.category_id = categoryData.id;
        }
      }

      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', updatedItem.uuid || updatedItem.id);
      
      if (error) {
        console.error('Error updating product:', error);
        alert(`Error saving: ${error.message}`);
      } else {
        // Refresh the data to get updated values
        fetchParts();
      }
    }
    
    handleModalClose();
  };

  /**
   * Filter, search, and sort inventory items based on current state
   * Returns processed array of items for display
   */
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
          
          {activeView === 'work-orders' && <WorkOrders />}
          
          {activeView === 'settings' && <Settings />}
        </div>
      </main>

      {/* EDIT MODAL */}
      <EditItemModal 
        isOpen={isEditModalOpen}
        item={editingItem}
        categories={Array.from(new Set([
          'Headlight', 'Fog Light', 'Signal Light', 'Interior Light', 'Brake Light',
          ...items.map(i => i.category).filter(Boolean) as string[]
        ]))}
        bulbTypes={Array.from(new Set([
          'H1', 'H3', 'H4', 'H7', 'H8', 'H9', 'H11', 'H13', 'H15', 'H16',
          '9005 (HB3)', '9006 (HB4)', '9012 (HIR2)', '880/881',
          'D1S', 'D2S', 'D3S', 'D4S',
          'T10 (W5W)', 'T15 (W16W)', 'T20 (7440/7443)', 'T25 (3156/3157)',
          '1156 (BA15S)', '1157 (BAY15D)', 'BA9S',
          'Festoon 31mm', 'Festoon 36mm', 'Festoon 39mm', 'Festoon 41mm',
          ...items.map(i => i.bulb_type).filter(Boolean) as string[]
        ])).sort()}
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
