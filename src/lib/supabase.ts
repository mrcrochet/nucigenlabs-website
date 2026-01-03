import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && 
                    supabaseAnonKey && 
                    supabaseUrl !== 'https://votre-projet.supabase.co' &&
                    supabaseUrl !== 'your_supabase_project_url' &&
                    supabaseAnonKey !== 'your_supabase_anon_key' &&
                    supabaseAnonKey !== 'votre-anon-key-ici';

// Create Supabase client only if environment variables are available
// Otherwise, create a mock client that will fail gracefully
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Export a helper to check if Supabase is configured
export const isSupabaseConfigured = () => isConfigured;

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

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'early' | 'admin';
  professional_role?: string; // Job role: analyst, trader, etc.
  company?: string;
  sector?: string;
  intended_use?: string;
  exposure?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, name?: string) {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. ' +
      'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
      'Then restart your development server with: npm run dev'
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to sign up');
  }

  // If no session is returned, it means email confirmation is required
  // In that case, we should still return the data but the session will be null
  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. ' +
      'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
      'Then restart your development server with: npm run dev'
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) {
    throw new Error(error.message || 'Failed to sign in');
  }

  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message || 'Failed to sign out');
  }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(provider: 'google' | 'linkedin') {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. ' +
      'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
      'Then restart your development server with: npm run dev'
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    // Provide more helpful error messages
    if (error.message?.includes('not enabled') || error.message?.includes('validation_failed')) {
      throw new Error(
        `Le provider ${provider} n'est pas activé dans Supabase. ` +
        `Veuillez aller dans Supabase Dashboard → Authentication → Providers ` +
        `et activer le toggle pour ${provider === 'google' ? 'Google' : 'LinkedIn'}.`
      );
    }
    throw new Error(error.message || 'Failed to sign in with OAuth');
  }

  return data;
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Get user profile from public.users table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching user profile:', profileError);
  }

  return profile || {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || '',
    role: 'user' as const,
  };
}

/**
 * Get current session
 */
export async function getSession() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return session;
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string) {
  if (!isConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch user profile');
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<User>) {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. ' +
      'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
      'Then restart your development server with: npm run dev'
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Separate system role from professional role
  // The 'role' field in updates might be a professional role from onboarding form
  const { role, ...otherUpdates } = updates;
  
  // Map role to professional_role if it's not a system role
  const systemRoles = ['user', 'early', 'admin'];
  const cleanUpdates: any = { ...otherUpdates };
  
  if (role && !systemRoles.includes(role)) {
    // This is a professional role, not a system role
    cleanUpdates.professional_role = role;
  } else if (role && systemRoles.includes(role)) {
    // This is a valid system role, keep it
    cleanUpdates.role = role;
  }
  // If role is not provided or is undefined, don't update it

  const { data, error } = await supabase
    .from('users')
    .update(cleanUpdates)
    .eq('id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to update profile');
  }

  return data;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message || 'Failed to send password reset email');
  }
}

/**
 * Get events with causal chains for the Events page
 * Returns only events that have a causal chain
 */
/**
 * Get events with causal chains, including personalized events for the current user
 * Prioritizes personalized events (tavily:personalized:userId) over general events
 */
export async function getEventsWithCausalChains() {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. ' +
      'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
      'Then restart your development server with: npm run dev'
    );
  }

  // Check if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error('Failed to verify authentication');
  }
  if (!session) {
    throw new Error('User not authenticated. Please log in to view events.');
  }

  const userId = session.user.id;
  const personalizedSource = `tavily:personalized:${userId}`;

  // Get events with their causal chains
  const { data, error } = await supabase
    .from('nucigen_events')
    .select(`
      *,
      nucigen_causal_chains (
        id,
        cause,
        first_order_effect,
        second_order_effect,
        affected_sectors,
        affected_regions,
        time_horizon,
        confidence
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Failed to fetch events');
  }

  if (!data) {
    console.warn('No data returned from Supabase');
    return [];
  }

  // Get source information from events table for personalized check
  const eventIds = data.map((e: any) => e.source_event_id).filter(Boolean);
  let sourceMap: Record<string, string> = {};
  
  if (eventIds.length > 0) {
    const { data: sourceData } = await supabase
      .from('events')
      .select('id, source')
      .in('id', eventIds);
    
    if (sourceData) {
      sourceMap = sourceData.reduce((acc: Record<string, string>, e: any) => {
        acc[e.id] = e.source;
        return acc;
      }, {});
    }
  }

  // Filter out events without causal chains and add personalized flag
  const filtered = data
    .filter((event: any) => {
      const hasChains = event.nucigen_causal_chains && 
                       Array.isArray(event.nucigen_causal_chains) && 
                       event.nucigen_causal_chains.length > 0;
      return hasChains;
    })
    .map((event: any) => {
      // Check if this is a personalized event for this user
      const eventSource = event.source_event_id ? sourceMap[event.source_event_id] : null;
      const isPersonalized = eventSource === personalizedSource;
      return {
        ...event,
        isPersonalized, // Add flag for frontend prioritization
      };
    })
    // Sort: personalized events first, then by created_at
    .sort((a: any, b: any) => {
      if (a.isPersonalized && !b.isPersonalized) return -1;
      if (!a.isPersonalized && b.isPersonalized) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const personalizedCount = filtered.filter((e: any) => e.isPersonalized).length;
  console.log(`Fetched ${filtered.length} events (${personalizedCount} personalized) with causal chains`);
  return filtered;
}

/**
 * Get a single event by ID with its causal chain
 */
export async function getEventById(eventId: string) {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. ' +
      'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
      'Then restart your development server with: npm run dev'
    );
  }

  // Check if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error('Failed to verify authentication');
  }
  if (!session) {
    throw new Error('User not authenticated. Please log in to view events.');
  }

  const { data, error } = await supabase
    .from('nucigen_events')
    .select(`
      *,
      nucigen_causal_chains (
        id,
        cause,
        first_order_effect,
        second_order_effect,
        affected_sectors,
        affected_regions,
        time_horizon,
        confidence
      )
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Failed to fetch event');
  }

  if (!data) {
    throw new Error('Event not found');
  }

  // Ensure event has at least one causal chain
  if (!data.nucigen_causal_chains || data.nucigen_causal_chains.length === 0) {
    throw new Error('Event has no causal chain');
  }

  return data;
}

/**
 * Get event context for a nucigen_event (Tavily)
 */
export async function getEventContext(nucigenEventId: string) {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. ' +
      'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
      'Then restart your development server with: npm run dev'
    );
  }

  // Check if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error('Failed to verify authentication');
  }
  if (!session) {
    throw new Error('User not authenticated. Please log in to view context.');
  }

  const { data, error } = await supabase
    .from('event_context')
    .select('*')
    .eq('nucigen_event_id', nucigenEventId)
    .maybeSingle();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Failed to fetch event context');
  }

  return data;
}

/**
 * Get official documents for a nucigen_event (Firecrawl)
 */
export async function getOfficialDocuments(nucigenEventId: string) {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. ' +
      'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
      'Then restart your development server with: npm run dev'
    );
  }

  // Check if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error('Failed to verify authentication');
  }
  if (!session) {
    throw new Error('User not authenticated. Please log in to view documents.');
  }

  const { data, error } = await supabase
    .from('official_documents')
    .select('*')
    .eq('nucigen_event_id', nucigenEventId)
    .order('scraped_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Failed to fetch official documents');
  }

  return data || [];
}

/**
 * Get user preferences for feed personalization
 */
export async function getUserPreferences() {
  if (!isConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to fetch user preferences');
  }

  return data;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(preferences: {
  preferred_sectors?: string[];
  preferred_regions?: string[];
  preferred_event_types?: string[];
  focus_areas?: string[];
  feed_priority?: 'relevance' | 'recency' | 'impact' | 'balanced';
  min_impact_score?: number;
  min_confidence_score?: number;
  preferred_time_horizons?: string[];
  notify_on_new_event?: boolean;
  notify_frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
}) {
  if (!isConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update user preferences');
  }

  return data;
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Check if user has filled required onboarding fields
  return !!(user.company && user.sector && user.intended_use);
}

// ============================================
// PHASE 6: Full-Text Search Functions
// ============================================

export interface CausalChain {
  id: string;
  cause: string;
  first_order_effect: string;
  second_order_effect: string | null;
  affected_sectors: string[];
  affected_regions: string[];
  time_horizon: 'hours' | 'days' | 'weeks';
  confidence: number;
}

export interface EventWithChain {
  id: string;
  event_type: string;
  event_subtype: string | null;
  summary: string;
  country: string | null;
  region: string | null;
  sector: string | null;
  actors: string[];
  why_it_matters: string;
  first_order_effect: string | null;
  second_order_effect: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
  nucigen_causal_chains: CausalChain[];
  isPersonalized?: boolean;
  relevanceScore?: number;
}

export interface SearchEventResult {
  id: string;
  event_type: string;
  event_subtype: string | null;
  summary: string;
  country: string | null;
  region: string | null;
  sector: string | null;
  actors: string[];
  why_it_matters: string;
  first_order_effect: string | null;
  second_order_effect: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
  relevance_score: number;
  has_causal_chain: boolean;
}

export interface SearchOptions {
  searchQuery?: string;
  sectorFilter?: string[];
  regionFilter?: string[];
  eventTypeFilter?: string[];
  timeHorizonFilter?: string[];
  minImpactScore?: number;
  minConfidenceScore?: number;
  limit?: number;
  offset?: number;
}

/**
 * Search nucigen_events using full-text search
 */
export async function searchEvents(options: SearchOptions = {}): Promise<SearchEventResult[]> {
  if (!isConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const {
    searchQuery = '',
    sectorFilter = null,
    regionFilter = null,
    eventTypeFilter = null,
    timeHorizonFilter = null,
    minImpactScore = null,
    minConfidenceScore = null,
    limit = 50,
    offset = 0,
  } = options;

  const { data, error } = await supabase.rpc('search_nucigen_events', {
    search_query: searchQuery || '',
    sector_filter: sectorFilter,
    region_filter: regionFilter,
    event_type_filter: eventTypeFilter,
    time_horizon_filter: timeHorizonFilter,
    min_impact_score: minImpactScore,
    min_confidence_score: minConfidenceScore,
    limit_count: limit,
    offset_count: offset,
  });

  if (error) {
    console.error('Search error:', error);
    throw new Error(error.message || 'Failed to search events');
  }

  return (data || []) as SearchEventResult[];
}

/**
 * Count search results for pagination
 */
export async function countSearchResults(options: Omit<SearchOptions, 'limit' | 'offset'> = {}): Promise<number> {
  if (!isConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const {
    searchQuery = '',
    sectorFilter = null,
    regionFilter = null,
    eventTypeFilter = null,
    timeHorizonFilter = null,
    minImpactScore = null,
    minConfidenceScore = null,
  } = options;

  const { data, error } = await supabase.rpc('count_nucigen_events_search', {
    search_query: searchQuery || '',
    sector_filter: sectorFilter,
    region_filter: regionFilter,
    event_type_filter: eventTypeFilter,
    time_horizon_filter: timeHorizonFilter,
    min_impact_score: minImpactScore,
    min_confidence_score: minConfidenceScore,
  });

  if (error) {
    console.error('Count error:', error);
    throw new Error(error.message || 'Failed to count search results');
  }

  return (data as number) || 0;
}

/**
 * Get events with causal chains using search (for Events page)
 * This function combines search results with causal chain data
 */
export async function getEventsWithCausalChainsSearch(
  options: SearchOptions = {}
): Promise<EventWithChain[]> {
  if (!isConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  // Get search results
  const searchResults = await searchEvents(options);

  if (searchResults.length === 0) {
    return [];
  }

  // Get event IDs
  const eventIds = searchResults.map(e => e.id);

  // Fetch causal chains for these events
  const { data: chainsData, error: chainsError } = await supabase
    .from('nucigen_causal_chains')
    .select('*')
    .in('nucigen_event_id', eventIds);

  if (chainsError) {
    console.error('Error fetching causal chains:', chainsError);
    // Continue without chains if there's an error
  }

  // Group chains by event ID
  const chainsByEventId: Record<string, CausalChain[]> = {};
  if (chainsData) {
    chainsData.forEach((chain: any) => {
      if (!chainsByEventId[chain.nucigen_event_id]) {
        chainsByEventId[chain.nucigen_event_id] = [];
      }
      chainsByEventId[chain.nucigen_event_id].push({
        id: chain.id,
        cause: chain.cause,
        first_order_effect: chain.first_order_effect,
        second_order_effect: chain.second_order_effect,
        affected_sectors: chain.affected_sectors || [],
        affected_regions: chain.affected_regions || [],
        time_horizon: chain.time_horizon,
        confidence: chain.confidence,
      });
    });
  }

  // Get source information from events table for personalized check
  const userId = session.user.id;
  const personalizedSource = `tavily:personalized:${userId}`;
  let sourceMap: Record<string, string> = {};
  
  // Fetch source information for personalized events
  if (eventIds.length > 0) {
    // Get source_event_id from nucigen_events
    const { data: nucigenEventsData } = await supabase
      .from('nucigen_events')
      .select('id, source_event_id')
      .in('id', eventIds);
    
    if (nucigenEventsData) {
      const sourceEventIds = nucigenEventsData
        .map((e: any) => e.source_event_id)
        .filter(Boolean);
      
      if (sourceEventIds.length > 0) {
        const { data: sourceData } = await supabase
          .from('events')
          .select('id, source')
          .in('id', sourceEventIds);
        
        if (sourceData) {
          // Map nucigen_event_id -> source
          nucigenEventsData.forEach((ne: any) => {
            const sourceEvent = sourceData.find((se: any) => se.id === ne.source_event_id);
            if (sourceEvent) {
              sourceMap[ne.id] = sourceEvent.source;
            }
          });
        }
      }
    }
  }

  // Combine search results with causal chains and personalized flag
  const eventsWithChains: EventWithChain[] = searchResults.map((event) => {
    const eventSource = sourceMap[event.id];
    const isPersonalized = eventSource === personalizedSource;
    
    return {
      id: event.id,
      event_type: event.event_type,
      event_subtype: event.event_subtype,
      summary: event.summary,
      country: event.country,
      region: event.region,
      sector: event.sector,
      actors: event.actors || [],
      why_it_matters: event.why_it_matters,
      first_order_effect: event.first_order_effect,
      second_order_effect: event.second_order_effect,
      impact_score: event.impact_score,
      confidence: event.confidence,
      created_at: event.created_at,
      nucigen_causal_chains: chainsByEventId[event.id] || [],
      isPersonalized, // Add flag for frontend prioritization
      relevanceScore: (event as any).relevance_score || 0,
    };
  });

  return eventsWithChains;
}
