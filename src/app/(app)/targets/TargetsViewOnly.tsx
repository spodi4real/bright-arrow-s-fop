'use client';
import { Card, CardContent } from '@/components/ui/Card';
import { format } from 'date-fns';

type TargetRow = {
  id: string;
  metricLabel: string;
  workstream: string;
  amount: number;
  startDate: Date | string;
  endDate: Date | string;
  progress: number;
};

export function TargetsViewOnly({ targets }: { targets: TargetRow[] }) {
  if (targets.length === 0)
    return <Card className="p-8 text-center text-sm text-muted-foreground">No shared targets right now.</Card>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {targets.map((t) => {
        const pct = Math.min(100, (t.progress / Math.max(1, t.amount)) * 100);
        return (
          <Card key={t.id}><CardContent className="p-4">
            <div className="font-medium">{t.metricLabel}</div>
            <div className="text-xs text-muted-foreground mb-2">{t.workstream.replace(/_/g, ' ')} · {format(new Date(t.startDate), 'MMM d')} – {format(new Date(t.endDate), 'MMM d, yyyy')}</div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-medium">{t.progress} / {t.amount}</span>
              <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
          </CardContent></Card>
        );
      })}
    </div>
  );
}
