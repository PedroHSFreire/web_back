import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl: string = process.env.SUPABASE_URL!;
const supabaseAnonKey: string = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are missing in .env file');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);