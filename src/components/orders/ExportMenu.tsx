import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OrderFilters, ExportOptions } from "@/types/order";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportMenuProps {
  filters: OrderFilters;
  onExport: (options: ExportOptions) => void;
}

const exportFormats = [
  { format: 'csv', label: 'CSV File', icon: FileText },
  { format: 'excel', label: 'Excel File', icon: FileSpreadsheet },
  { format: 'pdf', label: 'PDF Report', icon: File },
] as const;

const availableColumns = [
  { key: 'orderId', label: 'Order ID' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'customerEmail', label: 'Customer Email' },
  { key: 'customerPhone', label: 'Customer Phone' },
  { key: 'orderAmount', label: 'Order Amount' },
  { key: 'taxAmount', label: 'Tax Amount' },
  { key: 'totalAmount', label: 'Total Amount' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'currency', label: 'Currency' },
  { key: 'orderDate', label: 'Order Date' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'completedAt', label: 'Completed Date' },
  { key: 'notes', label: 'Notes' },
  { key: 'tags', label: 'Tags' },
];

export const ExportMenu = ({ filters, onExport }: ExportMenuProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'orderId', 'customerName', 'orderAmount', 'totalAmount', 'status', 'orderDate'
  ]);
  const { toast } = useToast();

  const handleFormatSelect = (format: 'csv' | 'excel' | 'pdf') => {
    setSelectedFormat(format);
    setIsDialogOpen(true);
  };

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      toast({
        title: "No Columns Selected",
        description: "Please select at least one column to export",
        variant: "destructive",
      });
      return;
    }

    onExport({
      format: selectedFormat,
      filters,
      columns: selectedColumns,
    });

    setIsDialogOpen(false);
    toast({
      title: "Export Started",
      description: `Generating ${selectedFormat.toUpperCase()} file with ${selectedColumns.length} columns`,
    });
  };

  const selectAllColumns = () => {
    setSelectedColumns(availableColumns.map(col => col.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {exportFormats.map(({ format, label, icon: Icon }) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleFormatSelect(format)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Export as {selectedFormat.toUpperCase()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={selectAllColumns}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllColumns}>
                Deselect All
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableColumns.map(column => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.key}
                    checked={selectedColumns.includes(column.key)}
                    onCheckedChange={() => handleColumnToggle(column.key)}
                  />
                  <Label htmlFor={column.key} className="text-sm">
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleExport} className="flex-1">
                Export ({selectedColumns.length} columns)
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
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