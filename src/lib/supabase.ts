import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://' + supabaseUrl;
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
