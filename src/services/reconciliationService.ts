
import { FinancialEntry } from '@/types/financial';
import { ReconciliationResult } from '@/components/mapping/ReconciliationBadge';

// Mock reported totals that would typically be extracted from PDF
const MOCK_REPORTED_TOTALS: Record<string, { amount: number, pages: number[] }> = {
  'Cash and Cash Equivalents': { amount: 755000, pages: [3] },
  'Trade and Other Receivables': { amount: 980000, pages: [3] },
  'Inventories': { amount: 900000, pages: [3] },
  'Property, Plant and Equipment': { amount: 4750000, pages: [3] },
  'Intangible Assets': { amount: 120000, pages: [3] },
  'Goodwill': { amount: 800000, pages: [3] },
  'Right-of-Use Assets': { amount: 350000, pages: [3] },
  'Share Capital': { amount: 1000000, pages: [4] },
  'Share Premium': { amount: 500000, pages: [4] },
  'Retained Earnings': { amount: 2180000, pages: [4] },
  'Other Reserves': { amount: 150000, pages: [4] },
  'Borrowings': { amount: 1450000, pages: [4] },
  'Trade and Other Payables': { amount: 600000, pages: [4] },
  'Lease Liabilities': { amount: 280000, pages: [4] },
  'Tax Liabilities': { amount: 125000, pages: [4] },
  'Provisions': { amount: 95000, pages: [4] },
};

export class ReconciliationService {
  static performReconciliation(entries: FinancialEntry[]): ReconciliationResult[] {
    const results: ReconciliationResult[] = [];
    
    // Group entries by IFRS category
    const groupedEntries = entries.reduce((acc, entry) => {
      if (!acc[entry.ifrsCategory]) {
        acc[entry.ifrsCategory] = [];
      }
      acc[entry.ifrsCategory].push(entry);
      return acc;
    }, {} as Record<string, FinancialEntry[]>);

    // Process each category
    Object.entries(groupedEntries).forEach(([category, categoryEntries]) => {
      const mappedTotal = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const reportedData = MOCK_REPORTED_TOTALS[category];
      const reportedTotal = reportedData?.amount;
      const sourcePages = reportedData?.pages || [];
      
      let status: ReconciliationResult['status'] = 'no-total';
      let difference = 0;
      
      if (reportedTotal !== undefined) {
        difference = mappedTotal - reportedTotal;
        const percentageDiff = Math.abs(difference / reportedTotal) * 100;
        
        if (Math.abs(difference) < 1) {
          status = 'matched';
        } else if (percentageDiff <= 1) {
          status = 'minor-mismatch';
        } else {
          status = 'mismatch';
        }
      }
      
      results.push({
        category,
        mappedTotal,
        reportedTotal,
        difference,
        status,
        contributingItems: categoryEntries.map(entry => 
          `${entry.description} - ${new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 0 
          }).format(entry.amount)}`
        ),
        sourcePages
      });
    });
    
    return results;
  }
}
