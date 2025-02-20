import { neon } from '@neondatabase/serverless';
import { env } from '../lib/env.mjs';

async function enableVector() {
  const sql = neon(env.DATABASE_URL);
  
  try {
    console.log('Enabling vector extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log('Vector extension enabled successfully!');
  } catch (error) {
    console.error('Error enabling vector extension:', error);
  }
}

enableVector(); 