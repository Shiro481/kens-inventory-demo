const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // Same key used in check_stats.cjs

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Check products with no variants
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, name, stock_quantity, min_stock_level, has_variants')
    .eq('has_variants', false)
    .lte('stock_quantity', 0);
    
  if (pError) console.error('Products Error:', pError);

  // Check variants
  const { data: variants, error: vError } = await supabase
    .from('product_variants')
    .select('id, product_id, stock_quantity, min_stock_level')
    .lte('stock_quantity', 0);
    
  if (vError) console.error('Variants Error:', vError);

  console.log('Out of stock Products (has_variants=false):', JSON.stringify(products, null, 2));
  console.log('Out of stock Variants:', JSON.stringify(variants, null, 2));
}

check();
