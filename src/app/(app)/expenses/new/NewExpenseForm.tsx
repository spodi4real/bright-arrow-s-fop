'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { useToast } from '@/components/ui/Toast';

export function NewExpenseForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'usd' | 'iqd'>('iqd');
  const [filename, setFilename] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { toast({ title: 'Receipt or photo required', variant: 'danger' }); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append('name', name);
    if (note) fd.append('note', note);
    fd.append('amount', amount);
    fd.append('currency', currency);
    fd.append('receipt', file);
    const r = await fetch('/api/expenses', { method: 'POST', body: fd });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      toast({ title: 'Could not submit', description: d.error, variant: 'danger' });
    } else {
      toast({ title: 'Expense submitted', variant: 'success' });
      router.push('/expenses');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Lunch with engineers" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <RadioGroup value={currency} onValueChange={(v) => setCurrency(v as 'usd' | 'iqd')} className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="iqd" />IQD</label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="usd" />USD</label>
              </RadioGroup>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Note (optional)</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} /></div>
          <div className="space-y-1.5">
            <Label>Receipt or proof photo</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Camera className="h-4 w-4" /> Choose photo</Button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" required onChange={(e) => setFilename(e.target.files?.[0]?.name || '')} />
              <span className="text-xs text-muted-foreground truncate">{filename}</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-start gap-1.5 mt-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />If you don't have a receipt, take a quick photo of where you bought from or what you bought.</div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Submit</Button>
      </div>
    </form>
  );
}
