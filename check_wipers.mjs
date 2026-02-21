import { createClient } from '@supabase/supabase-js';

const url = 'http://127.0.0.1:54321';
const key = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH' // Public anon key from .env

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*, products!inner(name, category)')
    .ilike('products.name', '%wiper%');
    
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

run();
