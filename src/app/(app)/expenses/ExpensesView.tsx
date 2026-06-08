'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Wallet, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

type Expense = {
  id: string;
  name: string;
  note: string | null;
  amount: number;
  currency: 'usd' | 'iqd';
  amountUsd: number;
  status: 'pending' | 'approved' | 'denied';
  denialReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  submittedBy: { id: string; displayName: string };
  reviewedBy: { displayName: string } | null;
  files: { id: string; originalName: string }[];
};

export function ExpensesView({ expenses, isReviewer, rate, balance }: { expenses: Expense[]; isReviewer: boolean; rate: number; balance: number | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [denyOpen, setDenyOpen] = useState<{ open: boolean; ids: string[] } | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [busy, setBusy] = useState(false);

  const pendingIds = expenses.filter((e) => e.status === 'pending').map((e) => e.id);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function approveOne(id: string) {
    setBusy(true);
    const r = await fetch(`/api/expenses/${id}/review`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    setBusy(false);
    if (r.ok) { toast({ title: 'Approved', variant: 'success' }); router.refresh(); }
  }

  async function bulkApprove() {
    if (selected.size === 0) return;
    setBusy(true);
    const r = await fetch('/api/expenses/bulk-review', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), action: 'approve' }),
    });
    setBusy(false);
    if (r.ok) { toast({ title: `${selected.size} expenses approved`, variant: 'success' }); setSelected(new Set()); router.refresh(); }
  }

  function openDeny(ids: string[]) {
    setDenyReason('');
    setDenyOpen({ open: true, ids });
  }

  async function submitDeny() {
    if (!denyOpen || !denyReason) return;
    setBusy(true);
    const isBulk = denyOpen.ids.length > 1;
    const r = isBulk
      ? await fetch('/api/expenses/bulk-review', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ids: denyOpen.ids, action: 'deny', reason: denyReason }),
        })
      : await fetch(`/api/expenses/${denyOpen.ids[0]}/review`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'deny', reason: denyReason }),
        });
    setBusy(false);
    if (r.ok) {
      toast({ title: 'Denied', variant: 'success' });
      setDenyOpen(null);
      setSelected(new Set());
      router.refresh();
    }
  }

  return (
    <div>
      {balance !== null && (
        <Card className="mb-4">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" />Your pocket money balance</div>
              <div className={`text-2xl font-semibold mt-1 ${balance < 0 ? 'text-warning' : ''}`}>{formatCurrency(balance, 'usd')}</div>
            </div>
            <div className="text-xs text-muted-foreground">Current rate: <span className="font-medium text-foreground">{rate.toLocaleString()}</span> IQD/USD</div>
          </CardContent>
        </Card>
      )}

      {isReviewer && selected.size > 0 && (
        <Card className="mb-3 border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openDeny(Array.from(selected))} disabled={busy}><X className="h-3.5 w-3.5" /> Deny all</Button>
              <Button size="sm" onClick={bulkApprove} disabled={busy}><Check className="h-3.5 w-3.5" /> Approve all</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {expenses.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No expenses yet.</Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <Card key={e.id}><CardContent className="p-4">
              <div className="flex items-start gap-3">
                {isReviewer && e.status === 'pending' && (
                  <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggle(e.id)} className="mt-1" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {e.name}
                        <Badge variant={e.status === 'approved' ? 'success' : e.status === 'denied' ? 'danger' : 'warning'}>{e.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {formatCurrency(e.amount, e.currency)} ({formatCurrency(e.amountUsd, 'usd')})
                      </div>
                    </div>
                    {isReviewer && e.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => approveOne(e.id)} disabled={busy} title="Approve"><Check className="h-4 w-4 text-success" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => openDeny([e.id])} disabled={busy} title="Deny"><X className="h-4 w-4 text-danger" /></Button>
                      </div>
                    )}
                  </div>
                  {e.note && <p className="text-sm mt-1">{e.note}</p>}
                  <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    <span>{e.submittedBy.displayName}</span>
                    <span>{format(new Date(e.createdAt), 'MMM d, yyyy')}</span>
                    {e.files.length > 0 && (
                      <Link href={`/api/files/${e.files[0].id}`} target="_blank" className="text-primary hover:underline">view receipt</Link>
                    )}
                    {e.reviewedBy && <span>reviewed by {e.reviewedBy.displayName}</span>}
                  </div>
                  {e.denialReason && <div className="text-xs text-danger mt-1">Reason: {e.denialReason}</div>}
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={denyOpen?.open ?? false} onOpenChange={(o) => !o && setDenyOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deny expense{denyOpen && denyOpen.ids.length > 1 ? 's' : ''}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={denyReason} onChange={(e) => setDenyReason(e.target.value)} rows={3} required />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitDeny} disabled={!denyReason || busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Deny</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
