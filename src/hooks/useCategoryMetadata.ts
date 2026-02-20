import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCategoryConfig, DEFAULT_CONFIG } from '../constants/categoryConfig';
import type { CategoryConfig } from '../constants/categoryConfig';

interface CategoryMetadataResult {
  config: CategoryConfig;
  loading: boolean;
  isFallback: boolean;
}

export function useCategoryMetadata(categoryName?: string): CategoryMetadataResult {
  const [config, setConfig] = useState<CategoryConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(true);

  useEffect(() => {
    const trimmedName = categoryName?.trim();
    if (!trimmedName || !supabase) {
      setConfig(getCategoryConfig(trimmedName));
      setIsFallback(true);
      return;
    }

    setLoading(true);
    setIsFallback(true);

    const fetchMetadata = async () => {
      try {
        // Step 1: Look up the category ID by name (case-insensitive)
        const { data: catData, error: catError } = await supabase!
          .from('product_categories')
          .select('id')
          .ilike('name', trimmedName)
          .maybeSingle();

        if (catError || !catData) {
          setConfig(getCategoryConfig(trimmedName));
          setIsFallback(true);
          return;
        }

        // Step 2: Load category-specific metadata
        const { data: metaData, error: metaError } = await supabase!
          .from('category_metadata')
          .select('*')
          .eq('category_id', catData.id)
          .eq('is_active', true)
          .maybeSingle();

        if (metaError || !metaData) {
          setConfig(getCategoryConfig(trimmedName));
          setIsFallback(true);
          return;
        }

        // Step 3: Build config from DB data — real metadata, not a fallback
        const dbConfig: CategoryConfig = {
          variantTypeLabel: metaData.variant_type_label || DEFAULT_CONFIG.variantTypeLabel,
          variantDimensions: metaData.variant_dimensions || DEFAULT_CONFIG.variantDimensions,
          fields: metaData.fields || DEFAULT_CONFIG.fields,
          suggestedVariantTypes: metaData.suggested_variant_types || DEFAULT_CONFIG.suggestedVariantTypes,
        };
        setConfig(dbConfig);
        setIsFallback(false);
      } catch (err) {
        console.error('[useCategoryMetadata] Unexpected error:', err);
        setConfig(getCategoryConfig(trimmedName));
        setIsFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [categoryName]);

  return { config, loading, isFallback };
}
