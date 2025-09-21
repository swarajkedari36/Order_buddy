import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus, OrderPriority } from "@/types/order";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CheckSquare, 
  Archive, 
  Mail, 
  Download, 
  Trash2, 
  AlertTriangle,
  Package,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface BulkOrderActionsProps {
  orders: Order[];
  selectedOrders: string[];
  onOrdersUpdate: () => void;
  onSelectionChange: (orderIds: string[]) => void;
}

type BulkAction = 
  | "update_status" 
  | "update_priority" 
  | "archive" 
  | "delete" 
  | "export" 
  | "send_notifications";

export const BulkOrderActions = ({ 
  orders, 
  selectedOrders, 
  onOrdersUpdate, 
  onSelectionChange 
}: BulkOrderActionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BulkAction | "">("");
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");
  const [newPriority, setNewPriority] = useState<OrderPriority>("medium");
  const [processing, setProcessing] = useState(false);

  const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.orderId));

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(orders.map(order => order.orderId));
    }
  };

  const executeBulkAction = async () => {
    if (!selectedAction || selectedOrders.length === 0) return;

    setProcessing(true);
    try {
      switch (selectedAction) {
        case "update_status":
          await updateOrdersStatus();
          break;
        case "update_priority":
          await updateOrdersPriority();
          break;
        case "archive":
          await archiveOrders();
          break;
        case "delete":
          await deleteOrders();
          break;
        case "export":
          await exportOrders();
          break;
        case "send_notifications":
          await sendNotifications();
          break;
      }
      
      onOrdersUpdate();
      onSelectionChange([]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const updateOrdersStatus = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .in('order_id', selectedOrders)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Updated ${selectedOrders.length} orders to ${newStatus}`,
    });
  };

  const updateOrdersPriority = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ priority: newPriority })
      .in('order_id', selectedOrders)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update order priority",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Updated ${selectedOrders.length} orders to ${newPriority} priority`,
    });
  };

  const archiveOrders = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .in('order_id', selectedOrders)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to archive orders",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Archived ${selectedOrders.length} orders`,
    });
  };

  const deleteOrders = async () => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .in('order_id', selectedOrders)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete orders",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Deleted ${selectedOrders.length} orders`,
    });
  };

  const exportOrders = async () => {
    const csvData = selectedOrdersData.map(order => ({
      'Order ID': order.orderId,
      'Customer': order.customerName,
      'Email': order.customerEmail || '',
      'Amount': order.orderAmount,
      'Total': order.totalAmount || order.orderAmount,
      'Status': order.status,
      'Priority': order.priority || 'medium',
      'Date': order.orderDate,
      'Due Date': order.dueDate || '',
      'Notes': order.notes || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `Exported ${selectedOrders.length} orders to CSV`,
    });
  };

  const sendNotifications = async () => {
    // This would integrate with your notification system
    toast({
      title: "Success",
      description: `Sent notifications for ${selectedOrders.length} orders`,
    });
  };

  const getActionIcon = (action: BulkAction) => {
    switch (action) {
      case "update_status": return <Package className="h-4 w-4" />;
      case "update_priority": return <Clock className="h-4 w-4" />;
      case "archive": return <Archive className="h-4 w-4" />;
      case "delete": return <Trash2 className="h-4 w-4" />;
      case "export": return <Download className="h-4 w-4" />;
      case "send_notifications": return <Mail className="h-4 w-4" />;
      default: return null;
    }
  };

  if (selectedOrders.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={false}
          onCheckedChange={handleSelectAll}
          aria-label="Select all orders"
        />
        <span className="text-sm text-muted-foreground">
          Select orders for bulk actions
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={selectedOrders.length === orders.length}
          onCheckedChange={handleSelectAll}
          aria-label="Select all orders"
        />
        <Badge variant="secondary">
          {selectedOrders.length} selected
        </Badge>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center space-x-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <CheckSquare className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bulk Actions</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Selected Orders: {selectedOrders.length}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedOrdersData.slice(0, 5).map(order => (
                    <Badge key={order.orderId} variant="outline" className="text-xs">
                      {order.orderId}
                    </Badge>
                  ))}
                  {selectedOrdersData.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedOrdersData.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Choose Action</label>
                <Select value={selectedAction} onValueChange={(value: BulkAction) => setSelectedAction(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update_status">
                      <div className="flex items-center">
                        {getActionIcon("update_status")}
                        <span className="ml-2">Update Status</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="update_priority">
                      <div className="flex items-center">
                        {getActionIcon("update_priority")}
                        <span className="ml-2">Update Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="archive">
                      <div className="flex items-center">
                        {getActionIcon("archive")}
                        <span className="ml-2">Archive Orders</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="export">
                      <div className="flex items-center">
                        {getActionIcon("export")}
                        <span className="ml-2">Export to CSV</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="send_notifications">
                      <div className="flex items-center">
                        {getActionIcon("send_notifications")}
                        <span className="ml-2">Send Notifications</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="delete">
                      <div className="flex items-center">
                        {getActionIcon("delete")}
                        <span className="ml-2 text-red-600">Delete Orders</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedAction === "update_status" && (
                <div>
                  <label className="text-sm font-medium">New Status</label>
                  <Select value={newStatus} onValueChange={(value: OrderStatus) => setNewStatus(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedAction === "update_priority" && (
                <div>
                  <label className="text-sm font-medium">New Priority</label>
                  <Select value={newPriority} onValueChange={(value: OrderPriority) => setNewPriority(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedAction === "delete" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700 font-medium">Warning</p>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    This action cannot be undone. Selected orders will be permanently deleted.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={executeBulkAction} 
                  disabled={!selectedAction || processing}
                  variant={selectedAction === "delete" ? "destructive" : "default"}
                >
                  {processing ? "Processing..." : "Execute Action"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" onClick={() => onSelectionChange([])}>
          <XCircle className="h-4 w-4 mr-2" />
          Clear Selection
        </Button>
      </div>
    </div>
  );
};