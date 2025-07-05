import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialData } from '@/contexts/FinancialDataContext';

export function FinancialStatements() {
  const { financialData } = useFinancialData();
  const { entries, companyName, reportPeriod } = financialData;
  
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(amount);

  // Balance Sheet Data
  const currentAssets = entries.filter(e => 
    e.highLevelCategory === 'Assets' && e.mainGrouping === 'Current Assets'
  );
  const nonCurrentAssets = entries.filter(e => 
    e.highLevelCategory === 'Assets' && e.mainGrouping === 'Non-current Assets'
  );
  const currentLiabilities = entries.filter(e => 
    e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Current Liabilities'
  );
  const nonCurrentLiabilities = entries.filter(e => 
    e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Non-current Liabilities'
  );
  const equity = entries.filter(e => e.highLevelCategory === 'Equity');

  // Income Statement Data
  const revenue = entries.filter(e => e.highLevelCategory === 'Revenue');
  const expenses = entries.filter(e => e.highLevelCategory === 'Expenses');
  
  const totalRevenue = revenue.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  const StatementRow = ({ label, amount, isSubtotal = false, isTotal = false }: {
    label: string;
    amount: number;
    isSubtotal?: boolean;
    isTotal?: boolean;
  }) => (
    <div className={`flex justify-between py-2 ${
      isTotal ? 'border-t-2 border-border font-bold text-lg' : 
      isSubtotal ? 'border-t border-border font-semibold' : ''
    }`}>
      <span className={isSubtotal || isTotal ? 'font-semibold' : ''}>{label}</span>
      <span className={isSubtotal || isTotal ? 'font-semibold' : ''}>{formatCurrency(amount)}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Statements</h1>
        <p className="text-muted-foreground">{companyName} - {reportPeriod}</p>
      </div>

      <Tabs defaultValue="balance-sheet" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="balance-sheet" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="font-semibold text-base mb-3">Current Assets</div>
                {currentAssets.map(entry => (
                  <StatementRow 
                    key={entry.id}
                    label={entry.description}
                    amount={entry.amount}
                  />
                ))}
                <StatementRow 
                  label="Total Current Assets"
                  amount={currentAssets.reduce((sum, e) => sum + e.amount, 0)}
                  isSubtotal
                />
                
                <div className="font-semibold text-base mb-3 mt-6">Non-Current Assets</div>
                {nonCurrentAssets.map(entry => (
                  <StatementRow 
                    key={entry.id}
                    label={entry.description}
                    amount={entry.amount}
                  />
                ))}
                <StatementRow 
                  label="Total Non-Current Assets"
                  amount={nonCurrentAssets.reduce((sum, e) => sum + e.amount, 0)}
                  isSubtotal
                />
                
                <StatementRow 
                  label="TOTAL ASSETS"
                  amount={[...currentAssets, ...nonCurrentAssets].reduce((sum, e) => sum + e.amount, 0)}
                  isTotal
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liabilities & Equity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="font-semibold text-base mb-3">Current Liabilities</div>
                {currentLiabilities.map(entry => (
                  <StatementRow 
                    key={entry.id}
                    label={entry.description}
                    amount={entry.amount}
                  />
                ))}
                <StatementRow 
                  label="Total Current Liabilities"
                  amount={currentLiabilities.reduce((sum, e) => sum + e.amount, 0)}
                  isSubtotal
                />
                
                <div className="font-semibold text-base mb-3 mt-6">Non-Current Liabilities</div>
                {nonCurrentLiabilities.map(entry => (
                  <StatementRow 
                    key={entry.id}
                    label={entry.description}
                    amount={entry.amount}
                  />
                ))}
                <StatementRow 
                  label="Total Non-Current Liabilities"
                  amount={nonCurrentLiabilities.reduce((sum, e) => sum + e.amount, 0)}  
                  isSubtotal
                />
                
                <div className="font-semibold text-base mb-3 mt-6">Equity</div>
                {equity.map(entry => (
                  <StatementRow 
                    key={entry.id}
                    label={entry.description}
                    amount={entry.amount}
                  />
                ))}
                <StatementRow 
                  label="Total Equity"
                  amount={equity.reduce((sum, e) => sum + e.amount, 0)}
                  isSubtotal
                />
                
                <StatementRow 
                  label="TOTAL LIABILITIES & EQUITY"
                  amount={[...currentLiabilities, ...nonCurrentLiabilities, ...equity].reduce((sum, e) => sum + e.amount, 0)}
                  isTotal
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income-statement">
          <Card>
            <CardHeader>
              <CardTitle>Income Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-semibold text-base mb-3">Revenue</div>
              {revenue.map(entry => (
                <StatementRow 
                  key={entry.id}
                  label={entry.description}
                  amount={entry.amount}
                />
              ))}
              <StatementRow 
                label="Total Revenue"
                amount={totalRevenue}
                isSubtotal
              />
              
              <div className="font-semibold text-base mb-3 mt-6">Expenses</div>
              {expenses.map(entry => (
                <StatementRow 
                  key={entry.id}
                  label={entry.description}
                  amount={entry.amount}
                />
              ))}
              <StatementRow 
                label="Total Expenses"
                amount={totalExpenses}
                isSubtotal
              />
              
              <StatementRow 
                label="NET INCOME"
                amount={netIncome}
                isTotal
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>Cash Flow Statement will be generated from detailed transaction data.</p>
                <p className="text-sm mt-2">Upload a PDF with cash flow information to populate this section.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}