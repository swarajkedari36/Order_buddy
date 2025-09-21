import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Order } from "@/types/order";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/orders/Dashboard";
import { OrderTable } from "@/components/orders/OrderTable";
import { CreateOrderForm } from "@/components/orders/CreateOrderForm";
import { OrderDetail } from "@/components/orders/OrderDetail";
import { CustomerManagement } from "@/components/customers/CustomerManagement";
import { UserProfile } from "@/components/profile/UserProfile";
import { AdvancedAnalytics } from "@/components/analytics/AdvancedAnalytics";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ViewMode = 'dashboard' | 'orders' | 'create' | 'detail' | 'customers' | 'profile';

const Index = () => {
  const { orders, loading, createOrder, deleteOrder } = useOrders();
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const sendEmailNotification = async (order: Order, userEmail: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          to: userEmail,
          customerName: order.customerName,
          orderId: order.orderId,
          orderAmount: order.orderAmount,
        }
      });

      if (error) {
        console.error('Error sending notification:', error);
        toast({
          title: "Warning",
          description: "Order created but email notification failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Order created and notification sent!",
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleCreateOrder = () => {
    setCurrentView('create');
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('detail');
  };

  const handleOrderSubmit = async (orderRequest: any) => {
    const newOrder = await createOrder(orderRequest);
    if (newOrder && user?.email) {
      await sendEmailNotification(newOrder, user.email);
    }
    setCurrentView('orders');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
              <p className="text-muted-foreground">Overview of your order management system</p>
            </div>
            <Dashboard orders={orders} />
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground">All Orders</h3>
                <button
                  onClick={() => setCurrentView('orders')}
                  className="text-primary hover:text-primary-hover transition-colors"
                >
                  View All →
                </button>
              </div>
              <OrderTable 
                orders={orders.slice(0, 5)} 
                onViewOrder={handleViewOrder}
                onDeleteOrder={deleteOrder}
              />
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">All Orders</h2>
              <p className="text-muted-foreground">Manage and track all your orders</p>
            </div>
            <OrderTable 
              orders={orders} 
              onViewOrder={handleViewOrder}
              onDeleteOrder={deleteOrder}
            />
          </div>
        );
      case 'create':
        return (
          <div className="container mx-auto px-6 py-8">
            <CreateOrderForm
              onSubmit={handleOrderSubmit}
              onCancel={() => setCurrentView('dashboard')}
            />
          </div>
        );
      case 'detail':
        return selectedOrder ? (
          <div className="container mx-auto px-6 py-8">
            <OrderDetail
              order={selectedOrder}
              onBack={() => setCurrentView('orders')}
            />
          </div>
        ) : null;
      case 'customers':
        return <CustomerManagement />;
      case 'profile':
        return <UserProfile />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header 
        onCreateOrder={handleCreateOrder} 
        user={user} 
        onSignOut={signOut}
        onNavigate={setCurrentView}
        currentView={currentView}
      />
      
      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                currentView === 'dashboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('orders')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                currentView === 'orders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setCurrentView('customers')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                currentView === 'customers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Customers
            </button>
          </div>
        </div>
      </nav>

      {renderContent()}
    </div>
  );
};

export default Index;
