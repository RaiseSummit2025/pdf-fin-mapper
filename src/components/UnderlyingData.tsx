import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { FileSelector } from '@/components/FileSelector';
import { FinancialEntry } from '@/types/financial';
import { financialDataToCSV } from '@/lib/csv';
import { Search, Download, Filter } from 'lucide-react';

export function UnderlyingData() {
  const { currentFinancialData } = useFinancialData();
  const [entries] = useState<FinancialEntry[]>(currentFinancialData.entries);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof FinancialEntry>('description');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(amount);

  const filteredEntries = entries
    .filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.originalLine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.ifrsCategory.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || entry.highLevelCategory === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortOrder === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });

  const handleSort = (field: keyof FinancialEntry) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExport = () => {
    const csvContent = financialDataToCSV(filteredEntries);

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch(category) {
      case 'Assets': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Liabilities': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Equity': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Revenue': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case 'Expenses': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const SortableHeader = ({ field, children }: { field: keyof FinancialEntry; children: React.ReactNode }) => (
    <th 
      className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortField === field && (
          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Underlying Data</h1>
        <p className="text-muted-foreground">Complete flat file with all extracted and mapped financial data</p>
      </div>

      <FileSelector />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Financial Data Export
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                {filteredEntries.length} of {entries.length} entries
              </Badge>
              <Button onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search descriptions, original lines, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Assets">Assets</SelectItem>
                <SelectItem value="Liabilities">Liabilities</SelectItem>
                <SelectItem value="Equity">Equity</SelectItem>
                <SelectItem value="Revenue">Revenue</SelectItem>
                <SelectItem value="Expenses">Expenses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <SortableHeader field="date">Date</SortableHeader>
                  <SortableHeader field="description">Description</SortableHeader>
                  <SortableHeader field="originalLine">Original Line</SortableHeader>
                  <SortableHeader field="amount">Amount</SortableHeader>
                  <SortableHeader field="highLevelCategory">Category</SortableHeader>
                  <SortableHeader field="mainGrouping">Main Grouping</SortableHeader>
                  <SortableHeader field="ifrsCategory">IFRS Category</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr key={entry.id} className={`border-b border-border hover:bg-muted/30 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                    <td className="p-3 text-sm">{entry.date}</td>
                    <td className="p-3 font-medium">{entry.description}</td>
                    <td className="p-3 text-sm text-muted-foreground">{entry.originalLine}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(entry.amount)}</td>
                    <td className="p-3">
                      <Badge className={getCategoryBadgeColor(entry.highLevelCategory)}>
                        {entry.highLevelCategory}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{entry.mainGrouping}</td>
                    <td className="p-3">
                      <Badge variant="outline">{entry.ifrsCategory}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No entries match your search criteria.</p>
              <p className="text-sm mt-2">Try adjusting your search terms or filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
