import { useState, useEffect } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';

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
  const { items, fetchInventory } = useInventoryStore();
  const removeItemOptimistically = useInventoryStore(s => s.removeItemOptimistically);

  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
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
      setError("Supabase client is not initialized. Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    fetchInventory();
    fetchSuppliers();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    if (!supabase) return;
    const { data } = await supabase.from('product_categories').select('name').order('name');
    if (data) {
      setCategories(data.map(c => c.name));
    }
  }

  async function fetchSuppliers() {
    if (!supabase) return;
    const { data } = await supabase.from('suppliers').select('*').order('name');
    if (data) setSuppliers(data);
  }

  /**
   * Fetch inventory data from Supabase database
   * Updates the items state with fetched data or sets error state
   * Fetches both base products and all variants from product_variants
   */
  /**
   * Helper to convert database ID to numeric ID for UI compatibility
   * Database uses bigint IDs (not UUIDs as originally assumed)
   * For variants, we add a large offset to ensure they don't collide with parent products
   */
  const generateNumericId = (dbId: any, isVariant: boolean = false): number => {
    const baseId = typeof dbId === 'number' ? dbId : parseInt(dbId);
    // For variants, add 10,000,000 to ensure no collision with parent products
    return isVariant ? baseId + 10000000 : baseId;
  };

  // fetchParts logic is now centralised in useInventoryStore.fetchInventory()
  // Dashboard uses the store's items directly via destructuring above.

  /**
   * Handle delete operation for an inventory item
   * Opens delete confirmation modal with the selected item
   * @param id - The ID of the item to delete
   */
  const handleDelete = (id: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      console.log('🔍 [handleDelete] Found item to delete:', {
        name: item.name,
        id: item.id,
        uuid: item.uuid,
        is_variant: item.is_variant,
        variant_id: item.variant_id,
        parent_product_id: item.parent_product_id,
        has_variants: item.has_variants
      });
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
    } else {
      console.error('❌ [handleDelete] Item not found with id:', id);
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
    if (!supabase || !itemToDelete) return;

    try {
      setIsDeleting(true);
      
      console.log('🗑️ [Delete] Attempting to delete:', {
        name: itemToDelete.name,
        id: itemToDelete.id,
        uuid: itemToDelete.uuid,
        is_variant: itemToDelete.is_variant,
        variant_id: itemToDelete.variant_id,
        parent_product_id: itemToDelete.parent_product_id
      });

      let error;

      // Multiple checks to determine if this is a variant (defensive programming)
      const isVariantItem = !!(
        itemToDelete.is_variant || 
        itemToDelete.variant_id || 
        itemToDelete.parent_product_id
      );

      if (isVariantItem) {
        // This is a VARIANT - delete from product_variants table
        const variantIdToDelete = itemToDelete.uuid;
        
        console.log('🔹 [Delete] Deleting VARIANT from product_variants, ID:', variantIdToDelete);
        
        const { error: variantError } = await supabase
          .from('product_variants')
          .delete()
          .eq('id', variantIdToDelete);
        error = variantError;
        
        if (!variantError) {
          console.log('✅ [Delete] Variant deleted successfully');
        }
      } else {
        // This is a PARENT PRODUCT - delete from products table
        // Safety check: prevent deleting products with variants

        
        const productIdToDelete = itemToDelete.uuid || itemToDelete.id;
        
        console.log('🔸 [Delete] Deleting PARENT PRODUCT from products, ID:', productIdToDelete);
        
        const { error: productError } = await supabase
          .from('products')
          .delete()
          .eq('id', productIdToDelete);
        error = productError;
        
        if (!productError) {
          console.log('✅ [Delete] Product deleted successfully');
        }
      }

      if (error) {
        console.error('❌ [Delete] Error deleting item:', error);
        alert(`Error deleting item: ${error.message}`);
      } else {
        // Optimistically remove from store immediately, then re-fetch for full sync
        removeItemOptimistically(itemToDelete.id, !isVariantItem);
        fetchInventory();
      }
    } catch (err: any) {
      console.error('❌ [Delete] Unexpected error:', err);
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
  const handleSave = async (updatedItem: InventoryItem, variants?: any[]) => {
    if (!supabase) return;

    // Normalize field values (handle backward compatibility/legacy field names)
    const minVal = updatedItem.minQuantity ?? updatedItem.min_qty;
    const stockVal = updatedItem.stock ?? updatedItem.quantity;

    // Resolve Supplier ID if name is provided
    let supplierId = null;
    if (updatedItem.supplier) {
        const s = suppliers.find(s => s.name === updatedItem.supplier);
        if (s) supplierId = s.id;
    }

    // --- CREATE NEW ITEM FLOW ---
    if (updatedItem.id === 0) {
      console.log('✨ [Save] Creating NEW product family:', updatedItem.name, 'with', variants?.length || 0, 'variants');
      
      // 1. Prepare payload for insertion
      const payload: any = {
        name: updatedItem.name,
        sku: updatedItem.sku || null,
        barcode: updatedItem.barcode,
        brand: updatedItem.brand || 'Aftermarket',
        selling_price: updatedItem.has_variants ? 0 : updatedItem.price,
        cost_price: updatedItem.has_variants ? 0 : (updatedItem.cost_price || 0),
        stock_quantity: updatedItem.has_variants ? 0 : stockVal,
        reorder_level: updatedItem.has_variants ? 0 : (minVal || 10),
        min_stock_level: updatedItem.has_variants ? 0 : (minVal || 5),
        description: updatedItem.description,
        image_url: updatedItem.image_url,
        voltage: updatedItem.voltage,
        wattage: updatedItem.wattage,
        color_temperature: updatedItem.color_temperature,
        lumens: updatedItem.lumens,
        beam_type: updatedItem.beam_type,
        has_variants: updatedItem.has_variants || false,
        specifications: { 
          ...(updatedItem.specifications || {}), 
          socket: updatedItem.variant_type,
          internal_notes: updatedItem.notes,
          tags: updatedItem.tags || []
        },
        supplier_id: supplierId
      };

      // 2. Resolve Category ID (Foreign Key)
      // The UI uses category names, but DB requires IDs
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

      // RESOLVE VARIANT TYPE ID
      let variantTypeId = null;
      if (updatedItem.variant_type) {
        const { data: variantTypeData } = await supabase
          .from('variant_categories')
          .select('id')
          .eq('code', updatedItem.variant_type)
          .maybeSingle();
          
        if (variantTypeData) {
            variantTypeId = variantTypeData.id;
        } else {
            // Create if not exists (Auto-add new variant types)
            const { data: newType } = await supabase
                .from('variant_categories')
                .insert({ code: updatedItem.variant_type, description: 'Created via App' })
                .select('id')
                .maybeSingle();
            if (newType) variantTypeId = newType.id;
        }
      }

      if (variantTypeId) {
        payload.variant_type_id = variantTypeId;
      }

      // 3. Insert into Database
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select(`
          *,
          product_categories(name),
          variant_categories(code),
          suppliers(name)
        `);

      if (error) {
        console.error('❌ [Save] Error creating product:', error);
        alert(`Error creating product: ${error.message}`);
      } else if (data && data[0]) {
        console.log('✅ [Save] Product record created with ID:', data[0].id);
        
        // 4. Update Local State
        // Transform the new item to match InventoryItem interface
        const newItem = {
          id: generateNumericId(data[0].id),
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
          variant_type: data[0].variant_categories?.code,
          supplier: data[0].suppliers?.name,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
          variant_count: 0,
          is_variant: false,
          notes: data[0].specifications?.internal_notes || ''
        };
        
        // 5. Insert Variants (if any)
        if (variants && variants.length > 0) {
            const newProductId = data[0].id;
            
            const variantInserts = variants.map(v => ({
                product_id: newProductId,
                variant_type: v.variant_type,
                variant_id: v.variant_id, 
                color_temperature: v.color_temperature ? String(v.color_temperature) : null,
                cost_price: Number(v.cost_price) || 0,
                selling_price: Number(v.selling_price) || 0,
                stock_quantity: Number(v.stock_quantity) || 0,
                min_stock_level: Number(v.min_stock_level) || 5,
                variant_color: v.variant_color,
                description: v.description,
                variant_sku: v.variant_sku,
                specifications: v.specifications || {}
            }));

            console.log('📦 [Save] Attempting to batch insert', variantInserts.length, 'variants');

            const { error: varError } = await supabase
                .from('product_variants')
                .insert(variantInserts);
            
            if (varError) {
                console.error('❌ [Save] Error adding variants:', varError);
                alert('Product created, but error adding variants: ' + varError.message);
            } else {
                console.log('✅ [Save] Variants batch inserted successfully');
            }
            // Always fetch to show new variants
            await fetchInventory();
        } else {
            // New standalone item — re-fetch to get the store in sync
            await fetchInventory();
        }
      }
    } else {
      // --- UPDATE EXISTING ITEM FLOW ---
      
      // Determine if this is a variant update (robust check)
      const isVariantUpdate = !!(updatedItem.is_variant || updatedItem.parent_product_id || updatedItem.variant_id);
      
      if (isVariantUpdate) {
        // Handle Variant Update
        console.log('📝 [Save] Variant Flow detected for ID:', updatedItem.uuid || updatedItem.id);
        // Resolve Variant ID (to keep definition link and dropdowns in sync)
        let variantId = updatedItem.variant_id;
        if (updatedItem.variant_type) {
            const { data: vDef } = await supabase
                .from('variant_definitions')
                .select('id')
                .eq('variant_name', updatedItem.variant_type)
                .maybeSingle();
            
            if (vDef) {
                variantId = vDef.id;
            } else {
                // Create definition if missing
                const { data: newDef } = await supabase
                    .from('variant_definitions')
                    .insert({
                        base_name: 'Simple Bulb',
                        variant_name: updatedItem.variant_type,
                        display_name: updatedItem.variant_type,
                        is_active: true
                    })
                    .select('id')
                    .single();
                if (newDef) variantId = newDef.id;
            }
        }

        const variantPayload: any = {
           variant_sku: updatedItem.sku || null,
           selling_price: updatedItem.price,
           cost_price: updatedItem.cost_price,
           stock_quantity: stockVal,
           min_stock_level: minVal,
           variant_type: updatedItem.variant_type,
           variant_id: variantId,
           color_temperature: updatedItem.color_temperature ? String(updatedItem.color_temperature) : null,
            variant_color: updatedItem.variant_color || null,
            variant_barcode: updatedItem.barcode || null,
            description: updatedItem.description || null,
            specifications: {
                ...(updatedItem.specifications || {}),
                internal_notes: updatedItem.notes
            }
        };
        
        const { data: updatedVariant, error } = await supabase
          .from('product_variants')
          .update(variantPayload)
          .eq('id', updatedItem.uuid)
          .select(); 

        if (error) {
            console.error('❌ [Save] Variant Update Error:', error);
            alert(`Error saving variant: ${error.message}`);
        } else if (!updatedVariant || updatedVariant.length === 0) {
            console.warn('⚠️ [Save] No variant rows were updated. Check if ID exists:', updatedItem.uuid);
        } else {
            console.log('✅ [Save] Variant updated successfully:', updatedVariant[0]);
        }

        // ALSO update parent product for shared technical details
        const parentId = updatedItem.parent_product_id;
        if (parentId) {
            const sharedPayload: any = {
                brand: updatedItem.brand,
                voltage: updatedItem.voltage,
                wattage: updatedItem.wattage,
                lumens: updatedItem.lumens,
                beam_type: updatedItem.beam_type,
                color_temperature: updatedItem.color_temperature,
                specifications: { 
                    ...(updatedItem.specifications || {}), 
                    internal_notes: updatedItem.notes,
                    tags: updatedItem.tags || []
                }
            };
            
            // Add name if it was somehow changed (though variant view doesn't have it)
            if (updatedItem.name && updatedItem.name.includes(' - ')) {
               // Only update if name looks like a parent name candidate
               // But usually we don't allow changing parent name from variant
            }

            const { data: updatedParent, error: parentError } = await supabase.from('products').update(sharedPayload).eq('id', parentId).select();
            if (parentError) {
                console.error('❌ [Save] Parent Sync Error:', parentError);
            } else if (!updatedParent || updatedParent.length === 0) {
                console.warn('⚠️ [Save] No parent row found for sync, ID:', parentId);
            }
        }

        await fetchInventory();
        handleModalClose();
        return;
      }
      
      const payload: any = {
        name: updatedItem.name,
        sku: updatedItem.sku || null,
        barcode: updatedItem.barcode,
        brand: updatedItem.brand,
        selling_price: updatedItem.has_variants ? 0 : updatedItem.price,
        cost_price: updatedItem.has_variants ? 0 : updatedItem.cost_price,
        stock_quantity: updatedItem.has_variants ? 0 : stockVal,
        reorder_level: updatedItem.has_variants ? 0 : (minVal || 10),
        min_stock_level: updatedItem.has_variants ? 0 : (minVal || 5),
        description: updatedItem.description,
        image_url: updatedItem.image_url,
        voltage: updatedItem.voltage,
        wattage: updatedItem.wattage,
        color_temperature: updatedItem.color_temperature,
        lumens: updatedItem.lumens,
        beam_type: updatedItem.beam_type,
        has_variants: updatedItem.has_variants || false,
        supplier_id: supplierId,
        specifications: { 
          ...(updatedItem.specifications || {}), 
          socket: updatedItem.variant_type,
          internal_notes: updatedItem.notes, // Save notes to specifications
          tags: updatedItem.tags || [], // Save tags to specifications
          // Check for restock and update last_restock if quantity increased
          ...( (stockVal || 0) > (items.find(i => i.id === updatedItem.id)?.stock || 0) ? {
             last_restock: {
                date: new Date().toISOString(),
                quantity: (stockVal || 0) - (items.find(i => i.id === updatedItem.id)?.stock || 0)
             }
          } : (items.find(i => i.id === updatedItem.id)?.specifications?.last_restock ? { 
             last_restock: items.find(i => i.id === updatedItem.id)?.specifications?.last_restock 
          } : {}))
        },
      };

      // Update category if provided
      if (updatedItem.category) {
        const { data: categoryData } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', updatedItem.category)
          .maybeSingle();
        
        if (categoryData) {
          payload.category_id = categoryData.id;
        }
      }

      // Resolve Type ID (Update)
      if (updatedItem.variant_type) {
        const { data: variantTypeData } = await supabase
          .from('variant_categories')
          .select('id')
          .eq('code', updatedItem.variant_type)
          .maybeSingle();
          
        if (variantTypeData) {
            payload.variant_type_id = variantTypeData.id;
        } else {
             // Create if not exists
            const { data: newType } = await supabase
                .from('variant_categories')
                .insert({ code: updatedItem.variant_type, description: 'Created via App' })
                .select('id')
                .maybeSingle();
            if (newType) payload.variant_type_id = newType.id;
        }
      }

      const targetId = updatedItem.uuid || updatedItem.id;
      const targetIdNum = Number(targetId);
      console.log(`📝 [Save] Product Flow detected. Updating 'products' table: ID=${targetIdNum} (original: ${targetId}, type: ${typeof targetId})`, { payload });

      const { data: updatedProd, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', targetIdNum)
        .select();
      
      if (error) {
        console.error('❌ [Save] Product Update Error:', error);
        alert(`Error saving: ${error.message}`);
      } else if (!updatedProd || updatedProd.length === 0) {
        console.warn('⚠️ [Save] No product rows were updated. Check if ID exists:', targetId);
      } else {
        console.log('✅ [Save] Product updated successfully:', updatedProd[0]);
        // Refresh the data to get updated values
        await fetchInventory();
      }
    }
    
    handleModalClose();
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

          {activeView === 'pos' && <Pos items={items} onSaleComplete={fetchInventory} />}
          
          {activeView === 'inventory' && (
            <InventoryManager
              items={items}
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
