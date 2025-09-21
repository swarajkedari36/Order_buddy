import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Order, OrderStatus, OrderPriority, Currency, OrderFilters } from "@/types/order";
import { Customer } from "@/types/customer";
import { Search, Filter, X, Calendar as CalendarIcon, ChevronDown, Save, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface AdvancedSearchProps {
  orders: Order[];
  customers: Customer[];
  onFiltersChange: (filters: OrderFilters) => void;
  onResultsChange: (results: Order[]) => void;
}

interface SavedSearch {
  name: string;
  filters: OrderFilters;
}

export const AdvancedSearch = ({ 
  orders, 
  customers, 
  onFiltersChange, 
  onResultsChange 
}: AdvancedSearchProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<OrderPriority[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<Currency[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchName, setSearchName] = useState("");

  // Get unique values from orders for filter options
  const allTags = Array.from(new Set(orders.flatMap(order => order.tags || [])));
  const allCustomers = Array.from(new Set(orders.map(order => order.customerName)));

  useEffect(() => {
    applyFilters();
  }, [filters, orders]);

  const applyFilters = () => {
    let filteredOrders = [...orders];

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.orderId.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower) ||
        order.notes?.toLowerCase().includes(searchLower) ||
        order.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filteredOrders = filteredOrders.filter(order => 
        filters.status!.includes(order.status)
      );
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filteredOrders = filteredOrders.filter(order => 
        order.priority && filters.priority!.includes(order.priority)
      );
    }

    // Currency filter
    if (filters.currency && filters.currency.length > 0) {
      filteredOrders = filteredOrders.filter(order => 
        order.currency && filters.currency!.includes(order.currency)
      );
    }

    // Amount range filter
    if (filters.minAmount !== undefined) {
      filteredOrders = filteredOrders.filter(order => 
        (order.totalAmount || order.orderAmount) >= filters.minAmount!
      );
    }
    if (filters.maxAmount !== undefined) {
      filteredOrders = filteredOrders.filter(order => 
        (order.totalAmount || order.orderAmount) <= filters.maxAmount!
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.orderDate) >= new Date(filters.dateFrom!)
      );
    }
    if (filters.dateTo) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.orderDate) <= new Date(filters.dateTo!)
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filteredOrders = filteredOrders.filter(order => 
        order.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    onResultsChange(filteredOrders);
    onFiltersChange(filters);
  };

  const updateFilters = (newFilters: Partial<OrderFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedCurrencies([]);
    setSelectedTags([]);
    onResultsChange(orders);
    onFiltersChange({});
  };

  const saveSearch = () => {
    if (!searchName.trim()) return;

    const newSearch: SavedSearch = {
      name: searchName,
      filters: { ...filters }
    };

    setSavedSearches(prev => [...prev, newSearch]);
    setSearchName("");
  };

  const loadSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    
    // Update UI states
    setSelectedStatuses(search.filters.status || []);
    setSelectedPriorities(search.filters.priority || []);
    setSelectedCurrencies(search.filters.currency || []);
    setSelectedTags(search.filters.tags || []);
    
    if (search.filters.dateFrom) setDateFrom(new Date(search.filters.dateFrom));
    if (search.filters.dateTo) setDateTo(new Date(search.filters.dateTo));
  };

  const toggleStatus = (status: OrderStatus) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    
    setSelectedStatuses(newStatuses);
    updateFilters({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const togglePriority = (priority: OrderPriority) => {
    const newPriorities = selectedPriorities.includes(priority)
      ? selectedPriorities.filter(p => p !== priority)
      : [...selectedPriorities, priority];
    
    setSelectedPriorities(newPriorities);
    updateFilters({ priority: newPriorities.length > 0 ? newPriorities : undefined });
  };

  const toggleCurrency = (currency: Currency) => {
    const newCurrencies = selectedCurrencies.includes(currency)
      ? selectedCurrencies.filter(c => c !== currency)
      : [...selectedCurrencies, currency];
    
    setSelectedCurrencies(newCurrencies);
    updateFilters({ currency: newCurrencies.length > 0 ? newCurrencies : undefined });
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    updateFilters({ tags: newTags.length > 0 ? newTags : undefined });
  };

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof OrderFilters];
    return value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
  }).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Advanced Search
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              placeholder="Search orders, customers, emails, notes..."
              value={filters.search || ""}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-6">
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Saved Searches</h4>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSearch(search)}
                      className="text-xs"
                    >
                      {search.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Save Current Search */}
            <div className="flex space-x-2">
              <Input
                placeholder="Search name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveSearch} disabled={!searchName.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status Filter */}
              <div>
                <h4 className="font-medium mb-3">Status</h4>
                <div className="space-y-2">
                  {(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'] as OrderStatus[]).map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      />
                      <label htmlFor={`status-${status}`} className="text-sm capitalize cursor-pointer">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <h4 className="font-medium mb-3">Priority</h4>
                <div className="space-y-2">
                  {(['low', 'medium', 'high', 'urgent'] as OrderPriority[]).map(priority => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={selectedPriorities.includes(priority)}
                        onCheckedChange={() => togglePriority(priority)}
                      />
                      <label htmlFor={`priority-${priority}`} className="text-sm capitalize cursor-pointer">
                        {priority}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Currency Filter */}
              <div>
                <h4 className="font-medium mb-3">Currency</h4>
                <div className="space-y-2">
                  {(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'] as Currency[]).map(currency => (
                    <div key={currency} className="flex items-center space-x-2">
                      <Checkbox
                        id={`currency-${currency}`}
                        checked={selectedCurrencies.includes(currency)}
                        onCheckedChange={() => toggleCurrency(currency)}
                      />
                      <label htmlFor={`currency-${currency}`} className="text-sm cursor-pointer">
                        {currency}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <h4 className="font-medium mb-3">Amount Range</h4>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={filters.minAmount || ""}
                  onChange={(e) => updateFilters({ minAmount: e.target.value ? Number(e.target.value) : undefined })}
                />
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={filters.maxAmount || ""}
                  onChange={(e) => updateFilters({ maxAmount: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <h4 className="font-medium mb-3">Date Range</h4>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => {
                        setDateFrom(date);
                        updateFilters({ dateFrom: date?.toISOString() });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => {
                        setDateTo(date);
                        updateFilters({ dateTo: date?.toISOString() });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.search && (
              <Badge variant="secondary">
                Search: "{filters.search}"
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilters({ search: undefined })}
                />
              </Badge>
            )}
            {selectedStatuses.map(status => (
              <Badge key={status} variant="secondary">
                Status: {status}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleStatus(status)}
                />
              </Badge>
            ))}
            {selectedPriorities.map(priority => (
              <Badge key={priority} variant="secondary">
                Priority: {priority}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => togglePriority(priority)}
                />
              </Badge>
            ))}
            {selectedCurrencies.map(currency => (
              <Badge key={currency} variant="secondary">
                Currency: {currency}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleCurrency(currency)}
                />
              </Badge>
            ))}
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary">
                Tag: {tag}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};