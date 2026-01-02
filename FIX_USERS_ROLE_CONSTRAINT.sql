-- Fix: Add professional_role field and ensure role constraint is respected
-- This fixes the issue where onboarding form sends professional role (analyst, trader, etc.)
-- but the users table expects system role (user, early, admin)

-- Step 1: Add professional_role column to store job role
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS professional_role TEXT;

-- Step 2: Migrate any existing role data that might be professional roles
-- (This is a safety measure - should not be needed if trigger works correctly)
UPDATE public.users 
SET professional_role = role 
WHERE role NOT IN ('user', 'early', 'admin')
AND professional_role IS NULL;

-- Step 3: Reset any invalid role values to 'user'
UPDATE public.users 
SET role = 'user' 
WHERE role IS NULL OR role NOT IN ('user', 'early', 'admin');

-- Step 4: Ensure role cannot be NULL
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN role SET NOT NULL;

-- Step 5: Re-apply the check constraint to be extra safe
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'early', 'admin'));

-- Step 6: Create index on professional_role for filtering
CREATE INDEX IF NOT EXISTS idx_users_professional_role ON public.users(professional_role);

