-- Cashier employee PIN authentication migration.
-- This migration is deliberately idempotent and is safe to run before deploy.
BEGIN;

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 100),
  username text NOT NULL CHECK (username = lower(username)),
  pin text NOT NULL CHECK (pin LIKE 'scrypt$%'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT employees_cafe_username_key UNIQUE (cafe_id, username)
);

CREATE INDEX IF NOT EXISTS employees_cafe_id_idx ON public.employees(cafe_id);
CREATE INDEX IF NOT EXISTS employees_active_cafe_id_idx
  ON public.employees(cafe_id) WHERE is_active;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS employee_id uuid;
ALTER TABLE public.payment_receipts
  ADD COLUMN IF NOT EXISTS employee_id uuid;

-- Recreate the two FKs with SET NULL so historical receipts/orders remain
-- valid when an employee account is removed.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_employee_id_fkey;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.payment_receipts DROP CONSTRAINT IF EXISTS payment_receipts_employee_id_fkey;
ALTER TABLE public.payment_receipts
  ADD CONSTRAINT payment_receipts_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_employee_id_idx ON public.orders(employee_id);
CREATE INDEX IF NOT EXISTS payment_receipts_employee_id_idx ON public.payment_receipts(employee_id);

-- Browser roles have no direct employee access. Tenant checks happen in the
-- server actions and the service role bypasses RLS only after those checks.
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.employees FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.orders, public.payment_receipts FROM anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.employees TO service_role;

DROP POLICY IF EXISTS employees_service_role_access ON public.employees;
CREATE POLICY employees_service_role_access ON public.employees
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
