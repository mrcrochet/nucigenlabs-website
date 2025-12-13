import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if environment variables are available
// Otherwise, create a mock client that will fail gracefully
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

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
  // Check if Supabase is properly configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase is not configured. Access request not submitted.');
    // Return a mock success response for development
    return {
      ...data,
      id: 'mock-id',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  }

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
