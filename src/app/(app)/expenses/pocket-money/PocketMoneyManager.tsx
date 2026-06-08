'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';

type Row = { id: string; displayName: string; role: string; issued: number; spent: number; balance: number };

export function PocketMoneyManager({ users }: { users: Row[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [active, setActive] = useState<Row | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [busy, setBusy] = useState(false);

  function open(row: Row, m: 'add' | 'remove') { setActive(row); setMode(m); setAmount(''); setReason(''); }

  async function submit() {
    if (!active) return;
    setBusy(true);
    const r = await fetch('/api/pocket-money', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: active.id,
        amountUsd: mode === 'add' ? Math.abs(parseFloat(amount)) : -Math.abs(parseFloat(amount)),
        reason,
      }),
    });
    setBusy(false);
    if (r.ok) { toast({ title: mode === 'add' ? 'Issued' : 'Removed', variant: 'success' }); setActive(null); router.refresh(); }
    else toast({ title: 'Failed', variant: 'danger' });
  }

  return (
    <>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Issued</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell><div className="font-medium">{u.displayName}</div><div className="text-xs text-muted-foreground capitalize">{u.role}</div></TableCell>
                <TableCell className="text-right">{formatCurrency(u.issued, 'usd')}</TableCell>
                <TableCell className="text-right">{formatCurrency(u.spent, 'usd')}</TableCell>
                <TableCell className={`text-right font-medium ${u.balance < 0 ? 'text-warning' : ''}`}>{formatCurrency(u.balance, 'usd')}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => open(u, 'add')} title="Issue"><Plus className="h-4 w-4 text-success" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => open(u, 'remove')} title="Remove"><Minus className="h-4 w-4 text-danger" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{mode === 'add' ? 'Issue' : 'Remove'} pocket money — {active?.displayName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Amount (USD)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Cancel</Button>
            <Button onClick={submit} disabled={!amount || !reason || busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === 'add' ? 'Issue' : 'Remove'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
