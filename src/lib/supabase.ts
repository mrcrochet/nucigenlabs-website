import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AccessRequest {
  id?: string;
  email: string;
  role?: string;
  company?: string;
  exposure?: string;
  intended_use?: string;
  status?: 'pending' | 'approved' | 'rejected';
  source_page?: string;
  created_at?: string;
  updated_at?: string;
}

export async function submitAccessRequest(data: AccessRequest) {
  const { data: result, error } = await supabase
    .from('access_requests')
    .insert([data])
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new Error('This email has already been registered');
    }
    throw new Error(error.message || 'Failed to submit request');
  }

  return result;
}
