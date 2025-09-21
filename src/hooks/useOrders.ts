import { useState, useEffect } from "react";
import { Order, CreateOrderRequest } from "@/types/order";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        return;
      }

      const formattedOrders: Order[] = data.map(order => ({
        orderId: order.order_id,
        customerName: order.customer_name,
        orderAmount: parseFloat(order.order_amount.toString()),
        orderDate: order.order_date,
        invoiceFileUri: order.invoice_file_uri,
        status: order.status as Order['status'],
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadInvoiceFile = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('invoices')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload invoice file",
        variant: "destructive",
      });
      return null;
    }

    return fileName;
  };

  const createOrder = async (orderRequest: CreateOrderRequest): Promise<Order | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create orders",
        variant: "destructive",
      });
      return null;
    }

    try {
      let invoiceFileUri: string | undefined;
      
      if (orderRequest.invoiceFile) {
        const uploadedFileName = await uploadInvoiceFile(orderRequest.invoiceFile);
        if (uploadedFileName) {
          invoiceFileUri = uploadedFileName;
        }
      }

      const orderCount = orders.length;
      const orderId = `ORD-${String(orderCount + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_id: orderId,
          user_id: user.id,
          customer_name: orderRequest.customerName,
          order_amount: orderRequest.orderAmount,
          invoice_file_uri: invoiceFileUri,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        toast({
          title: "Error",
          description: "Failed to create order",
          variant: "destructive",
        });
        return null;
      }

      const newOrder: Order = {
        orderId: data.order_id,
        customerName: data.customer_name,
        orderAmount: parseFloat(data.order_amount.toString()),
        orderDate: data.order_date,
        invoiceFileUri: data.invoice_file_uri,
        status: data.status as Order['status'],
      };

      setOrders(prev => [newOrder, ...prev]);
      
      toast({
        title: "Success",
        description: "Order created successfully",
      });

      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('order_id', orderId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting order:', error);
        toast({
          title: "Error",
          description: "Failed to delete order",
          variant: "destructive",
        });
        return;
      }

      setOrders(prev => prev.filter(order => order.orderId !== orderId));
      
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(order => order.orderId === orderId);
  };

  return {
    orders,
    loading,
    createOrder,
    deleteOrder,
    getOrderById,
    fetchOrders,
  };
};