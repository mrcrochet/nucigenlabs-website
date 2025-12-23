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
  // Early access fields
  early_access?: boolean;
  launch_date?: string; // January 30, 2025
  email_sent?: boolean;
  email_sent_at?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface InstitutionalRequest {
  id?: string;
  name: string;
  email: string;
  role?: string;
  sector?: string;
  country?: string;
  capital_size?: string;
  timeline?: string;
  interests?: string;
  status?: 'pending' | 'shortlisted' | 'approved' | 'rejected';
  created_at?: string;
  reviewed_at?: string;
  notes?: string;
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
      early_access: true,
      launch_date: '2025-01-30',
      created_at: new Date().toISOString(),
    };
  }

  // Set early access defaults
  const requestData = {
    ...data,
    early_access: true,
    launch_date: '2025-01-30', // January 30, 2025
    status: 'pending' as const,
  };

  const { data: result, error } = await supabase
    .from('access_requests')
    .insert([requestData])
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new Error('This email has already been registered for early access');
    }
    throw new Error(error.message || 'Failed to submit request');
  }

  return result;
}

export async function submitInstitutionalRequest(data: InstitutionalRequest) {
  // Check if Supabase is properly configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase is not configured. Institutional request not submitted.');
    // Return a mock success response for development
    return {
      ...data,
      id: 'mock-id',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  }

  const { data: result, error } = await supabase
    .from('institutional_requests')
    .insert([{
      ...data,
      status: data.status || 'pending',
    }])
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new Error('This email has already been submitted');
    }
    throw new Error(error.message || 'Failed to submit request');
  }

  return result;
}
