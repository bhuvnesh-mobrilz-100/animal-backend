import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and key must be configured in environment variables');
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey);
