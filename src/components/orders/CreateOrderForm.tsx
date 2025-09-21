import { useState } from "react";
import { CreateOrderRequest } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateOrderFormData extends Omit<CreateOrderRequest, 'orderAmount'> {
  orderAmount: string | number;
}

interface CreateOrderFormProps {
  onSubmit: (order: CreateOrderRequest) => void;
  onCancel: () => void;
}

export const CreateOrderForm = ({ onSubmit, onCancel }: CreateOrderFormProps) => {
  const [formData, setFormData] = useState<CreateOrderFormData>({
    customerName: "",
    orderAmount: "",
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const { toast } = useToast();

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

  return (
    <Card className="max-w-2xl mx-auto shadow-card">
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
          <div className="space-y-2">
            <Label htmlFor="customerName" className="text-foreground font-medium">
              Customer Name *
            </Label>
            <Input
              id="customerName"
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="Enter customer name"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderAmount" className="text-foreground font-medium">
              Order Amount (₹) *
            </Label>
            <Input
              id="orderAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.orderAmount}
              onChange={(e) => setFormData({ ...formData, orderAmount: e.target.value })}
              placeholder="Enter amount"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceFile" className="text-foreground font-medium">
              Invoice File (PDF)
            </Label>
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
                className="w-full justify-start h-10 px-3 text-left"
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

          <div className="flex space-x-4 pt-4">
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