import { FinancialData } from '@/types/financial';

export function financialDataToCSV(data: FinancialData): string {
  const header = [
    'Date',
    'Description',
    'Amount',
    'High Level Category',
    'Main Grouping',
    'IFRS Category'
  ];

  const rows = data.entries.map(e => [
    e.date,
    e.description.replace(/"/g, '""'),
    String(e.amount),
    e.highLevelCategory,
    e.mainGrouping,
    e.ifrsCategory
  ]);

  return [
    header.join(','),
    ...rows.map(r => r.map(value => `"${value}"`).join(','))
  ].join('\n');
}
