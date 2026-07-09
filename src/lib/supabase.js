import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Usa referência global para sobreviver ao HMR do Vite
const GLOBAL_KEY = '__supabase_client_v3__';

function getOrCreateClient() {
  if (!window[GLOBAL_KEY]) {
    window[GLOBAL_KEY] = createClient(supabaseUrl, supabaseAnonKey);
  }
  return window[GLOBAL_KEY];
}

export const supabase = getOrCreateClient();
