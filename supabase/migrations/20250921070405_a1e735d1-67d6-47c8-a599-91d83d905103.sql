-- Fix recursion causing stack depth errors in orders triggers
-- 1) Recreate activity logging trigger function to avoid updating orders table
-- 2) Add a separate BEFORE trigger to set last_activity_at
-- 3) Ensure updated_at is maintained via BEFORE UPDATE trigger

-- Safety: drop existing trigger if present
DROP TRIGGER IF EXISTS log_order_activity_trigger ON public.orders;

-- Recreate logging function WITHOUT updating the orders table (prevents recursion)
CREATE OR REPLACE FUNCTION public.log_order_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_activities (
      order_id, user_id, activity_type, description, new_values
    ) VALUES (
      NEW.id, NEW.user_id, 'created', 'Order created', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.order_activities (
      order_id, user_id, activity_type, description, old_values, new_values
    ) VALUES (
      NEW.id, NEW.user_id, 'updated', 'Order updated', to_jsonb(OLD), to_jsonb(NEW)
    );
  END IF;

  -- AFTER triggers can return NULL safely
  RETURN NULL;
END;
$$;

-- Recreate the AFTER trigger just for logging
CREATE TRIGGER log_order_activity_trigger
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_activity();

-- Create a dedicated BEFORE trigger to maintain last_activity_at without recursion
CREATE OR REPLACE FUNCTION public.set_order_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.last_activity_at := COALESCE(NEW.last_activity_at, now());
  ELSE
    -- On any update, refresh the last activity timestamp
    NEW.last_activity_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach BEFORE trigger for last_activity_at
DROP TRIGGER IF EXISTS set_order_last_activity_trigger ON public.orders;
CREATE TRIGGER set_order_last_activity_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_last_activity();

-- Ensure updated_at is consistently maintained
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
