'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';

type TargetRow = {
  id: string;
  metricLabel: string;
  workstream: string;
  amount: number;
  startDate: Date | string;
  endDate: Date | string;
  visibleToUser: boolean;
  user: { id: string; displayName: string };
  progress: number;
};
type Candidate = { id: string; displayName: string; role: string };

export function TargetsManager({ initialTargets, users }: { initialTargets: TargetRow[]; users: Candidate[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  async function remove(id: string) {
    if (!confirm('Delete this target?')) return;
    const r = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
    if (r.ok) { router.refresh(); toast({ title: 'Target deleted', variant: 'success' }); }
  }
  async function toggleVisible(id: string, current: boolean) {
    const r = await fetch(`/api/targets/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visibleToUser: !current }),
    });
    if (r.ok) router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />New target</Button>
      </div>
      {initialTargets.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No targets yet.</Card>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {initialTargets.map((t) => {
          const pct = Math.min(100, (t.progress / Math.max(1, t.amount)) * 100);
          return (
            <Card key={t.id}><CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{t.metricLabel}</div>
                  <div className="text-xs text-muted-foreground">{t.user.displayName} · {t.workstream.replace(/_/g, ' ')}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => toggleVisible(t.id, t.visibleToUser)} title={t.visibleToUser ? 'Hide from user' : 'Show to user'}>
                    {t.visibleToUser ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-medium">{t.progress} / {t.amount}</span>
                  <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
      <TargetDialog open={open} onClose={() => setOpen(false)} users={users} onCreated={() => router.refresh()} />
    </div>
  );
}

function TargetDialog({ open, onClose, users, onCreated }: { open: boolean; onClose: () => void; users: Candidate[]; onCreated: () => void }) {
  const [userId, setUserId] = useState('');
  const [workstream, setWorkstream] = useState('');
  const [metricLabel, setMetricLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visibleToUser, setVisibleToUser] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch('/api/targets', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, workstream, metricLabel, amount: parseInt(amount, 10), startDate, endDate, visibleToUser }),
    });
    setBusy(false);
    if (!r.ok) { const d = await r.json().catch(() => ({})); toast({ title: 'Could not create', description: d.error, variant: 'danger' }); return; }
    toast({ title: 'Target created', variant: 'success' });
    onCreated(); onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New target</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Pick a user..." /></SelectTrigger>
              <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.displayName} ({u.role})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Workstream</Label>
            <Select value={workstream} onValueChange={setWorkstream}>
              <SelectTrigger><SelectValue placeholder="Pick..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rf_site_survey">RF Site Survey</SelectItem>
                <SelectItem value="site_maintenance">Site Maintenance</SelectItem>
                <SelectItem value="installation_supervising">Installation Supervising</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Metric label</Label><Input value={metricLabel} onChange={(e) => setMetricLabel(e.target.value)} placeholder="e.g. Gateways registered" /></div>
          <div className="space-y-1.5"><Label>Amount</Label><Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Start</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>End</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></div>
          </div>
          <label className="flex items-center justify-between rounded border p-3"><span className="text-sm">Share with user</span><Switch checked={visibleToUser} onCheckedChange={setVisibleToUser} /></label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
