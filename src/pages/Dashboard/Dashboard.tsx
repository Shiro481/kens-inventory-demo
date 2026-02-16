import { useState, useEffect } from 'react';

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

  // Add Variant Modal State
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);

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

  async function fetchParts() {
    if (!supabase) return;

    try {
      // 1. Fetch all products (Base Parent Items) from the 'products' table
      // relationships are joined: categories, bulb_types, suppliers
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

      // 2. Fetch ALL variants from 'product_bulb_variants' table
      // These will be flattened into the main list for the UI
      const { data: allVariants, error: variantsError } = await supabase
        .from('product_bulb_variants')
        .select(`
            *,
            bulb_type_variants (
                variant_name
            )
        `);
      
      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
      }

      console.log(`📦 [Dashboard] Fetched ${rawData.length} products and ${allVariants?.length || 0} variants`);

      const allItems: InventoryItem[] = [];
      
      // 3. Process Base Products
      // Convert database schema to InventoryItem interface used by the frontend
      for (const item of rawData) {
        const baseItem = {
          id: generateNumericId(item.id, false),
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
          updated_at: item.updated_at,
          notes: item.specifications?.internal_notes || '', // Map internal notes
          // Map restock data for activity feed
          restocked_at: item.specifications?.last_restock?.date,
          restock_quantity: item.specifications?.last_restock?.quantity,
          is_variant: false  // Explicitly mark as NOT a variant
        };
        
        allItems.push(baseItem);
      }
      
      // 4. Process Variants
      // Flatten variants into the same list as base products
      // They are linked via parent_product_id
      if (allVariants && allVariants.length > 0) {
        for (const variant of allVariants) {
          // Find the parent product to inherit shared properties (image, brand, etc.)
          const parentProduct = rawData.find((p: any) => p.id === variant.product_id);
          
          if (parentProduct) {
            // Get the variant name from the joined relation
            const variantName = variant.bulb_type || variant.bulb_type_variants?.variant_name || 'Unknown';
            const temp = variant.color_temperature ? `${variant.color_temperature}K` : '';
            const noteColor = variant.variant_color || ''; // This is the specific note/color

            const variantItem: InventoryItem = {
              id: generateNumericId(variant.id, true),  // Use TRUE for variants - ensures unique ID
              uuid: variant.id,  // Store the actual variant DB ID
              // Name: "GPNE R6 - H1 6000K" (Clean, standard)
              name: `${parentProduct.name} - ${variantName} ${temp}`.trim(),
              base_name: parentProduct.name,
              sku: variant.variant_sku || `${parentProduct.sku}-${variant.id}`,
              price: variant.selling_price || (variant.price_adjustment ? parentProduct.selling_price + variant.price_adjustment : parentProduct.selling_price),
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
              color_temperature: variant.color_temperature || parentProduct.color_temperature,
              lumens: parentProduct.lumens,
              beam_type: parentProduct.beam_type,
              bulb_type: variantName,
              specifications: parentProduct.specifications,
              supplier: parentProduct.suppliers?.name,
              has_variants: false,
              variant_count: 0,
              variant_id: variant.id,
              variant_display_name: `${variantName} ${temp}`.trim(),
              is_variant: true,  // CRITICAL: Mark as variant
              parent_product_id: variant.product_id,
              created_at: variant.created_at,
              updated_at: variant.updated_at,
              notes: noteColor // Display the specific note/color separately here
            };
            
            allItems.push(variantItem);
            console.log(`  ➕ [Dashboard] Added variant ID=${variantItem.id}, is_variant=${variantItem.is_variant}, name=${variantItem.name}`);
          } else {
            console.warn(`⚠️ [Dashboard] Variant ${variant.id} has no parent product`);
          }
        }
      }
      
      console.log(`📦 [Dashboard] Total items in inventory: ${allItems.length}`);
      console.log(`📊 [Dashboard] Breakdown - Products: ${allItems.filter(i => !i.is_variant).length}, Variants: ${allItems.filter(i => i.is_variant).length}`);
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
        // This is a VARIANT - delete from product_bulb_variants table
        const variantIdToDelete = itemToDelete.uuid || itemToDelete.variant_id;
        
        console.log('🔹 [Delete] Deleting VARIANT from product_bulb_variants, ID:', variantIdToDelete);
        
        const { error: variantError } = await supabase
          .from('product_bulb_variants')
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
        // Optimistic update
        setItems(items.filter(item => item.id !== itemToDelete.id));
        // Refresh all data to ensure consistency across POS and Edit modals
        fetchParts();
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

    // --- CREATE NEW ITEM FLOW ---
    if (updatedItem.id === 0) {
      // 1. Prepare payload for insertion
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

      // RESOLVE BULB TYPE ID
      let bulbTypeId = null;
      if (updatedItem.bulb_type) {
        const { data: bulbData } = await supabase
          .from('bulb_types')
          .select('id')
          .eq('code', updatedItem.bulb_type)
          .maybeSingle();
          
        if (bulbData) {
            bulbTypeId = bulbData.id;
        } else {
            // Create if not exists (Auto-add new socket types)
            const { data: newBulb } = await supabase
                .from('bulb_types')
                .insert({ code: updatedItem.bulb_type, description: 'Created via App' })
                .select('id')
                .maybeSingle();
            if (newBulb) bulbTypeId = newBulb.id;
        }
      }

      if (bulbTypeId) {
        payload.bulb_type_id = bulbTypeId;
      }

      // 3. Insert into Database
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
          bulb_type: data[0].bulb_types?.code,
          supplier: data[0].suppliers?.name,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
          notes: data[0].specifications?.internal_notes || ''
        };
        
        // 5. Insert Variants (if any)
        if (variants && variants.length > 0) {
            const newProductId = data[0].id;
            
            const variantInserts = variants.map(v => ({
                product_id: newProductId,
                bulb_type: v.bulb_type,
                variant_id: v.variant_id, 
                color_temperature: v.color_temperature,
                cost_price: v.cost_price,
                selling_price: v.selling_price,
                stock_quantity: v.stock_quantity,
                min_stock_level: v.min_stock_level,
                variant_color: v.variant_color,
                description: v.description,
                variant_sku: v.variant_sku
            }));

            const { error: varError } = await supabase
                .from('product_bulb_variants')
                .insert(variantInserts);
            
            if (varError) {
                console.error('Error adding variants:', varError);
                alert('Product created, but error adding variants: ' + varError.message);
            }
            // Always fetch parts to show new variants correctly
            fetchParts();
        } else {
             setItems([...items, newItem]);
        }
      }
    } else {
      // --- UPDATE EXISTING ITEM FLOW ---
      
      if (updatedItem.is_variant) {
        // Handle Variant Update
        const variantPayload: any = {
           variant_sku: updatedItem.sku || null,
           selling_price: updatedItem.price,
           cost_price: updatedItem.cost_price,
           stock_quantity: stockVal,
           min_stock_level: minVal,
           bulb_type: updatedItem.bulb_type,
           color_temperature: updatedItem.color_temperature,
           variant_color: updatedItem.notes || null,
           description: updatedItem.description || null
        };
        
        const { error } = await supabase
          .from('product_bulb_variants')
          .update(variantPayload)
          .eq('id', updatedItem.variant_id || updatedItem.uuid); 

        if (error) {
            console.error('Error updating variant:', error);
            alert(`Error saving variant: ${error.message}`);
        } else {
            fetchParts();
        }
        handleModalClose();
        return;
      }
      
      const payload: any = {
        name: updatedItem.name,
        sku: updatedItem.sku || null,
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
        specifications: { 
          ...(updatedItem.specifications || {}), 
          socket: updatedItem.bulb_type,
          internal_notes: updatedItem.notes, // Save notes to specifications
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

      // Resolve Bulb Type ID (Update)
      if (updatedItem.bulb_type) {
        const { data: bulbData } = await supabase
          .from('bulb_types')
          .select('id')
          .eq('code', updatedItem.bulb_type)
          .maybeSingle();
          
        if (bulbData) {
            payload.bulb_type_id = bulbData.id;
        } else {
             // Create if not exists
            const { data: newBulb } = await supabase
                .from('bulb_types')
                .insert({ code: updatedItem.bulb_type, description: 'Created via App' })
                .select('id')
                .maybeSingle();
            if (newBulb) payload.bulb_type_id = newBulb.id;
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

          {activeView === 'pos' && <Pos items={items} onSaleComplete={fetchParts} />}
          
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
