
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { FileSelector } from '@/components/FileSelector';
import { AlertCircle } from 'lucide-react';

export function FinancialStatements() {
  const { currentFinancialData } = useFinancialData();
  const { entries, companyName, reportPeriod } = currentFinancialData;
  
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(amount);

  // Show message if no data is available
  if (!entries || entries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Statements</h1>
          <p className="text-muted-foreground">Formatted financial statements based on processed data</p>
        </div>

        <FileSelector />

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Financial Data Available</h3>
            <p className="text-muted-foreground text-center">
              Please upload and process an Excel file using the Excel Processor to generate financial statements.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Balance Sheet Data
  const currentAssets = entries.filter(e => 
    e.highLevelCategory === 'Assets' && e.mainGrouping === 'Current Assets'
  );
  const nonCurrentAssets = entries.filter(e => 
    e.highLevelCategory === 'Assets' && (e.mainGrouping === 'Non-current Assets' || e.mainGrouping === 'Non-Current Assets')
  );
  const currentLiabilities = entries.filter(e => 
    e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Current Liabilities'
  );
  const nonCurrentLiabilities = entries.filter(e => 
    e.highLevelCategory === 'Liabilities' && (e.mainGrouping === 'Non-current Liabilities' || e.mainGrouping === 'Non-Current Liabilities')
  );
  const equity = entries.filter(e => e.highLevelCategory === 'Equity');

  // Income Statement Data
  const revenue = entries.filter(e => e.highLevelCategory === 'Revenue');
  const expenses = entries.filter(e => e.highLevelCategory === 'Expenses');
  
  const totalRevenue = revenue.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
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
        <p className="text-muted-foreground">{companyName || 'Company Financial Data'} - {reportPeriod || 'Current Period'}</p>
      </div>

      <FileSelector />

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
                {currentAssets.length > 0 && (
                  <>
                    <div className="font-semibold text-base mb-3">Current Assets</div>
                    {currentAssets.map(entry => (
                      <StatementRow 
                        key={entry.id}
                        label={entry.description || 'N/A'}
                        amount={entry.amount || 0}
                      />
                    ))}
                    <StatementRow 
                      label="Total Current Assets"
                      amount={currentAssets.reduce((sum, e) => sum + (e.amount || 0), 0)}
                      isSubtotal
                    />
                  </>
                )}
                
                {nonCurrentAssets.length > 0 && (
                  <>
                    <div className="font-semibold text-base mb-3 mt-6">Non-Current Assets</div>
                    {nonCurrentAssets.map(entry => (
                      <StatementRow 
                        key={entry.id}
                        label={entry.description || 'N/A'}
                        amount={entry.amount || 0}
                      />
                    ))}
                    <StatementRow 
                      label="Total Non-Current Assets"
                      amount={nonCurrentAssets.reduce((sum, e) => sum + (e.amount || 0), 0)}
                      isSubtotal
                    />
                  </>
                )}
                
                <StatementRow 
                  label="TOTAL ASSETS"
                  amount={[...currentAssets, ...nonCurrentAssets].reduce((sum, e) => sum + (e.amount || 0), 0)}
                  isTotal
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liabilities & Equity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentLiabilities.length > 0 && (
                  <>
                    <div className="font-semibold text-base mb-3">Current Liabilities</div>
                    {currentLiabilities.map(entry => (
                      <StatementRow 
                        key={entry.id}
                        label={entry.description || 'N/A'}
                        amount={entry.amount || 0}
                      />
                    ))}
                    <StatementRow 
                      label="Total Current Liabilities"
                      amount={currentLiabilities.reduce((sum, e) => sum + (e.amount || 0), 0)}
                      isSubtotal
                    />
                  </>
                )}
                
                {nonCurrentLiabilities.length > 0 && (
                  <>
                    <div className="font-semibold text-base mb-3 mt-6">Non-Current Liabilities</div>
                    {nonCurrentLiabilities.map(entry => (
                      <StatementRow 
                        key={entry.id}
                        label={entry.description || 'N/A'}
                        amount={entry.amount || 0}
                      />
                    ))}
                    <StatementRow 
                      label="Total Non-Current Liabilities"
                      amount={nonCurrentLiabilities.reduce((sum, e) => sum + (e.amount || 0), 0)}  
                      isSubtotal
                    />
                  </>
                )}
                
                {equity.length > 0 && (
                  <>
                    <div className="font-semibold text-base mb-3 mt-6">Equity</div>
                    {equity.map(entry => (
                      <StatementRow 
                        key={entry.id}
                        label={entry.description || 'N/A'}
                        amount={entry.amount || 0}
                      />
                    ))}
                    <StatementRow 
                      label="Total Equity"
                      amount={equity.reduce((sum, e) => sum + (e.amount || 0), 0)}
                      isSubtotal
                    />
                  </>
                )}
                
                <StatementRow 
                  label="TOTAL LIABILITIES & EQUITY"
                  amount={[...currentLiabilities, ...nonCurrentLiabilities, ...equity].reduce((sum, e) => sum + (e.amount || 0), 0)}
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
              {revenue.length > 0 && (
                <>
                  <div className="font-semibold text-base mb-3">Revenue</div>
                  {revenue.map(entry => (
                    <StatementRow 
                      key={entry.id}
                      label={entry.description || 'N/A'}
                      amount={entry.amount || 0}
                    />
                  ))}
                  <StatementRow 
                    label="Total Revenue"
                    amount={totalRevenue}
                    isSubtotal
                  />
                </>
              )}
              
              {expenses.length > 0 && (
                <>
                  <div className="font-semibold text-base mb-3 mt-6">Expenses</div>
                  {expenses.map(entry => (
                    <StatementRow 
                      key={entry.id}
                      label={entry.description || 'N/A'}
                      amount={entry.amount || 0}
                    />
                  ))}
                  <StatementRow 
                    label="Total Expenses"
                    amount={totalExpenses}
                    isSubtotal
                  />
                </>
              )}
              
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
                <p className="text-sm mt-2">Process Excel files with cash flow information to populate this section.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
