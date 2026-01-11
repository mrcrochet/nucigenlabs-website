-- ============================================
-- CREATE FUNCTION: upsert_user_profile
-- ============================================
-- This function creates or updates a user profile with SECURITY DEFINER
-- which bypasses RLS policies completely
-- 
-- Execute this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  p_user_id UUID,
  p_email TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_professional_role TEXT DEFAULT NULL,
  p_intended_use TEXT DEFAULT NULL,
  p_exposure TEXT DEFAULT NULL,
  p_sector TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'user'
)
RETURNS public.users AS $$
DECLARE
  result public.users;
BEGIN
  -- Upsert user profile
  -- SECURITY DEFINER bypasses RLS policies
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    company,
    professional_role,
    intended_use,
    exposure,
    sector,
    updated_at
  )
  VALUES (
    p_user_id,
    COALESCE(p_email, ''),
    COALESCE(p_name, p_email, ''),
    COALESCE(p_role, 'user'),
    p_company,
    p_professional_role,
    p_intended_use,
    p_exposure,
    p_sector,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(NULLIF(EXCLUDED.email, ''), public.users.email),
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name),
    company = COALESCE(EXCLUDED.company, public.users.company),
    professional_role = COALESCE(EXCLUDED.professional_role, public.users.professional_role),
    intended_use = COALESCE(EXCLUDED.intended_use, public.users.intended_use),
    exposure = COALESCE(EXCLUDED.exposure, public.users.exposure),
    sector = COALESCE(EXCLUDED.sector, public.users.sector),
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_user_profile TO authenticated, anon;
