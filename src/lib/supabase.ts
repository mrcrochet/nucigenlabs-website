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
  name?: string;
  role?: string;
  company?: string;
  phone?: string;
  company_number?: string;
  exposure?: string;
  intended_use?: string;
  status?: 'pending' | 'approved' | 'rejected';
  source_page?: string;
  created_at?: string;
  updated_at?: string;
  // Early access fields
  early_access?: boolean;
  launch_date?: string; // January 30, 2026
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

/**
 * Check if an email is already registered
 */
export async function checkEmailExists(email: string): Promise<AccessRequest | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const emailLower = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('email', emailLower)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking email:', error);
    return null;
  }

  return data;
}

/**
 * Get access request by email (for recovery)
 */
export async function getAccessRequestByEmail(email: string): Promise<AccessRequest | null> {
  return checkEmailExists(email);
}

/**
 * Update existing access request
 */
export async function updateAccessRequest(email: string, updates: Partial<AccessRequest>): Promise<AccessRequest | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase is not configured.');
    return null;
  }

  const emailLower = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from('access_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('email', emailLower)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating access request:', error);
    throw new Error(error.message || 'Failed to update request');
  }

  return data;
}

/**
 * Extract UTM parameters from URL
 */
export function getUTMParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  };
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
      launch_date: '2026-01-30',
      created_at: new Date().toISOString(),
    };
  }

  const emailLower = data.email.toLowerCase().trim();

  // Check if email already exists
  const existing = await checkEmailExists(emailLower);
  if (existing) {
    // Update existing record instead of creating new one
    const utmParams = getUTMParams();
    const updated = await updateAccessRequest(emailLower, {
      role: data.role || existing.role,
      company: data.company || existing.company,
      exposure: data.exposure || existing.exposure,
      intended_use: data.intended_use || existing.intended_use,
      source_page: data.source_page || existing.source_page,
      utm_source: utmParams.utm_source || existing.utm_source,
      utm_medium: utmParams.utm_medium || existing.utm_medium,
      utm_campaign: utmParams.utm_campaign || existing.utm_campaign,
    });
    return updated || existing;
  }

  // Set early access defaults
  const utmParams = getUTMParams();
  const requestData = {
    ...data,
    email: emailLower,
    early_access: true,
    launch_date: '2026-01-30', // January 30, 2026
    status: 'pending' as const,
    utm_source: utmParams.utm_source,
    utm_medium: utmParams.utm_medium,
    utm_campaign: utmParams.utm_campaign,
  };

  const { data: result, error } = await supabase
    .from('access_requests')
    .insert([requestData])
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      // Email already exists, try to get it
      const existing = await checkEmailExists(emailLower);
      if (existing) {
        return existing;
      }
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

export interface PartnerApplication {
  id?: string;
  name: string;
  email: string;
  platform?: string;
  audience_size?: string;
  content_focus?: string;
  why_interested?: string;
  status?: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  reviewed_at?: string;
  notes?: string;
}

export async function submitPartnerApplication(data: {
  name: string;
  email: string;
  platform: string;
  audienceSize: string;
  contentFocus: string;
  whyInterested: string;
}) {
  // Check if Supabase is properly configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase is not configured. Partner application not submitted.');
    // Return a mock success response for development
    return {
      ...data,
      id: 'mock-id',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  }

  const emailLower = data.email.toLowerCase().trim();

  const applicationData = {
    name: data.name,
    email: emailLower,
    platform: data.platform,
    audience_size: data.audienceSize,
    content_focus: data.contentFocus,
    why_interested: data.whyInterested,
    status: 'pending' as const,
  };

  const { data: result, error } = await supabase
    .from('partner_applications')
    .insert([applicationData])
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new Error('This email has already submitted an application');
    }
    if (error.code === '42P01') {
      // Table doesn't exist yet
      console.warn('partner_applications table does not exist. Please create it in Supabase.');
      throw new Error('Partner applications are temporarily unavailable. Please try again later.');
    }
    throw new Error(error.message || 'Failed to submit application');
  }

  return result;
}

// Note: Email verification is now handled by Supabase Auth
// The functions createVerificationCode, verifyEmailCode, and incrementVerificationAttempts
// have been removed as they are no longer needed.
