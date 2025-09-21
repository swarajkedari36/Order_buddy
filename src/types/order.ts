export type OrderStatus = 'draft' | 'pending' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface Order {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderAmount: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  orderDate: string;
  dueDate?: string;
  completedAt?: string;
  invoiceFileUri?: string;
  status: OrderStatus;
  priority?: OrderPriority;
  currency?: Currency;
  notes?: string;
  tags?: string[];
  shippingAddress?: string;
  billingAddress?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderAmount: number;
  taxRate?: number;
  discountAmount?: number;
  dueDate?: string;
  priority?: OrderPriority;
  currency?: Currency;
  notes?: string;
  tags?: string[];
  shippingAddress?: string;
  billingAddress?: string;
  invoiceFile?: File;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus[];
  priority?: OrderPriority[];
  currency?: Currency[];
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface OrderActivity {
  id: string;
  orderId: string;
  userId?: string;
  activityType: string;
  description: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filters?: OrderFilters;
  columns?: string[];
}