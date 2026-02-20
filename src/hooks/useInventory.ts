import { supabase } from '../lib/supabase';
import { useInventoryStore } from '../store/inventoryStore';
import type { InventoryItem, Supplier } from '../types/inventory';

export function useInventory(suppliers: Supplier[]) {
  const { items, fetchInventory, removeItemOptimistically } = useInventoryStore();

  const confirmDelete = async (itemToDelete: InventoryItem) => {
    if (!supabase || !itemToDelete) return { error: null };

    try {
      let error;
      const isVariantItem = !!(
        itemToDelete.is_variant ||
        itemToDelete.variant_id ||
        itemToDelete.parent_product_id
      );

      if (isVariantItem) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .delete()
          .eq('id', itemToDelete.uuid);
        error = variantError;
      } else {
        const productIdToDelete = itemToDelete.uuid || itemToDelete.id;
        const { error: productError } = await supabase
          .from('products')
          .delete()
          .eq('id', productIdToDelete);
        error = productError;
      }

      if (error) {
        return { error };
      } else {
        removeItemOptimistically(itemToDelete.id, !isVariantItem);
        await fetchInventory(true);
        return { error: null };
      }
    } catch (error: any) {
      return { error };
    }
  };

  const handleSave = async (updatedItem: InventoryItem, variants?: any[], onSuccess?: () => void) => {
    if (!supabase) return { error: new Error('No Supabase client') };

    const minVal = updatedItem.minQuantity ?? updatedItem.min_qty;
    const stockVal = updatedItem.stock ?? updatedItem.quantity;

    let supplierId = null;
    if (updatedItem.supplier) {
        const s = suppliers.find(s => s.name === updatedItem.supplier);
        if (s) supplierId = s.id;
    }

    if (updatedItem.id === 0) {
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

      let categoryId = null;
      if (updatedItem.category) {
        const { data: categoryData } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', updatedItem.category)
          .single();
        categoryId = categoryData?.id;
      }

      if (categoryId) payload.category_id = categoryId;

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
            const { data: newType } = await supabase
                .from('variant_categories')
                .insert({ code: updatedItem.variant_type, description: 'Created via App' })
                .select('id')
                .maybeSingle();
            if (newType) variantTypeId = newType.id;
        }
      }

      if (variantTypeId) payload.variant_type_id = variantTypeId;

      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select(`*, product_categories(name), variant_categories(code), suppliers(name)`);

      if (error) {
        return { error };
      } else if (data && data[0]) {
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

            const { error: varError } = await supabase.from('product_variants').insert(variantInserts);
            if (varError) return { error: varError };
            await fetchInventory(true);
        } else {
            await fetchInventory(true);
        }
      }
    } else {
      const isVariantUpdate = !!(updatedItem.is_variant || updatedItem.parent_product_id || updatedItem.variant_id);

      if (isVariantUpdate) {
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
                const { data: newDef } = await supabase
                    .from('variant_definitions')
                    .insert({
                        base_name: updatedItem.name || 'Variant',
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
        
        const { error } = await supabase
          .from('product_variants')
          .update(variantPayload)
          .eq('id', updatedItem.uuid);

        if (error) return { error };

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
            await supabase.from('products').update(sharedPayload).eq('id', parentId);
        }

        await fetchInventory(true);
        if (onSuccess) onSuccess();
        return { error: null };
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
          internal_notes: updatedItem.notes,
          tags: updatedItem.tags || [],
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

      if (updatedItem.category) {
        const { data: categoryData } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', updatedItem.category)
          .maybeSingle();
        if (categoryData) payload.category_id = categoryData.id;
      }

      if (updatedItem.variant_type) {
        const { data: variantTypeData } = await supabase
          .from('variant_categories')
          .select('id')
          .eq('code', updatedItem.variant_type)
          .maybeSingle();
          
        if (variantTypeData) {
            payload.variant_type_id = variantTypeData.id;
        } else {
            const { data: newType } = await supabase
                .from('variant_categories')
                .insert({ code: updatedItem.variant_type, description: 'Created via App' })
                .select('id')
                .maybeSingle();
            if (newType) payload.variant_type_id = newType.id;
        }
      }

      const targetId = updatedItem.uuid || updatedItem.id;
      const { data: updatedProd, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', Number(targetId))
        .select();

      if (error) {
        return { error };
      } else if (updatedProd && updatedProd.length > 0) {
        await fetchInventory(true);
      }
    }
    
    if (onSuccess) onSuccess();
    return { error: null };
  };

  return { confirmDelete, handleSave };
}
