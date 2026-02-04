-- Migration: RPC to delete a search_history row (SECURITY DEFINER)
-- Purpose: Bypass RLS so the API server (service role) can delete by user_id + session_id

CREATE OR REPLACE FUNCTION public.delete_search_history(
  p_user_id UUID,
  p_session_id TEXT
)
RETURNS void AS $$
BEGIN
  DELETE FROM public.search_history
  WHERE user_id = p_user_id AND session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_search_history(UUID, TEXT) IS 'Delete one search history entry for a user; used by API server.';

GRANT EXECUTE ON FUNCTION public.delete_search_history(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_search_history(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_search_history(UUID, TEXT) TO anon;
