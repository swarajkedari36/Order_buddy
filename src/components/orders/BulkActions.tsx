import { useState } from "react";
import { Order, OrderStatus, OrderPriority } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, CheckSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsProps {
  selectedOrders: Order[];
  onBulkUpdate: (orderIds: string[], updates: Partial<Order>) => Promise<void>;
  onBulkDelete: (orderIds: string[]) => Promise<void>;
  onClearSelection: () => void;
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const BulkActions = ({ 
  selectedOrders, 
  onBulkUpdate, 
  onBulkDelete, 
  onClearSelection 
}: BulkActionsProps) => {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState<{
    status?: OrderStatus;
    priority?: OrderPriority;
  }>({});
  const { toast } = useToast();

  const handleBulkUpdate = async () => {
    if (!updateData.status && !updateData.priority) {
      toast({
        title: "No Changes",
        description: "Please select at least one field to update",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderIds = selectedOrders.map(order => order.orderId);
      await onBulkUpdate(orderIds, updateData);
      
      toast({
        title: "Bulk Update Successful",
        description: `Updated ${selectedOrders.length} orders`,
      });

      setIsUpdateDialogOpen(false);
      setUpdateData({});
      onClearSelection();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update orders. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const orderIds = selectedOrders.map(order => order.orderId);
      await onBulkDelete(orderIds);
      
      toast({
        title: "Bulk Delete Successful",
        description: `Deleted ${selectedOrders.length} orders`,
      });

      setIsDeleteDialogOpen(false);
      onClearSelection();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete orders. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (selectedOrders.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
        <CheckSquare className="h-4 w-4" />
        <span className="text-sm font-medium">
          {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
        </span>
        
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUpdateDialogOpen(true)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Update
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Orders</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Updating {selectedOrders.length} selected orders
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {selectedOrders.slice(0, 5).map(order => (
                  <Badge key={order.orderId} variant="outline" className="text-xs">
                    {order.orderId}
                  </Badge>
                ))}
                {selectedOrders.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedOrders.length - 5} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={updateData.status || ''}
                  onValueChange={(value: OrderStatus) => 
                    setUpdateData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={updateData.priority || ''}
                  onValueChange={(value: OrderPriority) => 
                    setUpdateData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleBulkUpdate} className="flex-1">
                Update Orders
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete {selectedOrders.length} selected orders? This action cannot be undone.
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {selectedOrders.slice(0, 5).map(order => (
                  <Badge key={order.orderId} variant="destructive" className="text-xs">
                    {order.orderId}
                  </Badge>
                ))}
                {selectedOrders.length > 5 && (
                  <Badge variant="destructive" className="text-xs">
                    +{selectedOrders.length - 5} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                className="flex-1"
              >
                Delete {selectedOrders.length} Orders
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};