import { useState } from "react";
import { OrderFilters as OrderFiltersType, OrderStatus, OrderPriority, Currency } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter, RotateCcw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFiltersChange: (filters: OrderFiltersType) => void;
  onClearFilters: () => void;
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' }
];

const priorityOptions: { value: OrderPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' }
];

export const OrderFilters = ({ filters, onFiltersChange, onClearFilters }: OrderFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof OrderFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addToArrayFilter = (key: 'status' | 'priority' | 'currency' | 'tags', value: string) => {
    const currentArray = filters[key] || [];
    if (!currentArray.includes(value)) {
      updateFilter(key, [...currentArray, value]);
    }
  };

  const removeFromArrayFilter = (key: 'status' | 'priority' | 'currency' | 'tags', value: string) => {
    const currentArray = filters[key] || [];
    updateFilter(key, currentArray.filter(item => item !== value));
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearFilters();
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="Customer name, order ID..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>

              {/* Amount Range */}
              <div>
                <Label>Min Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount || ''}
                  onChange={(e) => updateFilter('minAmount', parseFloat(e.target.value) || undefined)}
                />
              </div>

              <div>
                <Label>Max Amount</Label>
                <Input
                  type="number"
                  placeholder="999999.00"
                  value={filters.maxAmount || ''}
                  onChange={(e) => updateFilter('maxAmount', parseFloat(e.target.value) || undefined)}
                />
              </div>

              {/* Date Range */}
              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div>
                <Label>Add Status</Label>
                <Select onValueChange={(value) => addToArrayFilter('status', value as OrderStatus)}>
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

              {/* Priority Filter */}
              <div>
                <Label>Add Priority</Label>
                <Select onValueChange={(value) => addToArrayFilter('priority', value as OrderPriority)}>
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

              {/* Currency Filter */}
              <div>
                <Label>Add Currency</Label>
                <Select onValueChange={(value) => addToArrayFilter('currency', value as Currency)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="space-y-2">
                <Label>Active Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {(filters.status || []).map(status => (
                    <Badge key={status} variant="outline" className="gap-1">
                      Status: {statusOptions.find(s => s.value === status)?.label}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFromArrayFilter('status', status)}
                      />
                    </Badge>
                  ))}
                  {(filters.priority || []).map(priority => (
                    <Badge key={priority} variant="outline" className="gap-1">
                      Priority: {priorityOptions.find(p => p.value === priority)?.label}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFromArrayFilter('priority', priority)}
                      />
                    </Badge>
                  ))}
                  {(filters.currency || []).map(currency => (
                    <Badge key={currency} variant="outline" className="gap-1">
                      Currency: {currency}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFromArrayFilter('currency', currency)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};