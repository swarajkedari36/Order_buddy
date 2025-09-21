-- Add production-level fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Update status enum to include more workflow states
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'));

-- Update priority enum
ALTER TABLE public.orders ADD CONSTRAINT orders_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders (customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders (order_date);
CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON public.orders (total_amount);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON public.orders (priority);
CREATE INDEX IF NOT EXISTS idx_orders_tags ON public.orders USING GIN(tags);

-- Create a function to calculate total amount
CREATE OR REPLACE FUNCTION public.calculate_order_total(
  order_amount DECIMAL(15,2),
  tax_rate DECIMAL(5,2),
  discount_amount DECIMAL(15,2)
) RETURNS DECIMAL(15,2) AS $$
BEGIN
  RETURN order_amount + (order_amount * tax_rate / 100) - discount_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate total amount
CREATE OR REPLACE FUNCTION public.update_order_total()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_total ON public.orders;
CREATE TRIGGER trigger_update_order_total
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_order_total();

-- Create user roles table for RBAC
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1),
    'user'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create order activity log table for audit trail
CREATE TABLE IF NOT EXISTS public.order_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on order_activities
ALTER TABLE public.order_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for order_activities
CREATE POLICY "Users can view activities for their orders" ON public.order_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_activities.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activities for their orders" ON public.order_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_activities.order_id 
      AND orders.user_id = auth.uid()
    )
  );