import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking tables...");
  const { data, error } = await supabase.from('turmas').select('*').limit(1);
  console.log("Turmas:", data, error);

  const { data: d2, error: e2 } = await supabase.from('turma_alunos').select('*').limit(1);
  console.log("Turma_Alunos:", d2, e2);
  
  const { data: d3, error: e3 } = await supabase.from('games').select('*').limit(1);
  console.log("Games:", d3, e3);
}

run();
