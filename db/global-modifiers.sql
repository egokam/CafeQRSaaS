-- Global modifiers: platform-owned modifier templates which any cafe can link
-- to its own products, but no cafe admin can change.
BEGIN;

ALTER TABLE public.modifier_groups
  ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false;
UPDATE public.modifier_groups SET is_global = false WHERE is_global IS NULL;
ALTER TABLE public.modifier_groups
  ALTER COLUMN is_global SET DEFAULT false,
  ALTER COLUMN is_global SET NOT NULL;

ALTER TABLE public.modifier_options
  ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false;
UPDATE public.modifier_options AS option_row
SET is_global = group_row.is_global
FROM public.modifier_groups AS group_row
WHERE group_row.id = option_row.modifier_group_id
  AND option_row.is_global IS DISTINCT FROM group_row.is_global;
ALTER TABLE public.modifier_options
  ALTER COLUMN is_global SET DEFAULT false,
  ALTER COLUMN is_global SET NOT NULL;

ALTER TABLE public.modifier_groups
  DROP CONSTRAINT IF EXISTS modifier_groups_scope_check;
ALTER TABLE public.modifier_groups
  ADD CONSTRAINT modifier_groups_scope_check
  CHECK ((is_global AND cafe_id IS NULL) OR (NOT is_global AND cafe_id IS NOT NULL));

CREATE OR REPLACE FUNCTION public.enforce_modifier_option_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parent_is_global boolean;
BEGIN
  SELECT is_global INTO parent_is_global
  FROM public.modifier_groups
  WHERE id = NEW.modifier_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modifier group % does not exist', NEW.modifier_group_id;
  END IF;

  NEW.is_global := parent_is_global;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_modifier_option_scope_trigger ON public.modifier_options;
CREATE TRIGGER enforce_modifier_option_scope_trigger
BEFORE INSERT OR UPDATE OF modifier_group_id, is_global ON public.modifier_options
FOR EACH ROW EXECUTE FUNCTION public.enforce_modifier_option_scope();

CREATE OR REPLACE FUNCTION public.enforce_product_modifier_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  product_cafe_id uuid;
  group_cafe_id uuid;
  group_is_global boolean;
BEGIN
  SELECT cafe_id INTO product_cafe_id FROM public.products WHERE id = NEW.product_id;
  SELECT cafe_id, is_global INTO group_cafe_id, group_is_global
  FROM public.modifier_groups WHERE id = NEW.modifier_group_id;

  IF NOT FOUND OR product_cafe_id IS NULL THEN
    RAISE EXCEPTION 'Product or modifier group does not exist';
  END IF;

  IF NOT group_is_global AND group_cafe_id IS DISTINCT FROM product_cafe_id THEN
    RAISE EXCEPTION 'A product may only link to its cafe modifier groups or global modifier groups';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_product_modifier_scope_trigger ON public.product_modifiers;
CREATE TRIGGER enforce_product_modifier_scope_trigger
BEFORE INSERT OR UPDATE OF product_id, modifier_group_id ON public.product_modifiers
FOR EACH ROW EXECUTE FUNCTION public.enforce_product_modifier_scope();

-- Direct browser reads are constrained when a JWT contains cafe_id. The app's
-- privileged server actions remain the write boundary and enforce the same
-- tenant checks against their signed application sessions.
CREATE OR REPLACE FUNCTION public.current_cafe_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    (COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'cafe_id'),
    ''
  )::uuid
$$;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('modifier_groups', 'modifier_options', 'product_modifiers')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END
$$;

ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;

-- Public consumers may read only the policy-approved rows. Writes are
-- available to authenticated users, but every RLS write policy below limits
-- them to their own non-global cafe data. Platform writes use service_role
-- only after the super-admin server action has verified its signed session.
GRANT SELECT ON public.modifier_groups, public.modifier_options, public.product_modifiers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.modifier_groups, public.modifier_options, public.product_modifiers TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.modifier_groups, public.modifier_options, public.product_modifiers FROM anon;

CREATE POLICY modifier_groups_scoped_read ON public.modifier_groups
  FOR SELECT TO anon, authenticated
  USING (is_global OR cafe_id = public.current_cafe_id());
CREATE POLICY modifier_groups_local_insert ON public.modifier_groups
  FOR INSERT TO authenticated
  WITH CHECK (cafe_id = public.current_cafe_id() AND NOT is_global);
CREATE POLICY modifier_groups_local_update ON public.modifier_groups
  FOR UPDATE TO authenticated
  USING (cafe_id = public.current_cafe_id() AND NOT is_global)
  WITH CHECK (cafe_id = public.current_cafe_id() AND NOT is_global);
CREATE POLICY modifier_groups_local_delete ON public.modifier_groups
  FOR DELETE TO authenticated
  USING (cafe_id = public.current_cafe_id() AND NOT is_global);

CREATE POLICY modifier_options_scoped_read ON public.modifier_options
  FOR SELECT TO anon, authenticated
  USING (
    is_global OR EXISTS (
      SELECT 1 FROM public.modifier_groups AS group_row
      WHERE group_row.id = modifier_options.modifier_group_id
        AND group_row.cafe_id = public.current_cafe_id()
    )
  );
CREATE POLICY modifier_options_local_insert ON public.modifier_options
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.modifier_groups AS group_row
    WHERE group_row.id = modifier_options.modifier_group_id
      AND group_row.cafe_id = public.current_cafe_id()
      AND NOT group_row.is_global
  ));
CREATE POLICY modifier_options_local_update ON public.modifier_options
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.modifier_groups AS group_row
    WHERE group_row.id = modifier_options.modifier_group_id
      AND group_row.cafe_id = public.current_cafe_id()
      AND NOT group_row.is_global
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.modifier_groups AS group_row
    WHERE group_row.id = modifier_options.modifier_group_id
      AND group_row.cafe_id = public.current_cafe_id()
      AND NOT group_row.is_global
  ));
CREATE POLICY modifier_options_local_delete ON public.modifier_options
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.modifier_groups AS group_row
    WHERE group_row.id = modifier_options.modifier_group_id
      AND group_row.cafe_id = public.current_cafe_id()
      AND NOT group_row.is_global
  ));

CREATE POLICY product_modifiers_scoped_read ON public.product_modifiers
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products AS product_row
    JOIN public.modifier_groups AS group_row ON group_row.id = product_modifiers.modifier_group_id
    WHERE product_row.id = product_modifiers.product_id
      AND product_row.cafe_id = public.current_cafe_id()
      AND (group_row.is_global OR group_row.cafe_id = product_row.cafe_id)
  ));
CREATE POLICY product_modifiers_scoped_write ON public.product_modifiers
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products AS product_row
    JOIN public.modifier_groups AS group_row ON group_row.id = product_modifiers.modifier_group_id
    WHERE product_row.id = product_modifiers.product_id
      AND product_row.cafe_id = public.current_cafe_id()
      AND (group_row.is_global OR group_row.cafe_id = product_row.cafe_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products AS product_row
    JOIN public.modifier_groups AS group_row ON group_row.id = product_modifiers.modifier_group_id
    WHERE product_row.id = product_modifiers.product_id
      AND product_row.cafe_id = public.current_cafe_id()
      AND (group_row.is_global OR group_row.cafe_id = product_row.cafe_id)
  ));

COMMIT;
