import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface VariantDefinition {
  id: number;
  variant_name: string;
  variant_type_id: string;
  category_id?: number | null;
}

export function useVariantDefinitions() {
  const [variantDefinitions, setVariantDefinitions] = useState<VariantDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDefinitions() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('variant_definitions')
          .select('id, variant_name, variant_type_id, category_id')
          .order('variant_name');

        if (fetchError) throw fetchError;
        setVariantDefinitions(data || []);
      } catch (err: any) {
        console.error('Error fetching variant definitions:', err);
        setError(err.message || 'Failed to load variant definitions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDefinitions();
  }, []);

  return { variantDefinitions, isLoading, error };
}
