-- Fix RLS policy for order_activities table to allow proper order creation
-- The current policy fails because it checks for order existence during the INSERT trigger
-- We need to allow direct insertion when the user_id matches the authenticated user

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert activities for their orders" ON public.order_activities;

-- Create a new policy that allows insertion when user_id matches authenticated user
CREATE POLICY "Users can insert their own activities" 
ON public.order_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also ensure the log_order_activity trigger properly sets user_id
-- Update the trigger function to ensure user_id is always set
CREATE OR REPLACE FUNCTION public.log_order_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Update last activity timestamp
  NEW.last_activity_at = now();
  
  -- Log activity in order_activities table
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_activities (
      order_id, user_id, activity_type, description, new_values
    ) VALUES (
      NEW.id, NEW.user_id, 'created', 
      'Order created', 
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.order_activities (
      order_id, user_id, activity_type, description, old_values, new_values
    ) VALUES (
      NEW.id, NEW.user_id, 'updated',
      'Order updated',
      to_jsonb(OLD),
      to_jsonb(NEW) 
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS log_order_activity_trigger ON public.orders;
CREATE TRIGGER log_order_activity_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_activity();