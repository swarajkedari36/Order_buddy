import { useState, useMemo } from "react";
import { Order } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Trash2, Search, Filter, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const OrderTable = ({ orders, onViewOrder, onDeleteOrder }: OrderTableProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'processing':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleDownload = (order: Order) => {
    if (order.invoiceFileUri) {
      toast({
        title: "Download Started",
        description: `Downloading invoice for order ${order.orderId}`,
      });
    } else {
      toast({
        title: "No Invoice",
        description: "No invoice file available for this order",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (orderId: string) => {
    onDeleteOrder(orderId);
    toast({
      title: "Order Deleted",
      description: `Order ${orderId} has been deleted successfully`,
    });
  };

  // Filter and search logic
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter((order) => {
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        case "amount":
          return b.orderAmount - a.orderAmount;
        case "customer":
          return a.customerName.localeCompare(b.customerName);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, sortBy]);

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ["Order ID", "Customer Name", "Amount (₹)", "Date", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedOrders.map(order => [
        order.orderId,
        `"${order.customerName}"`,
        order.orderAmount.toFixed(2),
        new Date(order.orderDate).toLocaleDateString(),
        order.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredAndSortedOrders.length} orders to CSV`,
    });
  };

  return (
    <Card className="shadow-card hover:shadow-hover transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Orders Overview</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {filteredAndSortedOrders.length} of {orders.length} Orders
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="hover:bg-success hover:text-success-foreground"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardTitle>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Order ID</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedOrders.map((order) => (
                <tr 
                  key={order.orderId} 
                  className="border-b border-border hover:bg-accent/50 transition-colors duration-200"
                >
                  <td className="py-4 px-4 font-mono text-sm text-primary font-medium">
                    #{order.orderId}
                  </td>
                  <td className="py-4 px-4 text-foreground font-medium">
                    {order.customerName}
                  </td>
                  <td className="py-4 px-4 text-foreground font-semibold">
                    ₹{order.orderAmount.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOrder(order)}
                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(order)}
                        className="hover:bg-success hover:text-success-foreground transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(order.orderId)}
                        className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAndSortedOrders.length === 0 && orders.length > 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No orders match your filters</p>
              <p className="text-muted-foreground text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
          
          {orders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No orders found</p>
              <p className="text-muted-foreground text-sm">Create your first order to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};