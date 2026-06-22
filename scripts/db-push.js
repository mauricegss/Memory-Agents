/* global process */
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function pushSchema() {
  // Clean up the connection string in case it has brackets (e.g. from copy pasting)
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('ERROR: DATABASE_URL not found in .env');
    process.exit(1);
  }

  const cleanUrl = rawUrl.replace(/\[|\]/g, '');

  console.log('Connecting to database...');
  const client = new Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully!');

    const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
    console.log(`Reading SQL from ${schemaPath}...`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing SQL (this might take a few seconds)...');
    
    // Split the SQL into statements and execute them in a transaction to avoid
    // issues with multiple statements if pg client complains, but the default 
    // client.query can handle multiple statements separated by semicolon.
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('✅ Schema pushed successfully!');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Error executing schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

pushSchema();
