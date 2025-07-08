import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { FileSelector } from '@/components/FileSelector';
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const { currentFinancialData, isProcessedData } = useFinancialData();
  const { entries, companyName, reportPeriod } = currentFinancialData;

  // Show message if no data is available or only mock data
  if (!entries || entries.length === 0 || (!isProcessedData && entries.length <= 10)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Financial overview and key metrics</p>
        </div>
        
        <FileSelector />
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Financial Data Available</h3>
            <p className="text-muted-foreground text-center">
              Please upload and process an Excel file using the Excel Processor to view financial data and metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate key metrics
  const totalAssets = entries
    .filter(e => e.highLevelCategory === 'Assets')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalLiabilities = entries
    .filter(e => e.highLevelCategory === 'Liabilities')  
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalEquity = entries
    .filter(e => e.highLevelCategory === 'Equity')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalRevenue = entries
    .filter(e => e.highLevelCategory === 'Revenue')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalExpenses = entries
    .filter(e => e.highLevelCategory === 'Expenses')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const netIncome = totalRevenue - totalExpenses;
  const debtToEquity = totalEquity !== 0 ? totalLiabilities / totalEquity : 0;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(amount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Financial overview and key metrics</p>
      </div>

      <FileSelector />
      
      <div>
        <h2 className="text-2xl font-bold text-foreground">{companyName || 'Company Financial Data'}</h2>
        <p className="text-muted-foreground">{reportPeriod || 'Current Period'}</p>
        {isProcessedData && (
          <p className="text-sm text-green-600 mt-1">✅ Showing processed Excel data ({entries.length} entries)</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssets)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            {netIncome >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEquity)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debt-to-Equity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{debtToEquity.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Balance Sheet Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Total Assets</span>
              <span>{formatCurrency(totalAssets)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Liabilities</span>
              <span>{formatCurrency(totalLiabilities)}</span>
            </div>
            <div className="flex justify-between border-t pt-4">
              <span className="font-medium">Total Equity</span>
              <span>{formatCurrency(totalEquity)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Statement Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Total Revenue</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Expenses</span>
              <span>{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between border-t pt-4">
              <span className={`font-medium ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Net Income
              </span>
              <span className={netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(netIncome)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
