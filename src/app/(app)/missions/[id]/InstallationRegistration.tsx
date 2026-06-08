'use client';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Camera, StickyNote, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { format } from 'date-fns';

type Mission = { id: string; status: string };

export function InstallationRegistration({ mission }: { mission: Mission }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data, refetch } = useQuery({
    queryKey: ['install-entries', mission.id],
    queryFn: async () => {
      const r = await fetch(`/api/missions/${mission.id}/installation-entries`);
      if (!r.ok) throw new Error('failed');
      return r.json() as Promise<{ meters: InstallMeterRow[]; notes: NoteRow[] }>;
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Activity</CardTitle>
            {mission.status === 'active' && (
              <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add entry</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="meters">
            <TabsList>
              <TabsTrigger value="meters">Meters checked ({data?.meters.length ?? 0})</TabsTrigger>
              <TabsTrigger value="notes">Notes ({data?.notes.length ?? 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="meters" className="space-y-2 mt-3">
              {(data?.meters || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No meters yet.</p>
              ) : (
                data?.meters.map((m) => (
                  <div key={m.id} className="p-2 rounded border text-sm">
                    <div className="font-medium flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5 text-muted-foreground" />{m.serialNumber}</div>
                    {m.observation && <div className="text-xs text-muted-foreground mt-0.5">{m.observation}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">{m.registeredBy.displayName} · {format(new Date(m.registeredAt), 'MMM d, HH:mm')}</div>
                  </div>
                ))
              )}
            </TabsContent>
            <TabsContent value="notes" className="space-y-2 mt-3">
              {(data?.notes || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                data?.notes.map((n) => (
                  <div key={n.id} className="p-2 rounded border text-sm">
                    <div className="flex items-start gap-1.5"><StickyNote className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><div className="flex-1">{n.noteText}</div></div>
                    <div className="text-[10px] text-muted-foreground mt-1">{n.createdBy.displayName} · {format(new Date(n.createdAt), 'MMM d, HH:mm')}</div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <InstallDialog open={open} onClose={() => setOpen(false)} missionId={mission.id} onCreated={() => {
        qc.invalidateQueries({ queryKey: ['install-entries', mission.id] });
        refetch();
        toast({ title: 'Entry added', variant: 'success' });
      }} />
    </>
  );
}

type InstallMeterRow = { id: string; serialNumber: string; observation: string | null; registeredAt: string; registeredBy: { displayName: string } };
type NoteRow = { id: string; noteText: string; createdAt: string; createdBy: { displayName: string } };

function InstallDialog({ open, onClose, missionId, onCreated }: { open: boolean; onClose: () => void; missionId: string; onCreated: () => void }) {
  const [tab, setTab] = useState('meter');
  const [serial, setSerial] = useState('');
  const [observation, setObservation] = useState('');
  const [noteText, setNoteText] = useState('');
  const [busy, setBusy] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function reset() { setSerial(''); setObservation(''); setNoteText(''); if (photoRef.current) photoRef.current.value = ''; }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData();
    fd.append('kind', tab);
    if (tab === 'meter') {
      if (!serial) { toast({ title: 'Serial required', variant: 'danger' }); setBusy(false); return; }
      fd.append('serialNumber', serial);
      if (observation) fd.append('observation', observation);
    } else {
      if (!noteText) { toast({ title: 'Note text required', variant: 'danger' }); setBusy(false); return; }
      fd.append('noteText', noteText);
    }
    if (photoRef.current?.files?.[0]) fd.append('photo', photoRef.current.files[0]);
    const r = await fetch(`/api/missions/${missionId}/installation-entries`, { method: 'POST', body: fd });
    setBusy(false);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      toast({ title: 'Could not save entry', description: data.error, variant: 'danger' });
    } else {
      onCreated();
      reset();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add entry</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="meter" className="flex-1">Meter checked</TabsTrigger>
            <TabsTrigger value="note" className="flex-1">Note</TabsTrigger>
          </TabsList>
          <form onSubmit={onSubmit} className="space-y-3 mt-3">
            <TabsContent value="meter" className="space-y-3 mt-0">
              <div className="space-y-1.5"><Label>Serial number</Label><Input value={serial} onChange={(e) => setSerial(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Observation</Label><Textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={3} /></div>
            </TabsContent>
            <TabsContent value="note" className="space-y-3 mt-0">
              <div className="space-y-1.5"><Label>Note</Label><Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="What was observed or said today..." /></div>
            </TabsContent>
            <div className="space-y-1.5">
              <Label>Photo (optional)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => photoRef.current?.click()}><Camera className="h-4 w-4" /> Choose photo</Button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
