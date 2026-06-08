'use client';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';

type Mission = { id: string; status: string };

export function MaintenanceRegistration({ mission }: { mission: Mission }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data, refetch } = useQuery({
    queryKey: ['maint-meters', mission.id],
    queryFn: async () => {
      const r = await fetch(`/api/missions/${mission.id}/maintenance-meters`);
      if (!r.ok) throw new Error('failed');
      return r.json() as Promise<{ meters: MaintRow[] }>;
    },
  });
  const meters = data?.meters || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Registered meters</CardTitle>
            {mission.status === 'active' && (
              <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Register meter</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {meters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meters registered yet.</p>
          ) : (
            <div className="space-y-2">
              {meters.map((m) => (
                <div key={m.id} className="flex items-start justify-between p-2 rounded border text-sm gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">{m.serialNumber}</div>
                    <div className="text-xs text-muted-foreground">{m.location}{m.enclosureNumber ? ` · ${m.enclosureNumber}` : ''}</div>
                    {m.description && <div className="text-xs mt-1">{m.description}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">{m.registeredBy.displayName} · {format(new Date(m.registeredAt), 'MMM d, HH:mm')}</div>
                  </div>
                  <Badge variant={m.status === 'resolved' ? 'success' : m.status === 'ongoing' ? 'warning' : 'muted'}>{m.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <MaintDialog
        open={open}
        onClose={() => setOpen(false)}
        missionId={mission.id}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['maint-meters', mission.id] });
          refetch();
          toast({ title: 'Meter registered', variant: 'success' });
        }}
      />
    </>
  );
}

type MaintRow = {
  id: string;
  serialNumber: string;
  location: string;
  enclosureNumber: string | null;
  description: string | null;
  status: 'resolved' | 'ongoing' | 'out_of_scope';
  registeredAt: string;
  registeredBy: { displayName: string };
};

function MaintDialog({ open, onClose, missionId, onCreated }: { open: boolean; onClose: () => void; missionId: string; onCreated: () => void }) {
  const [serial, setSerial] = useState('');
  const [location, setLocation] = useState('');
  const [enclosure, setEnclosure] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ongoing');
  const [busy, setBusy] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function reset() { setSerial(''); setLocation(''); setEnclosure(''); setDescription(''); setStatus('ongoing'); if (photoRef.current) photoRef.current.value = ''; }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoRef.current?.files?.[0]) { toast({ title: 'Photo is required', variant: 'danger' }); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append('serialNumber', serial);
    fd.append('location', location);
    if (enclosure) fd.append('enclosureNumber', enclosure);
    if (description) fd.append('description', description);
    fd.append('status', status);
    fd.append('photo', photoRef.current.files[0]);
    const r = await fetch(`/api/missions/${missionId}/maintenance-meters`, { method: 'POST', body: fd });
    setBusy(false);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      toast({ title: 'Could not save meter', description: data.error, variant: 'danger' });
    } else {
      onCreated();
      reset();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Register meter</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5"><Label>Serial number</Label><Input value={serial} onChange={(e) => setSerial(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Enclosure number (optional)</Label><Input value={enclosure} onChange={(e) => setEnclosure(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="space-y-1.5">
            <Label>Photo<span className="text-danger ml-0.5">*</span></Label>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => photoRef.current?.click()}><Camera className="h-4 w-4" /> Choose photo</Button>
              <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <RadioGroup value={status} onValueChange={setStatus} className="flex gap-3">
              {['resolved', 'ongoing', 'out_of_scope'].map((v) => (
                <label key={v} className="inline-flex items-center gap-1.5 text-xs capitalize cursor-pointer"><RadioGroupItem value={v} />{v.replace('_', ' ')}</label>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
