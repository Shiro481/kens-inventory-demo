
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStats() {
  console.log('Checking stats via RPC...');
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Data:', data);
  }
}

checkStats();
