-- The API uses this private state document, not the legacy demo tables in 001.
-- Run once in the Supabase SQL Editor before deploying the updated API.
CREATE TABLE IF NOT EXISTS public.uc_app_state (
  id text PRIMARY KEY CHECK (id = 'primary'),
  revision bigint NOT NULL DEFAULT 0,
  data jsonb NOT NULL
);
ALTER TABLE public.uc_app_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.uc_app_state FROM anon, authenticated;
GRANT ALL ON public.uc_app_state TO service_role;

CREATE TABLE IF NOT EXISTS public.uc_login_attempts (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
ALTER TABLE public.uc_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.uc_login_attempts FROM anon, authenticated;
GRANT ALL ON public.uc_login_attempts TO service_role;

-- Atomic across function instances. Count all submissions, including successful
-- ones, so parallel guesses cannot bypass a process-local lockout.
CREATE OR REPLACE FUNCTION public.uc_consume_login_attempt(attempt_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE entry public.uc_login_attempts;
BEGIN
  DELETE FROM public.uc_login_attempts WHERE expires_at <= now();
  INSERT INTO public.uc_login_attempts AS target (key, count, expires_at)
    VALUES (attempt_key, 1, now() + interval '15 minutes')
    ON CONFLICT (key) DO UPDATE SET count = target.count + 1
    RETURNING * INTO entry;
  RETURN jsonb_build_object(
    'allowed', entry.count <= 5,
    'attemptsLeft', greatest(0, 5 - entry.count),
    'lockoutRemaining', greatest(1, ceil(extract(epoch FROM entry.expires_at - now())))
  );
END;
$$;
REVOKE ALL ON FUNCTION public.uc_consume_login_attempt(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.uc_consume_login_attempt(text) TO service_role;
