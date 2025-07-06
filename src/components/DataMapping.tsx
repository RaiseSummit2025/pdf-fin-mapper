import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { ifrsCategories } from '@/data/mockData';
import { FinancialEntry } from '@/types/financial';
import { Edit, Save, X } from 'lucide-react';
import { ReconciliationBadge, ReconciliationResult } from './mapping/ReconciliationBadge';
import { ValidationChatAssistant } from './mapping/ValidationChatAssistant';
import { ReconciliationService } from '@/services/reconciliationService';
import React from 'react';

export function DataMapping() {
  const { financialData, setFinancialData } = useFinancialData();
  const [entries, setEntries] = useState<FinancialEntry[]>(financialData.entries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCategory, setTempCategory] = useState<string>('');
  const [reconciliationResults, setReconciliationResults] = useState<ReconciliationResult[]>([]);
  const [validationChatOpen, setValidationChatOpen] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<ReconciliationResult | null>(null);
  
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(amount);

  const handleEditCategory = (entry: FinancialEntry) => {
    setEditingId(entry.id);
    setTempCategory(entry.ifrsCategory);
  };

  const handleSaveCategory = (entryId: string) => {
    const updatedEntries = entries.map(entry => 
      entry.id === entryId 
        ? { ...entry, ifrsCategory: tempCategory }
        : entry
    );
    setEntries(updatedEntries);
    setFinancialData({ ...financialData, entries: updatedEntries });
    setEditingId(null);
    setTempCategory('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempCategory('');
  };

  const getCategoryOptions = (highLevelCategory: string) => {
    switch(highLevelCategory) {
      case 'Assets':
        return [...ifrsCategories.assets.current, ...ifrsCategories.assets.nonCurrent];
      case 'Liabilities':
        return [...ifrsCategories.liabilities.current, ...ifrsCategories.liabilities.nonCurrent];
      case 'Equity':
        return ifrsCategories.equity;
      case 'Revenue':
        return ifrsCategories.income;
      case 'Expenses':
        return ifrsCategories.expenses;
      default:
        return [];
    }
  };

  // Perform reconciliation when component mounts or entries change
  React.useEffect(() => {
    const results = ReconciliationService.performReconciliation(entries);
    setReconciliationResults(results);
  }, [entries]);

  const handleReviewClick = (category: string) => {
    const result = reconciliationResults.find(r => r.category === category);
    if (result) {
      setSelectedReconciliation(result);
      setValidationChatOpen(true);
    }
  };

  const handleApplyValidationChanges = (changes: any) => {
    // This would apply changes from the validation chat
    // For now, we'll just close the chat
    setValidationChatOpen(false);
    setSelectedReconciliation(null);
  };

  const getReconciliationResult = (category: string): ReconciliationResult | undefined => {
    return reconciliationResults.find(r => r.category === category);
  };

  const MappingTable = ({ title, filterCategory, mainGrouping }: {
    title: string;
    filterCategory: string;
    mainGrouping?: string;
  }) => {
    const filteredEntries = entries.filter(entry => {
      if (mainGrouping) {
        return entry.highLevelCategory === filterCategory && entry.mainGrouping === mainGrouping;
      }
      return entry.highLevelCategory === filterCategory;
    });

    const total = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);

    // Group by IFRS category for reconciliation badges
    const categorizedEntries = filteredEntries.reduce((acc, entry) => {
      if (!acc[entry.ifrsCategory]) {
        acc[entry.ifrsCategory] = [];
      }
      acc[entry.ifrsCategory].push(entry);
      return acc;
    }, {} as Record<string, FinancialEntry[]>);

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Badge variant="secondary">{formatCurrency(total)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Original Line</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">IFRS Category</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                  <th className="text-center p-3 font-medium">Validation</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categorizedEntries).map(([category, categoryEntries]) => {
                  const reconciliation = getReconciliationResult(category);
                  const categoryTotal = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
                  
                  return (
                    <React.Fragment key={category}>
                      {/* Category subtotal row */}
                      <tr className="bg-gray-50 border-b border-border font-medium">
                        <td className="p-3" colSpan={2}>{category}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(categoryTotal)}</td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3 text-center">
                          {reconciliation && (
                            <ReconciliationBadge 
                              result={reconciliation}
                              onReviewClick={handleReviewClick}
                            />
                          )}
                        </td>
                      </tr>
                      
                      {/* Individual entries */}
                      {categoryEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-border hover:bg-muted/50">
                          <td className="p-3 pl-6">{entry.description}</td>
                          <td className="p-3 text-muted-foreground text-sm">{entry.originalLine}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(entry.amount)}</td>
                          <td className="p-3">
                            {editingId === entry.id ? (
                              <Select value={tempCategory} onValueChange={setTempCategory}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getCategoryOptions(entry.highLevelCategory).map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline">{entry.ifrsCategory}</Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {editingId === entry.id ? (
                              <div className="flex items-center justify-center gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveCategory(entry.id)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="h-7 w-7 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditCategory(entry)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                          <td className="p-3"></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">IFRS Mapping</h1>
        <p className="text-muted-foreground">Review and adjust account classifications with validation</p>
      </div>

      <Tabs defaultValue="balance-sheet" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
        </TabsList>

        <TabsContent value="balance-sheet" className="space-y-6">
          <MappingTable 
            title="Current Assets" 
            filterCategory="Assets" 
            mainGrouping="Current Assets"
          />
          <MappingTable 
            title="Non-Current Assets" 
            filterCategory="Assets" 
            mainGrouping="Non-current Assets"
          />
          <MappingTable 
            title="Current Liabilities" 
            filterCategory="Liabilities" 
            mainGrouping="Current Liabilities"
          />
          <MappingTable 
            title="Non-Current Liabilities" 
            filterCategory="Liabilities" 
            mainGrouping="Non-current Liabilities"
          />
          <MappingTable 
            title="Equity" 
            filterCategory="Equity"
          />
        </TabsContent>

        <TabsContent value="income-statement" className="space-y-6">
          <MappingTable 
            title="Revenue" 
            filterCategory="Revenue"
          />
          <MappingTable 
            title="Expenses" 
            filterCategory="Expenses"
          />
        </TabsContent>
      </Tabs>

      <ValidationChatAssistant
        isOpen={validationChatOpen}
        onClose={() => {
          setValidationChatOpen(false);
          setSelectedReconciliation(null);
        }}
        reconciliationResult={selectedReconciliation}
        onApplyChanges={handleApplyValidationChanges}
      />
    </div>
  );
}
