import { FinancialEntry } from '@/types/financial';

export function financialDataToCSV(entries: FinancialEntry[]): string {
  const header = [
    'Date',
    'Description',
    'Original Line',
    'Amount',
    'High Level Category',
    'Main Grouping',
    'IFRS Category'
  ];

  const rows = entries.map(entry => [
    entry.date,
    entry.description,
    entry.originalLine ?? '',
    entry.amount.toString(),
    entry.highLevelCategory,
    entry.mainGrouping,
    entry.ifrsCategory
  ]);

  return [header, ...rows].map(row => row.join(',')).join('\n');
}
