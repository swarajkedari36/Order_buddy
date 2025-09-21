import { useState, useEffect } from "react";
import { Customer, CreateCustomerRequest } from "@/types/customer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCustomers();
    } else {
      setCustomers([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCustomers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch customers",
          variant: "destructive",
        });
        return;
      }

      const formattedCustomers: Customer[] = data.map(customer => ({
        id: customer.id,
        userId: customer.user_id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        address: customer.address,
        notes: customer.notes,
        totalOrders: customer.total_orders || 0,
        totalSpent: customer.total_spent || 0,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      }));

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerRequest: CreateCustomerRequest): Promise<Customer | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create customers",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: customerRequest.name,
          email: customerRequest.email,
          phone: customerRequest.phone,
          company: customerRequest.company,
          address: customerRequest.address,
          notes: customerRequest.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        toast({
          title: "Error",
          description: "Failed to create customer",
          variant: "destructive",
        });
        return null;
      }

      const newCustomer: Customer = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        address: data.address,
        notes: data.notes,
        totalOrders: data.total_orders || 0,
        totalSpent: data.total_spent || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setCustomers(prev => [newCustomer, ...prev]);
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<CreateCustomerRequest>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          company: updates.company,
          address: updates.address,
          notes: updates.notes,
        })
        .eq('id', customerId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating customer:', error);
        toast({
          title: "Error",
          description: "Failed to update customer",
          variant: "destructive",
        });
        return false;
      }

      await fetchCustomers();
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });

      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting customer:', error);
        toast({
          title: "Error",
          description: "Failed to delete customer",
          variant: "destructive",
        });
        return;
      }

      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  return {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    fetchCustomers,
  };
};