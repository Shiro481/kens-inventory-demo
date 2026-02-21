import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('name')
        .order('name');
        
      if (error) {
        throw error;
      }
      setCategories(data ? data.map(c => c.name) : []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  return { categories, loading, error, fetchCategories };
}
