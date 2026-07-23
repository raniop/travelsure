CREATE TABLE IF NOT EXISTS public.claim_counters (
  year integer PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0
);

GRANT ALL ON public.claim_counters TO service_role;

ALTER TABLE public.claim_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.next_claim_number(
  p_year integer DEFAULT (EXTRACT(YEAR FROM NOW()))::integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
BEGIN
  INSERT INTO public.claim_counters AS c (year, last_value)
  VALUES (p_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_value = c.last_value + 1
  RETURNING last_value INTO v_next;

  RETURN p_year::text || lpad(v_next::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_claim_number(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_claim_number(integer) TO anon, authenticated, service_role;