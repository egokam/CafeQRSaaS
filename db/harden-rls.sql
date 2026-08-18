-- The application performs all privileged mutations through server actions
-- using the service-role key. These policies previously allowed any anonymous
-- or authenticated browser client to read or mutate cross-tenant records.
BEGIN;

DROP POLICY IF EXISTS "Allow public access for admin_messages" ON public.admin_messages;

DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for everyone" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for realtime" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public select orders" ON public.orders;
DROP POLICY IF EXISTS "Strict Client Orders Access" ON public.orders;

DROP POLICY IF EXISTS "Allow cafe admin access" ON public.products;
DROP POLICY IF EXISTS "Allow public read for products" ON public.products;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;

DROP POLICY IF EXISTS "Public read active cafes" ON public.cafes;

DROP POLICY IF EXISTS "Allow public read tables" ON public.tables;
DROP POLICY IF EXISTS "Public read tables" ON public.tables;

-- POS registration, approval, and device-state reads are server actions. Do
-- not grant browser roles a bypass around their cafe-scoped checks. Remove any
-- legacy POS policies deterministically, including policies with old names.
DO $$
DECLARE
  device_policy record;
BEGIN
  FOR device_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pos_devices'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pos_devices', device_policy.policyname);
  END LOOP;
END;
$$;

-- Defense in depth: a later permissive policy cannot grant mutations unless
-- the corresponding SQL privilege is also deliberately restored.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.admin_messages,
           public.cafes,
           public.menu_categories,
           public.modifier_groups,
           public.modifier_options,
           public.orders,
           public.payment_receipts,
           public.platform_settings,
           public.pos_devices,
           public.product_modifiers,
           public.products,
           public.tables,
           public.telegram_bot_state
  FROM anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.pos_devices FROM anon, authenticated;

-- Serialise approvals per cafe at the database layer. This protects the
-- subscription limit if two admins approve devices concurrently, while the
-- application retains its clearer preflight message for normal requests.
CREATE OR REPLACE FUNCTION public.enforce_pos_device_approval_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  configured_limit integer;
  approved_count integer;
BEGIN
  IF NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT max_cashiers
  INTO configured_limit
  FROM public.cafes
  WHERE id = NEW.cafe_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POS_DEVICE_CAFE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)
  INTO approved_count
  FROM public.pos_devices
  WHERE cafe_id = NEW.cafe_id
    AND status = 'approved'
    AND id IS DISTINCT FROM NEW.id;

  IF approved_count >= GREATEST(COALESCE(configured_limit, 1), 1) THEN
    RAISE EXCEPTION 'POS_DEVICE_LIMIT_REACHED' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_pos_device_approval_limit() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_pos_device_approval_limit ON public.pos_devices;
CREATE TRIGGER enforce_pos_device_approval_limit
BEFORE INSERT OR UPDATE OF status, cafe_id ON public.pos_devices
FOR EACH ROW
EXECUTE FUNCTION public.enforce_pos_device_approval_limit();

COMMIT;
