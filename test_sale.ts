import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // Local Anon Key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVariantSale() {
  const { data: variants } = await supabase.from('product_variants').select('*').limit(1);
  if (!variants || variants.length === 0) {
    console.log('No variants found.');
    return;
  }
  const variant = variants[0];
  console.log(`Variant ID: ${variant.id}, Product ID: ${variant.product_id}, Stock: ${variant.stock_quantity}`);

  const cartItem = {
    id: (variant.product_id || 0) * 10000 + variant.id, 
    name: "Test Variant",
    price: variant.selling_price || 0,
    quantity: 1,
    variant_id: variant.id.toString(),
    category: null
  };

  const { data: saleId, error } = await supabase.rpc('process_sale', {
    p_items: [cartItem],
    p_subtotal: cartItem.price,
    p_tax: 0,
    p_total: cartItem.price,
    p_payment_method: 'Cash',
    p_notes: 'Test Variant Sale'
  });

  if (error) {
    console.error('Sale error:', error);
    return;
  }

  console.log('Sale processed. ID:', saleId);

  const { data: updatedVariant } = await supabase.from('product_variants').select('*').eq('id', variant.id).single();
  console.log(`New Stock: ${updatedVariant?.stock_quantity}`);
}

testVariantSale();
