import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (supabaseUrl) {
  supabaseUrl = supabaseUrl.trim();
  if (!supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://' + supabaseUrl;
  }
  try {
    const urlObj = new URL(supabaseUrl);
    supabaseUrl = urlObj.origin; // Drops any paths like /rest/v1/
  } catch (e) {
    // leave it as is if parsing fails
    supabaseUrl = supabaseUrl.replace(/\/+$/, '');
  }
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
