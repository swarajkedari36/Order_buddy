-- Fix security warnings: Update functions to have proper search_path settings

-- Fix calculate_order_total function
CREATE OR REPLACE FUNCTION public.calculate_order_total(
  order_amount DECIMAL(15,2),
  tax_rate DECIMAL(5,2),
  discount_amount DECIMAL(15,2)
) RETURNS DECIMAL(15,2) 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN order_amount + (order_amount * tax_rate / 100) - discount_amount;
END;
$$;

-- Fix update_order_total function
CREATE OR REPLACE FUNCTION public.update_order_total()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.total_amount = public.calculate_order_total(
    NEW.order_amount, 
    COALESCE(NEW.tax_rate, 0), 
    COALESCE(NEW.discount_amount, 0)
  );
  
  -- Set completed_at when status becomes completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix get_user_role function  
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS VARCHAR(50) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1),
    'user'
  );
END;
$$;