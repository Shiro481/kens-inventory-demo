import { supabase } from '../lib/supabase';
import { useInventoryStore } from '../store/inventoryStore';
import type { InventoryItem, Supplier } from '../types/inventory';
import { buildSpecKey } from '../utils/buildSpecKey';

export function useInventory(suppliers: Supplier[]) {
  const { items, fetchInventory, fetchAllParents, fetchInventoryStats, removeItemOptimistically } = useInventoryStore();

  // ── DELETE ──────────────────────────────────────────────────────────────────
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
        await fetchInventory(undefined, true);
        await fetchInventoryStats(); // Fix 5: keep stats fresh after delete
        return { error: null };
      }
    } catch (error: any) {
      return { error };
    }
  };

  // ── SAVE (create or update) ─────────────────────────────────────────────────
  const handleSave = async (rawItem: InventoryItem, variants?: any[], onSuccess?: () => void) => {
    if (!supabase) return { error: new Error('No Supabase client') };

    // Fix 8: clone so we never mutate the caller's React state object
    const updatedItem = { ...rawItem };

    const minVal  = updatedItem.minQuantity ?? updatedItem.min_qty;
    const stockVal = updatedItem.stock ?? updatedItem.quantity;

    let supplierId: number | null = null;
    if (updatedItem.supplier) {
      const s = suppliers.find(s => s.name === updatedItem.supplier);
      if (s) supplierId = s.id;
    }

    // Brand and variant_category resolution is now handled inside the
    // save_product_with_variants SECURITY DEFINER RPC to avoid RLS restrictions
    // on direct client writes to those admin-only tables.
    const bId = updatedItem.brand_id ?? null;

    // ── CREATE NEW PRODUCT ────────────────────────────────────────────────────
    if (updatedItem.id === 0) {
      const productPayload: any = {
        name:          updatedItem.name,
        sku:           updatedItem.sku || null,
        barcode:       updatedItem.barcode,
        brand:         updatedItem.brand || 'Aftermarket',
        brand_id:      bId,
        selling_price: updatedItem.has_variants ? 0 : updatedItem.price,
        cost_price:    updatedItem.has_variants ? 0 : (updatedItem.cost_price || 0),
        stock_quantity: updatedItem.has_variants ? 0 : stockVal,
        reorder_level:  updatedItem.has_variants ? 0 : (minVal || 10),
        min_stock_level: updatedItem.has_variants ? 0 : (minVal || 5),
        description:   updatedItem.description,
        image_url:     updatedItem.image_url,
        beam_type:     updatedItem.beam_type,
        has_variants:  updatedItem.has_variants || false,
        specifications: {
          ...(updatedItem.specifications || {}),
          socket:         updatedItem.variant_type,
          internal_notes: updatedItem.notes,
          tags:           updatedItem.tags || []
        },
        supplier_id: supplierId
      };

      if (updatedItem.category) {
        const { data: categoryData } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', updatedItem.category)
          .single();
        if (categoryData) productPayload.category_id = categoryData.id;
      }

      // variant_type passed as a string; RPC resolves/creates the variant_categories row
      if (updatedItem.variant_type) {
        productPayload.variant_type = updatedItem.variant_type;
      }

      const variantPayloads = (variants || []).map((v: any) => ({
        variant_type:      v.variant_type,
        variant_id:        v.variant_id,
        variant_color:     v.variant_color,
        color_temperature: v.color_temperature ? String(v.color_temperature) : null,
        description:       v.description,
        variant_sku:       v.variant_sku,
        selling_price:     Number(v.selling_price)  || 0,
        cost_price:        Number(v.cost_price)     || 0,
        stock_quantity:    Number(v.stock_quantity) || 0,
        min_stock_level:   Number(v.min_stock_level) || 5,
        specifications:    v.specifications || {},
        spec_key:          v.spec_key || buildSpecKey(v as any)
        // product_id is set inside the RPC
      }));

      // Fix 1: single atomic RPC call — if variant insert fails the product is rolled back
      const { data: rpcResult, error: rpcError } = await supabase.rpc('save_product_with_variants', {
        p_product:  productPayload,
        p_variants: variantPayloads,
        p_action:   'insert'
      });
      if (rpcError) return { error: rpcError };
      const result = rpcResult as { product_id: number | null; error: string | null } | null;
      if (result?.error) return { error: new Error(result.error) };

      await fetchInventory(undefined, true);
      await fetchAllParents();
      await fetchInventoryStats(); // Fix 5

    } else {
      const isVariantUpdate = !!(updatedItem.is_variant || updatedItem.parent_product_id || updatedItem.variant_id);

      // ── UPDATE EXISTING VARIANT ─────────────────────────────────────────────
      if (isVariantUpdate) {
        // Resolve variant_definition id via SECURITY DEFINER RPC to bypass RLS
        let variantDefId = updatedItem.variant_id;
        if (updatedItem.variant_type) {
          const { data: defId, error: defErr } = await supabase.rpc('upsert_variant_definition', {
            p_base_name:    updatedItem.name || 'Variant',
            p_variant_name: updatedItem.variant_type,
            p_display_name: updatedItem.variant_type,
          });
          if (defErr) return { error: defErr };
          if (defId) variantDefId = defId;
        }

        const variantPayload: any = {
          variant_sku:       updatedItem.sku || null,
          selling_price:     updatedItem.price,
          cost_price:        updatedItem.cost_price,
          stock_quantity:    stockVal,
          min_stock_level:   minVal,
          variant_type:      updatedItem.variant_type,
          variant_id:        variantDefId,
          color_temperature: updatedItem.color_temperature ? String(updatedItem.color_temperature) : null,
          variant_color:     updatedItem.variant_color || null,
          variant_barcode:   updatedItem.barcode || null,
          description:       updatedItem.description || null,
          specifications: {
            ...(updatedItem.specifications || {}),
            internal_notes: updatedItem.notes
          }
        };

        // Fix 2: verify the update actually matched a row
        const { data: updatedRow, error } = await supabase
          .from('product_variants')
          .update(variantPayload)
          .eq('id', updatedItem.uuid)
          .select('id');

        if (error) return { error };
        if (!updatedRow || updatedRow.length === 0) {
          return { error: new Error(`Variant not found (id=${updatedItem.uuid}). Nothing was saved.`) };
        }

        // Sync shared fields back to the parent product row
        const parentId = updatedItem.parent_product_id;
        if (parentId) {
          const sharedPayload: any = {
            brand:             updatedItem.brand,
            brand_id:          updatedItem.brand_id,
            beam_type:         updatedItem.beam_type,
            color_temperature: updatedItem.color_temperature,
            specifications: {
              ...(updatedItem.specifications || {}),
              internal_notes: updatedItem.notes,
              tags:           updatedItem.tags || []
            }
          };
          await supabase.from('products').update(sharedPayload).eq('id', parentId);
        }

        // Insert any newly added temp variants
        if (variants && variants.length > 0) {
          const tempInserts = variants
            .filter((v: any) => v.is_temp)
            .map((v: any) => ({
              product_id:        updatedItem.parent_product_id || updatedItem.id,
              variant_type:      v.variant_type,
              variant_id:        v.variant_id,
              color_temperature: v.color_temperature ? String(v.color_temperature) : null,
              cost_price:        Number(v.cost_price)     || 0,
              selling_price:     Number(v.selling_price)  || 0,
              stock_quantity:    Number(v.stock_quantity) || 0,
              min_stock_level:   Number(v.min_stock_level) || 5,
              variant_color:     v.variant_color,
              description:       v.description,
              variant_sku:       v.variant_sku,
              specifications:    v.specifications || {}
            }));
          if (tempInserts.length > 0) {
            const { error: newVarsError } = await supabase.from('product_variants').insert(tempInserts);
            if (newVarsError) return { error: newVarsError };
          }
        }

        await fetchInventory(undefined, true);
        await fetchAllParents();
        await fetchInventoryStats(); // Fix 5
        if (onSuccess) onSuccess();
        return { error: null };
      }

      // ── UPDATE EXISTING PARENT PRODUCT (via atomic RPC) ─────────────────────
      const targetId = updatedItem.uuid || updatedItem.id;

      const productPayload: any = {
        id:            Number(targetId), // required: RPC uses this to identify the row
        name:          updatedItem.name,
        sku:           updatedItem.sku || null,
        barcode:       updatedItem.barcode,
        brand:         updatedItem.brand,
        brand_id:      updatedItem.brand_id,
        selling_price: updatedItem.has_variants ? 0 : updatedItem.price,
        cost_price:    updatedItem.has_variants ? 0 : updatedItem.cost_price,
        stock_quantity: updatedItem.has_variants ? 0 : stockVal,
        reorder_level:  updatedItem.has_variants ? 0 : (minVal || 10),
        min_stock_level: updatedItem.has_variants ? 0 : (minVal || 5),
        description:   updatedItem.description,
        image_url:     updatedItem.image_url,
        beam_type:     updatedItem.beam_type,
        has_variants:  updatedItem.has_variants || false,
        supplier_id:   supplierId,
        specifications: {
          ...(updatedItem.specifications || {}),
          socket:         updatedItem.variant_type,
          internal_notes: updatedItem.notes,
          tags:           updatedItem.tags || [],
          // Preserve or record last_restock date when stock increases
          ...( (stockVal || 0) > (items.find(i => i.id === updatedItem.id)?.stock || 0) ? {
            last_restock: {
              date:     new Date().toISOString(),
              quantity: (stockVal || 0) - (items.find(i => i.id === updatedItem.id)?.stock || 0)
            }
          } : (items.find(i => i.id === updatedItem.id)?.specifications?.last_restock ? {
            last_restock: items.find(i => i.id === updatedItem.id)?.specifications?.last_restock
          } : {}))
        }
      };

      if (updatedItem.category) {
        const { data: categoryData } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', updatedItem.category)
          .maybeSingle();
        if (categoryData) productPayload.category_id = categoryData.id;
      }

      // variant_type passed as a string; RPC resolves/creates the variant_categories row
      if (updatedItem.variant_type) {
        productPayload.variant_type = updatedItem.variant_type;
      }

      // Only insert variants that are newly staged (is_temp = true)
      const variantPayloads = updatedItem.has_variants && variants && variants.length > 0
        ? variants
            .filter((v: any) => v.is_temp)
            .map((v: any) => ({
              variant_type:      v.variant_type,
              variant_id:        v.variant_id,
              color_temperature: v.color_temperature ? String(v.color_temperature) : null,
              cost_price:        Number(v.cost_price)     || 0,
              selling_price:     Number(v.selling_price)  || 0,
              stock_quantity:    Number(v.stock_quantity) || 0,
              min_stock_level:   Number(v.min_stock_level) || 5,
              variant_color:     v.variant_color,
              description:       v.description,
              variant_sku:       v.variant_sku,
              specifications:    v.specifications || {},
              is_temp:           true
            }))
        : [];

      // Fix 1: single atomic RPC call
      const { data: rpcResult, error: rpcError } = await supabase.rpc('save_product_with_variants', {
        p_product:  productPayload,
        p_variants: variantPayloads,
        p_action:   'update'
      });
      if (rpcError) return { error: rpcError };
      const result = rpcResult as { product_id: number | null; error: string | null } | null;
      if (result?.error) return { error: new Error(result.error) };

      await fetchInventory(undefined, true);
      await fetchAllParents();
      await fetchInventoryStats(); // Fix 5
    }

    if (onSuccess) onSuccess();
    return { error: null };
  };

  return { confirmDelete, handleSave };
}
