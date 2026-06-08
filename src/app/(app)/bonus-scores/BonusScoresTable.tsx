'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';

type Row = {
  user: { id: string; displayName: string; role: string };
  breakdown: {
    targetHitPct: number;
    productivity: number;
    quality: number;
    reliability: number;
    initiative: number;
    collaboration: number;
    violationReports: number;
    totalScore: number;
  };
};

export function BonusScoresTable({ rows }: { rows: Row[] }) {
  const [active, setActive] = useState<Row | null>(null);
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead>Strength</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.user.id} className="cursor-pointer" onClick={() => setActive(r)}>
                <TableCell>
                  <div>
                    <div className="font-medium">{r.user.displayName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{r.user.role}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">{r.breakdown.totalScore.toFixed(1)}</TableCell>
                <TableCell>
                  <Badge variant={r.breakdown.totalScore >= 80 ? 'success' : r.breakdown.totalScore >= 60 ? 'primary' : 'muted'}>
                    {r.breakdown.totalScore >= 80 ? 'Strong' : r.breakdown.totalScore >= 60 ? 'Solid' : 'Building'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <BreakdownDialog row={active} onClose={() => setActive(null)} />
      </CardContent>
    </Card>
  );
}

function BreakdownDialog({ row, onClose }: { row: Row | null; onClose: () => void }) {
  if (!row) return null;
  const items = [
    { label: 'Target hit %', value: row.breakdown.targetHitPct, weight: 25 },
    { label: 'Productivity', value: row.breakdown.productivity, weight: 20 },
    { label: 'Quality', value: row.breakdown.quality, weight: 15 },
    { label: 'Reliability', value: row.breakdown.reliability, weight: 15 },
    { label: 'Initiative', value: row.breakdown.initiative, weight: 10 },
    { label: 'Collaboration', value: row.breakdown.collaboration, weight: 10 },
    { label: 'Violation reports', value: row.breakdown.violationReports, weight: 5 },
  ];
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row.user.displayName} · {row.breakdown.totalScore.toFixed(1)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.label}>
              <div className="flex items-baseline justify-between mb-1 text-sm">
                <span>{i.label} <span className="text-muted-foreground">({i.weight}%)</span></span>
                <span className="font-medium">{i.value.toFixed(1)}</span>
              </div>
              <div className="h-1.5 bg-muted rounded overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${i.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
