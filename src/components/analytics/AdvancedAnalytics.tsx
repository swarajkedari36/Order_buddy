import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Users, Calendar, Download, Filter } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  averageOrderValue: number;
  topCustomers: Array<{name: string; revenue: number; orders: number}>;
  revenueByStatus: Array<{status: string; value: number; count: number}>;
  dailyRevenue: Array<{date: string; revenue: number; orders: number}>;
  monthlyTrends: Array<{month: string; revenue: number; orders: number; customers: number}>;
}

export const AdvancedAnalytics = () => {
  const { user } = useAuth();
  const { orders, loading: ordersLoading } = useOrders();
  const { customers, loading: customersLoading } = useCustomers();
  const [dateRange, setDateRange] = useState("30d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (orders.length && customers.length) {
      calculateAnalytics();
    }
  }, [orders, customers, dateRange]);

  const calculateAnalytics = () => {
    const now = new Date();
    const daysBack = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const startDate = subDays(now, daysBack);
    
    const filteredOrders = orders.filter(order => 
      new Date(order.orderDate) >= startDate
    );

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || order.orderAmount), 0);
    const totalOrders = filteredOrders.length;
    const totalCustomers = new Set(filteredOrders.map(order => order.customerName)).size;
    
    // Calculate previous period for growth
    const prevStartDate = subDays(startDate, daysBack);
    const prevOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= prevStartDate && orderDate < startDate;
    });
    
    const prevRevenue = prevOrders.reduce((sum, order) => sum + (order.totalAmount || order.orderAmount), 0);
    const prevOrderCount = prevOrders.length;
    const prevCustomerCount = new Set(prevOrders.map(order => order.customerName)).size;
    
    const revenueGrowth = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const orderGrowth = prevOrderCount ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : 0;
    const customerGrowth = prevCustomerCount ? ((totalCustomers - prevCustomerCount) / prevCustomerCount) * 100 : 0;
    
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    // Revenue by status
    const statusRevenue = filteredOrders.reduce((acc, order) => {
      const revenue = order.totalAmount || order.orderAmount;
      acc[order.status] = (acc[order.status] || 0) + revenue;
      return acc;
    }, {} as Record<string, number>);

    const revenueByStatus = Object.entries(statusRevenue).map(([status, value]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      value,
      count: filteredOrders.filter(o => o.status === status).length
    }));

    // Top customers
    const customerRevenue = customers.map(customer => ({
      name: customer.name,
      revenue: customer.totalSpent,
      orders: customer.totalOrders
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Daily revenue trends
    const dailyData: Record<string, {revenue: number; orders: number}> = {};
    for (let i = 0; i < daysBack; i++) {
      const date = subDays(now, i);
      const dateStr = format(date, "MMM dd");
      dailyData[dateStr] = { revenue: 0, orders: 0 };
    }

    filteredOrders.forEach(order => {
      const dateStr = format(new Date(order.orderDate), "MMM dd");
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += order.totalAmount || order.orderAmount;
        dailyData[dateStr].orders += 1;
      }
    });

    const dailyRevenue = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .reverse();

    // Monthly trends (last 6 months)
    const monthlyData: Record<string, {revenue: number; orders: number; customers: Set<string>}> = {};
    for (let i = 0; i < 6; i++) {
      const date = subDays(now, i * 30);
      const monthStr = format(date, "MMM yyyy");
      monthlyData[monthStr] = { revenue: 0, orders: 0, customers: new Set() };
    }

    orders.forEach(order => {
      const monthStr = format(new Date(order.orderDate), "MMM yyyy");
      if (monthlyData[monthStr]) {
        monthlyData[monthStr].revenue += order.totalAmount || order.orderAmount;
        monthlyData[monthStr].orders += 1;
        monthlyData[monthStr].customers.add(order.customerName);
      }
    });

    const monthlyTrends = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers.size
      }))
      .reverse();

    setAnalytics({
      totalRevenue,
      totalOrders,
      totalCustomers,
      revenueGrowth,
      orderGrowth,
      customerGrowth,
      averageOrderValue,
      topCustomers: customerRevenue,
      revenueByStatus,
      dailyRevenue,
      monthlyTrends
    });
  };

  if (ordersLoading || customersLoading || !analytics) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {analytics.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(analytics.revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analytics.totalOrders.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {analytics.orderGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(analytics.orderGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold">{analytics.totalCustomers.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {analytics.customerGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.customerGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(analytics.customerGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">₹{analytics.averageOrderValue.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground mt-1">Per order</p>
              </div>
              <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="status">Order Status</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trends</CardTitle>
              <CardDescription>Revenue and order volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any, name: string) => [
                      name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Status</CardTitle>
                <CardDescription>Distribution of revenue across order statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.revenueByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({status, value}) => `${status}: ₹${value.toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.revenueByStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Status Breakdown</CardTitle>
                <CardDescription>Count and revenue by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.revenueByStatus.map((item, index) => (
                    <div key={item.status} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{item.status}</p>
                          <p className="text-sm text-muted-foreground">{item.count} orders</p>
                        </div>
                      </div>
                      <Badge variant="secondary">₹{item.value.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Your highest value customers by total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{customer.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{(customer.revenue / customer.orders).toFixed(0)}/order
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>Revenue, orders, and customers over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue (₹)" />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--secondary))" name="Orders" />
                    <Line type="monotone" dataKey="customers" stroke="hsl(var(--accent))" name="Customers" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};