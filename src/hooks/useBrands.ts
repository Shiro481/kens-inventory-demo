import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Brand {
  id: number;
  name: string;
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBrands = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setBrands(data);
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return { brands, fetchBrands, isLoading };
}
