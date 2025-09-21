-- Fix the trigger timing issue - the trigger should run AFTER INSERT/UPDATE
-- not BEFORE, so the order exists when we try to log activities

-- Drop the existing trigger
DROP TRIGGER IF EXISTS log_order_activity_trigger ON public.orders;

-- Update the trigger function to not modify NEW (since it's AFTER trigger)
CREATE OR REPLACE FUNCTION public.log_order_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  target_record RECORD;
BEGIN
  -- For AFTER triggers, we work with the record that was just inserted/updated
  IF TG_OP = 'INSERT' THEN
    target_record := NEW;
    
    -- Update the last_activity_at separately since we can't modify NEW in AFTER trigger
    UPDATE public.orders 
    SET last_activity_at = now() 
    WHERE id = NEW.id;
    
    -- Log activity in order_activities table
    INSERT INTO public.order_activities (
      order_id, user_id, activity_type, description, new_values
    ) VALUES (
      NEW.id, NEW.user_id, 'created', 
      'Order created', 
      to_jsonb(NEW)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    target_record := NEW;
    
    -- Update the last_activity_at
    UPDATE public.orders 
    SET last_activity_at = now() 
    WHERE id = NEW.id;
    
    -- Log activity in order_activities table
    INSERT INTO public.order_activities (
      order_id, user_id, activity_type, description, old_values, new_values
    ) VALUES (
      NEW.id, NEW.user_id, 'updated',
      'Order updated',
      to_jsonb(OLD),
      to_jsonb(NEW) 
    );
  END IF;
  
  RETURN target_record;
END;
$$;

-- Recreate the trigger as AFTER INSERT/UPDATE
CREATE TRIGGER log_order_activity_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_activity();