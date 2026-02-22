import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useInventoryStore } from '../store/inventoryStore';
import { useAllCategoryConfigs, type CategoryMetadataWithCategory } from './useAllCategoryConfigs';
import type { InventoryItem } from '../types/inventory';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseAiAssistantReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Builds a compact inventory snapshot for the AI system prompt.
 * We summarise instead of dumping raw JSON to stay within token limits.
 */
function buildInventoryContext(items: InventoryItem[], metadataList: CategoryMetadataWithCategory[]): string {
  if (!items.length) return 'No inventory data available.';

  const parents = items.filter(i => !i.is_variant);
  const variants = items.filter(i => i.is_variant);

  const lowStock = items.filter(i => (i.stock ?? 0) <= (i.minQuantity ?? 0) && (i.stock ?? 0) > 0);
  const outOfStock = items.filter(i => (i.stock ?? 0) === 0);

  const itemLines = parents
    .map(item => {
      const variantCount = item.variant_count ?? 0;
      const stockInfo = variantCount > 0
        ? `(${variantCount} variants)`
        : `stock: ${item.stock}, min: ${item.minQuantity ?? 0}, price: ₱${item.price}`;
      return `- ${item.name}${item.brand ? ` [${item.brand}]` : ''} | ${stockInfo}${item.category ? ` | cat: ${item.category}` : ''}`;
    })
    .join('\n');

    const variantLines = variants
    .map(v => {
      let specs = '';
      
      // 1. Find the parent product to get its category
      const parent = parents.find(p => p.uuid === v.parent_product_id);
      
      // 2. Find the metadata config for that category
      const categoryConfig = metadataList.find(m => m.product_categories?.name === parent?.category);
      
      // 3. Dynamically map active variant dimensions
      if (categoryConfig?.variant_dimensions) {
         categoryConfig.variant_dimensions.forEach(dim => {
            if (!dim.active) return;
            
            // Extract the actual value from the variant using the dimension's column mapping
            let val;
            if (dim.column === 'variant_color') val = v.variant_color;
            else if (dim.column === 'color_temperature') val = v.color_temperature;
            else if (dim.column.startsWith('spec_')) {
                const specKey = dim.column.replace('spec_', '');
                val = v.specifications?.[specKey];
            }

            if (val) {
               specs += `${dim.label}: ${val} | `;
            }
         });
      }

      // Add standard fields
      if (v.specifications?.tags?.length) specs += `Tags: ${v.specifications.tags.join(', ')} | `;
      if (v.sku) specs += `SKU: ${v.sku} | `;
      
      const specString = specs ? ` [Specs: ${specs.slice(0, -3)}]` : '';
      return `  ↳ Variant: ${v.name} (Type: ${v.variant_type ?? 'Standard'})${specString} | Stock: ${v.stock} | Price: ₱${v.price}`;
    })
    .join('\n');

  const metaLines = metadataList
    .map(m => {
      const catName = m.product_categories?.name || 'Unknown';
      const dims = m.variant_dimensions?.filter(d => d.active).map(d => d.label).join(', ') || 'None';
      const fields = m.fields?.map(f => f.label).join(', ') || 'None';
      return `- ${catName}: Dimensions (${dims}), Custom Fields (${fields})`;
    })
    .join('\n');

  return [
    `Total parent items: ${parents.length}, Total variant SKUs: ${variants.length}`,
    `Low stock (${lowStock.length}): ${lowStock.map(i => i.name).join(', ') || 'none'}`,
    `Out of stock (${outOfStock.length}): ${outOfStock.slice(0, 10).map(i => i.name).join(', ') || 'none'}`,
    '',
    'CATEGORY CONFIGURATIONS (Defines the variant structures & specs):',
    metaLines || 'No categories defined.',
    '',
    'INVENTORY PARENTS:',
    itemLines,
    variantLines ? '\nINVENTORY VARIANTS (Specs match the category configuration dimensions!):\n' + variantLines : '',
  ].join('\n');
}

export function useAiAssistant(): UseAiAssistantReturn {
  const { items } = useInventoryStore();
  const { metadataList, fetchAllMetadata } = useAllCategoryConfigs();

  useEffect(() => {
    fetchAllMetadata();
  }, [fetchAllMetadata]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! 👋 I'm your high-energy Ken's Garage AI assistant! 🏎️✨ Ready to dive into the inventory? Ask me anything about stock levels, prices, variants, or whatever else you need! Let's get to work! 🔧",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (!supabase) {
      setError('Supabase client not initialized.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      // Build message history for Gemini (exclude welcome message)
      const history = [...messages.filter(m => m.id !== 'welcome'), userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const inventoryContext = buildInventoryContext(items, metadataList);

      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: { messages: history, inventoryContext },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.reply) throw new Error('Empty response from AI.');

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[useAiAssistant] Error:', err);
      setError(err.message ?? 'Something went wrong. Please try again.');
      // Remove the user message that failed so they can retry
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages, items, metadataList, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Chat cleared! 🧹 Ready for the next question! Ask me anything about your inventory! 🏎️✨",
      timestamp: new Date(),
    }]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
