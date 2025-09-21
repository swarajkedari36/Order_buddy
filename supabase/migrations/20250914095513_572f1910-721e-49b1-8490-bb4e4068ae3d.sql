-- Enable activity tracking for orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now();

-- Create customers table for better customer management
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email character varying,
  phone character varying,
  company text,
  address text,
  notes text,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" 
ON public.customers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for customers updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update customer statistics
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Update customer stats when order is inserted or updated
  IF TG_OP = 'INSERT' THEN
    UPDATE public.customers 
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.order_amount
    WHERE user_id = NEW.user_id 
    AND (name = NEW.customer_name OR email = NEW.customer_email);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Decrease old customer stats
    UPDATE public.customers 
    SET 
      total_orders = total_orders - 1,
      total_spent = total_spent - OLD.order_amount
    WHERE user_id = OLD.user_id 
    AND (name = OLD.customer_name OR email = OLD.customer_email);
    
    -- Increase new customer stats  
    UPDATE public.customers 
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.order_amount
    WHERE user_id = NEW.user_id 
    AND (name = NEW.customer_name OR email = NEW.customer_email);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.customers 
    SET 
      total_orders = total_orders - 1,
      total_spent = total_spent - OLD.order_amount
    WHERE user_id = OLD.user_id 
    AND (name = OLD.customer_name OR email = OLD.customer_email);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add activity tracking trigger for orders
CREATE OR REPLACE FUNCTION public.log_order_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
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

-- Create trigger for order activity logging
CREATE TRIGGER log_order_activity_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_activity();