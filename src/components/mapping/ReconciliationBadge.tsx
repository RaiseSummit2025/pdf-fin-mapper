
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, MessageSquare } from 'lucide-react';

export interface ReconciliationResult {
  category: string;
  mappedTotal: number;
  reportedTotal?: number;
  difference: number;
  status: 'matched' | 'minor-mismatch' | 'mismatch' | 'no-total';
  contributingItems: string[];
  sourcePages: number[];
}

interface ReconciliationBadgeProps {
  result: ReconciliationResult;
  onReviewClick: (category: string) => void;
}

export const ReconciliationBadge = ({ result, onReviewClick }: ReconciliationBadgeProps) => {
  const getBadgeConfig = () => {
    switch (result.status) {
      case 'matched':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          variant: 'default' as const,
          color: 'bg-green-100 text-green-800 border-green-200',
          label: 'Matched'
        };
      case 'minor-mismatch':
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          variant: 'secondary' as const,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: 'Minor Mismatch'
        };
      case 'mismatch':
        return {
          icon: <XCircle className="h-3 w-3" />,
          variant: 'destructive' as const,
          color: 'bg-red-100 text-red-800 border-red-200',
          label: 'Mismatch'
        };
      default:
        return {
          icon: null,
          variant: 'outline' as const,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'No Total'
        };
    }
  };

  const config = getBadgeConfig();
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(amount);

  const needsReview = result.status === 'minor-mismatch' || result.status === 'mismatch';

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
        {result.reportedTotal && (
          <span className="ml-1 text-xs">
            ({formatCurrency(Math.abs(result.difference))})
          </span>
        )}
      </Badge>
      
      {needsReview && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onReviewClick(result.category)}
          className="h-6 w-6 p-0"
          title="Review discrepancy"
        >
          <MessageSquare className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
