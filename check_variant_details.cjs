const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // Same key

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
  const { data: variants, error: vError } = await supabase
    .from('product_variants')
    .select('*, products(*)')
    .eq('id', 29);
    
  if (vError) console.error('Error:', vError);
  console.log('Variant details:', JSON.stringify(variants, null, 2));

  // Also check if search_inventory_v2 returns this item
  const { data: searchResult, error: sError } = await supabase.rpc('search_inventory_v2', {
    p_search_query: '',
    p_limit: 1000,
    p_offset: 0
  });

  if (sError) console.error('Search error:', sError);
  else {
    const item = searchResult.find(i => i.is_variant && i.id === 29);
    console.log('Is it in search_inventory_v2?', !!item);
    if (item) {
        console.log('Search item details:', item);
    }
  }
}

checkDetails();
