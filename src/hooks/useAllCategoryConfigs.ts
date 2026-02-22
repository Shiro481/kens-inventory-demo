import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CategoryMetadata } from '../types/category';

export interface CategoryMetadataWithCategory extends CategoryMetadata {
  product_categories: { name: string } | null;
}

export function useAllCategoryConfigs() {
  const [metadataList, setMetadataList] = useState<CategoryMetadataWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllMetadata = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('category_metadata')
        .select(`
          *,
          product_categories ( name )
        `)
        .eq('is_active', true);
        
      if (error) {
        throw error;
      }
      
      setMetadataList(data as CategoryMetadataWithCategory[] || []);
    } catch (err: any) {
      console.error('Error fetching category metadata:', err);
      setError(err.message || 'Failed to fetch category metadata');
    } finally {
      setLoading(false);
    }
  }, []);

  return { metadataList, loading, error, fetchAllMetadata };
}
