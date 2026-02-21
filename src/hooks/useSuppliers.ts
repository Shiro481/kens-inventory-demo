import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      setSuppliers(data || []);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      setError(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  return { suppliers, loading, error, fetchSuppliers };
}
