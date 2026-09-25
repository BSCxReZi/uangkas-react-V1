import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Role = 'admin' | 'bendahara';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  user_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  user_id: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id: string | null;
  member_id: string | null;
  description: string;
  date: string;
  user_id: string;
  created_at: string;
  category?: Category | null;
  member?: Member | null;
}
