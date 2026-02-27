import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

async function runSeed() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to local DB');
    
    const seed = fs.readFileSync('supabase/seed.sql', 'utf8');
    const statements = seed.split(';\n');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt || stmt.startsWith('/*') || stmt.startsWith('--')) continue;
      
      try {
        await client.query(stmt + ';');
      } catch (err) {
        console.error(`Error at statement ${i+1}:`);
        console.error(stmt);
        console.error(err.message);
        process.exit(1);
      }
    }
    console.log('Seed applied successfully');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

runSeed();
