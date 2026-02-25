import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch(query) {
  console.log(`\nTesting search for: "${query}"`);
  const { data, error } = await supabase.rpc('search_inventory', {
    p_search_query: query,
    p_limit: 5,
    p_offset: 0
  });

  if (error) {
    console.error("Search Error:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No items found.");
    return;
  }

  data.forEach((item, i) => {
    console.log(`${i + 1}. ${item.name} [SKU: ${item.sku}] (Rank: ${item.search_rank})`);
  });
}

async function runTests() {
  await testSearch('LED H4');
  await testSearch('GPNE');
  await testSearch('Bulb');
}

runTests();
