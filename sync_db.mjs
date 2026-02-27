import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Remote credentials
const REMOTE_URL = 'https://mcxhyyzpyrhjmyxhiyyn.supabase.co';
const REMOTE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeGh5eXpweXJoam15eGhpeXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Mjc3MzMsImV4cCI6MjA4NjUwMzczM30.E6g62kTCVA56UA0CKvaU1LyNQM3NrfnnKV_y-Ba3Uzc';

const tables = [
  'product_categories',
  'variant_categories',
  'variant_definitions',
  'category_metadata',
  'suppliers',
  'products',
  'product_variants',
  'store_settings',
  'sales',
  'admins'
];

const supabase = createClient(REMOTE_URL, REMOTE_KEY);

async function sync() {
  let sql = '/* SEED DATA DUMP FROM LIVE */\n\n';
  sql += 'SET session_replication_role = replica;\n\n';

  for (const table of tables) {
    console.log(`Fetching ${table}...`);
    const { data, error } = await supabase.from(table).select('*');
    
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      continue;
    }

    if (!data || data.length === 0) {
      console.log(`No data for ${table}`);
      continue;
    }

    sql += `-- Table: ${table}\n`;
    for (const row of data) {
      const keys = Object.keys(row);
      const values = keys.map(k => {
        const val = row[k];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (Array.isArray(val)) {
          if (val.length === 0) return "'{}'";
          // If it's an array of objects (like variant_dimensions), we must stringify it as JSONB, not a PG Array of strings
          if (val.some(v => typeof v === 'object' && v !== null)) {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          }
          return `ARRAY[${val.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(', ')}]`;
        }
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
        return val;
      });

      sql += `INSERT INTO public.${table} ("${keys.join('", "')}") VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
    }
    sql += '\n';
  }

  // Reset sequences for bigint id tables
  sql += '-- Reset Sequences\n';
  const bigintTables = ['product_categories', 'variant_categories', 'variant_definitions', 'category_metadata', 'suppliers', 'products', 'product_variants', 'store_settings'];
  for (const table of bigintTables) {
    sql += `SELECT setval('public.${table}_id_seq', COALESCE((SELECT MAX(id) + 1 FROM public.${table}), 1), false);\n`;
  }

  sql += '\nSET session_replication_role = DEFAULT;\n';

  fs.writeFileSync('supabase/seed.sql', sql);
  console.log('Seed file generated: supabase/seed.sql');
}

sync();
