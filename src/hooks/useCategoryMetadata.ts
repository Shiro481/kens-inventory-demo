
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCategoryConfig, DEFAULT_CONFIG, type CategoryConfig } from '../constants/categoryConfig';

export function useCategoryMetadata(categoryName?: string) {
  const [dynamicConfig, setDynamicConfig] = useState<CategoryConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchMetadata() {
      if (!categoryName) {
        setDynamicConfig(DEFAULT_CONFIG);
        return;
      }

      setLoading(true);
      try {
        if (!supabase) throw new Error('Supabase client not initialized');

        // 1. Get the category ID first
        const { data: catData, error: catError } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', categoryName)
          .single();

        if (catError || !catData) {
          // Fallback to hardcoded if category not found in DB
          setDynamicConfig(getCategoryConfig(categoryName));
          return;
        }

        // 2. Fetch metadata for this category
        const { data: metaData, error: metaError } = await supabase
          .from('category_metadata')
          .select('*')
          .eq('category_id', catData.id)
          .eq('is_active', true)
          .single();

        if (metaError || !metaData) {
          // Fallback to hardcoded if no metadata found
          setDynamicConfig(getCategoryConfig(categoryName));
        } else {
          // Success: Use Dynamic Data
          setDynamicConfig({
            variantTypeLabel: metaData.variant_type_label,
            variantDimensions: metaData.variant_dimensions || [
              { label: metaData.variant_type_label, column: 'variant_type', active: true }
            ],
            fields: metaData.fields,
            suggestedVariantTypes: metaData.suggested_variant_types
          });
        }
      } catch (err) {
        console.error('Error fetching category metadata:', err);
        setError(err);
        // Fallback on error
        setDynamicConfig(getCategoryConfig(categoryName));
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [categoryName]);

  return { config: dynamicConfig || DEFAULT_CONFIG, loading, error };
}
