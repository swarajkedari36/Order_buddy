import { useState } from "react";
import { CreateOrderRequest, OrderPriority, Currency } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Save, X, Plus, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedCreateOrderFormData extends Omit<CreateOrderRequest, 'orderAmount'> {
  orderAmount: string | number;
}

interface EnhancedCreateOrderFormProps {
  onSubmit: (order: CreateOrderRequest) => void;
  onCancel: () => void;
}

const priorityOptions: { value: OrderPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

const currencyOptions: { value: Currency; label: string; symbol: string }[] = [
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' }
];

export const EnhancedCreateOrderForm = ({ onSubmit, onCancel }: EnhancedCreateOrderFormProps) => {
  const [formData, setFormData] = useState<EnhancedCreateOrderFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    orderAmount: "",
    taxRate: 0,
    discountAmount: 0,
    priority: 'medium',
    currency: 'INR',
    notes: "",
    tags: [],
    shippingAddress: "",
    billingAddress: "",
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  const selectedCurrency = currencyOptions.find(c => c.value === formData.currency);
  const orderAmount = parseFloat(formData.orderAmount.toString()) || 0;
  const calculatedTotal = orderAmount + (orderAmount * (formData.taxRate || 0) / 100) - (formData.discountAmount || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.orderAmount || parseFloat(formData.orderAmount.toString()) <= 0) {
      toast({
        title: "Validation Error", 
        description: "Order amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.customerEmail && !formData.customerEmail.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      ...formData,
      orderAmount: parseFloat(formData.orderAmount.toString()) || 0,
      invoiceFile: invoiceFile || undefined,
    });

    toast({
      title: "Order Created",
      description: `Order for ${formData.customerName} has been created successfully`,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      setInvoiceFile(file);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const updateField = (field: keyof EnhancedCreateOrderFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create New Order</span>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail || ''}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone || ''}
                  onChange={(e) => updateField('customerPhone', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value: Currency) => updateField('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map(currency => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.symbol} {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orderAmount">Order Amount ({selectedCurrency?.symbol}) *</Label>
                <Input
                  id="orderAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.orderAmount}
                  onChange={(e) => updateField('orderAmount', e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxRate || 0}
                  onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="discountAmount">Discount Amount ({selectedCurrency?.symbol})</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountAmount || 0}
                  onChange={(e) => updateField('discountAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: OrderPriority) => updateField('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${priority.color.split(' ')[0]}`} />
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              </div>
            </div>

            {/* Calculated Total */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4" />
                <span className="font-semibold">Order Summary</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{selectedCurrency?.symbol}{orderAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({formData.taxRate || 0}%):</span>
                  <span>{selectedCurrency?.symbol}{(orderAmount * (formData.taxRate || 0) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{selectedCurrency?.symbol}{(formData.discountAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>{selectedCurrency?.symbol}{calculatedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Textarea
                id="shippingAddress"
                value={formData.shippingAddress || ''}
                onChange={(e) => updateField('shippingAddress', e.target.value)}
                placeholder="Enter shipping address..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Textarea
                id="billingAddress"
                value={formData.billingAddress || ''}
                onChange={(e) => updateField('billingAddress', e.target.value)}
                placeholder="Enter billing address..."
                rows={3}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Additional notes about the order..."
              rows={3}
            />
          </div>

          {/* Invoice File */}
          <div className="space-y-2">
            <Label htmlFor="invoiceFile">Invoice File (PDF)</Label>
            <div className="relative">
              <Input
                id="invoiceFile"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-10 px-3"
                onClick={() => document.getElementById('invoiceFile')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {invoiceFile ? invoiceFile.name : "Choose PDF file"}
              </Button>
            </div>
            {invoiceFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {invoiceFile.name} ({(invoiceFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary transition-all duration-300"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Order
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};