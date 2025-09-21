import { useMemo } from "react";
import { Order, OrderStatus, OrderPriority } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Clock, AlertCircle } from "lucide-react";

interface AnalyticsDashboardProps {
  orders: Order[];
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  destructive: "hsl(var(--destructive))",
  warning: "#f59e0b",
  success: "#10b981",
  info: "#3b82f6",
};

const STATUS_COLORS = {
  draft: COLORS.muted,
  pending: COLORS.warning,
  approved: COLORS.info,
  processing: COLORS.accent,
  shipped: COLORS.secondary,
  delivered: COLORS.success,
  completed: COLORS.primary,
  cancelled: COLORS.destructive,
  refunded: COLORS.destructive,
};

export const AnalyticsDashboard = ({ orders }: AnalyticsDashboardProps) => {
  const analytics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || order.orderAmount), 0);
    const avgOrderValue = totalRevenue / totalOrders || 0;

    // Status distribution
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: ((count / totalOrders) * 100).toFixed(1),
      color: STATUS_COLORS[status as OrderStatus],
    }));

    // Priority distribution
    const priorityCounts = orders.reduce((acc, order) => {
      const priority = order.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<OrderPriority, number>);

    const priorityData = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      count,
      value: count,
    }));

    // Monthly trends (last 12 months)
    const monthlyTrends = orders.reduce((acc, order) => {
      const date = new Date(order.orderDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, orders: 0, revenue: 0 };
      }
      acc[monthKey].orders += 1;
      acc[monthKey].revenue += order.totalAmount || order.orderAmount;
      
      return acc;
    }, {} as Record<string, { month: string; orders: number; revenue: number }>);

    const trendsData = Object.values(monthlyTrends)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    // Currency distribution
    const currencyCounts = orders.reduce((acc, order) => {
      const currency = order.currency || 'INR';
      acc[currency] = (acc[currency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const currencyData = Object.entries(currencyCounts).map(([currency, count]) => ({
      currency,
      count,
      percentage: ((count / totalOrders) * 100).toFixed(1),
    }));

    // Recent activities
    const urgentOrders = orders.filter(order => order.priority === 'urgent' && order.status !== 'completed');
    const overdueOrders = orders.filter(order => {
      if (!order.dueDate || order.status === 'completed') return false;
      return new Date(order.dueDate) < new Date();
    });

    // Performance metrics
    const completedOrders = orders.filter(order => order.status === 'completed');
    const avgCompletionTime = completedOrders.reduce((sum, order) => {
      if (!order.completedAt) return sum;
      const start = new Date(order.orderDate);
      const end = new Date(order.completedAt);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
    }, 0) / completedOrders.length || 0;

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      statusData,
      priorityData,
      trendsData,
      currencyData,
      urgentOrders: urgentOrders.length,
      overdueOrders: overdueOrders.length,
      avgCompletionTime,
      completedOrders: completedOrders.length,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedOrders} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ₹{analytics.avgOrderValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{analytics.urgentOrders}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgCompletionTime.toFixed(1)}d</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overdueOrders} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      {analytics.trendsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="orders" fill={COLORS.secondary} name="Orders" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Currency & Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.currencyData.map(({ currency, count, percentage }) => (
                <div key={currency} className="flex justify-between items-center">
                  <Badge variant="outline">{currency}</Badge>
                  <div className="text-right">
                    <div className="font-medium">{count} orders</div>
                    <div className="text-sm text-muted-foreground">{percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.statusData.slice(0, 5).map(({ status, count, percentage }) => (
                <div key={status} className="flex justify-between items-center">
                  <Badge variant="outline">{status}</Badge>
                  <div className="text-right">
                    <div className="font-medium">{count} orders</div>
                    <div className="text-sm text-muted-foreground">{percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};