const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient('http://127.0.0.1:54321', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH');

async function check() {
  const { data, error } = await supabase.rpc('search_inventory_v2', {
    p_search_query: '',
    p_limit: 100,
    p_offset: 0,
    p_categories: null,
    p_status: 'Out of Stock'
  });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    fs.writeFileSync('out_of_stock_dump.json', JSON.stringify(data, null, 2));
    console.log('Out of stock items written to out_of_stock_dump.json');
  }
}

check();
