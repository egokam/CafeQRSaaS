-- Fail-safe POS order routing. All routing is serialized per cafe and is
-- performed in PostgreSQL, so competing checkout requests cannot pick the
-- same least-loaded terminal.
BEGIN;

ALTER TABLE public.pos_devices
  ADD COLUMN IF NOT EXISTS last_heartbeat timestamp with time zone;
UPDATE public.pos_devices
  SET last_heartbeat = COALESCE(last_heartbeat, now());
ALTER TABLE public.pos_devices
  ALTER COLUMN last_heartbeat SET DEFAULT now(),
  ALTER COLUMN last_heartbeat SET NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assigned_device_id uuid;
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_assigned_device_id_fkey;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_assigned_device_id_fkey
  FOREIGN KEY (assigned_device_id) REFERENCES public.pos_devices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pos_devices_active_heartbeat_idx
  ON public.pos_devices(cafe_id, status, last_heartbeat DESC);
CREATE INDEX IF NOT EXISTS orders_pending_assignment_idx
  ON public.orders(cafe_id, assigned_device_id, created_at)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.assign_order_to_cashier(
  p_order_id uuid,
  p_cafe_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_assigned_device_id uuid;
BEGIN
  IF p_order_id IS NULL OR p_cafe_id IS NULL THEN
    RAISE EXCEPTION 'ORDER_ASSIGNMENT_CONTEXT_REQUIRED' USING ERRCODE = '22023';
  END IF;

  -- One routing transaction per cafe. The device/order row locks below keep
  -- the database state stable, while this advisory lock serializes load
  -- counts across concurrent checkouts and failover sweeps.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_cafe_id::text, 0));

  PERFORM 1
  FROM public.orders
  WHERE id = p_order_id AND cafe_id = p_cafe_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND_FOR_CAFE' USING ERRCODE = 'P0002';
  END IF;

  -- Lock every currently eligible device before calculating its queue depth.
  PERFORM 1
  FROM public.pos_devices
  WHERE cafe_id = p_cafe_id
    AND status = 'approved'
    AND last_heartbeat >= now() - interval '1 minute'
  ORDER BY id
  FOR UPDATE;

  SELECT device.id
  INTO v_assigned_device_id
  FROM public.pos_devices AS device
  LEFT JOIN public.orders AS pending_order
    ON pending_order.assigned_device_id = device.id
    AND pending_order.cafe_id = p_cafe_id
    AND pending_order.status = 'pending'
  WHERE device.cafe_id = p_cafe_id
    AND device.status = 'approved'
    AND device.last_heartbeat >= now() - interval '1 minute'
  GROUP BY device.id, device.last_heartbeat
  ORDER BY count(pending_order.id) ASC, device.last_heartbeat DESC, device.id ASC
  LIMIT 1;

  -- If no terminal is active, this deliberately clears the assignment so the
  -- order remains visible through the NULL fallback and can be claimed later.
  UPDATE public.orders
  SET assigned_device_id = v_assigned_device_id
  WHERE id = p_order_id AND cafe_id = p_cafe_id;

  RETURN v_assigned_device_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.redistribute_stale_orders(p_cafe_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order record;
  v_redistributed_count integer := 0;
BEGIN
  IF p_cafe_id IS NULL THEN
    RAISE EXCEPTION 'CAFE_CONTEXT_REQUIRED' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_cafe_id::text, 0));

  -- Include NULL assignments as well: orders created while every POS was
  -- offline are claimed on the first subsequent heartbeat instead of being
  -- shown to every terminal indefinitely.
  FOR v_order IN
    SELECT order_row.id
    FROM public.orders AS order_row
    LEFT JOIN public.pos_devices AS assigned_device
      ON assigned_device.id = order_row.assigned_device_id
    WHERE order_row.cafe_id = p_cafe_id
      AND order_row.status = 'pending'
      AND (
        order_row.assigned_device_id IS NULL
        OR assigned_device.id IS NULL
        OR assigned_device.status <> 'approved'
        OR assigned_device.last_heartbeat < now() - interval '1 minute'
      )
    ORDER BY order_row.created_at ASC, order_row.id ASC
    FOR UPDATE OF order_row SKIP LOCKED
  LOOP
    PERFORM public.assign_order_to_cashier(v_order.id, p_cafe_id);
    v_redistributed_count := v_redistributed_count + 1;
  END LOOP;

  RETURN v_redistributed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.route_new_pending_order_to_cashier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM public.assign_order_to_cashier(NEW.id, NEW.cafe_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS route_new_pending_order_to_cashier ON public.orders;
CREATE TRIGGER route_new_pending_order_to_cashier
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.route_new_pending_order_to_cashier();

REVOKE ALL ON FUNCTION public.assign_order_to_cashier(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.redistribute_stale_orders(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.route_new_pending_order_to_cashier() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_order_to_cashier(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.redistribute_stale_orders(uuid) TO service_role;

COMMIT;
