import { createClient } from '@supabase/supabase-js';

// Simulated Supabase client for development
const supabaseUrl:any = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey:any = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
