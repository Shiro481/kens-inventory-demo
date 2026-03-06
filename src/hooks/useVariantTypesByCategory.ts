import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fetches all distinct variant_type values used by product_variants
 * that belong to products in a given category.
 * This ensures the "Add Variant" dropdown shows every type
 * ever used for this category across the entire database.
 */
export function useVariantTypesByCategory(category: string | undefined) {
  const [categoryVariantTypes, setCategoryVariantTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase || !category) {
      setCategoryVariantTypes([]);
      return;
    }

    async function fetchTypes() {
      try {
        // Step 1: Resolve category_id from name
        const { data: catData } = await supabase!
          .from('product_categories')
          .select('id')
          .eq('name', category!)
          .maybeSingle();

        if (!catData?.id) {
          setCategoryVariantTypes([]);
          return;
        }

        // Step 2: Get all product IDs in this category that have variants
        const { data: products, error: prodError } = await supabase!
          .from('products')
          .select('id')
          .eq('category_id', catData.id)
          .eq('has_variants', true);

        if (prodError || !products || products.length === 0) {
          setCategoryVariantTypes([]);
          return;
        }

        const productIds = products.map((p: any) => p.id as number);

        // Step 3: Get all variant_type values from those products' variants
        const { data: variants, error: varError } = await supabase!
          .from('product_variants')
          .select('variant_type')
          .in('product_id', productIds)
          .not('variant_type', 'is', null);

        if (varError || !variants) {
          setCategoryVariantTypes([]);
          return;
        }

        const types = Array.from(
          new Set(variants.map((v: any) => v.variant_type as string).filter(Boolean))
        );

        setCategoryVariantTypes(types);
      } catch (err) {
        console.error('[useVariantTypesByCategory] Error:', err);
        setCategoryVariantTypes([]);
      }
    }

    fetchTypes();
  }, [category]);

  return { categoryVariantTypes };
}
