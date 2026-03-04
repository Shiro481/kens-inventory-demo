const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:54321', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH');

async function check() {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, stock_quantity')
    .eq('product_id', 10);
  console.log('Variants for product 10:', data);
}
check();
