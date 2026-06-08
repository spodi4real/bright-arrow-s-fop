'use client';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Camera, Image as ImageIcon, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';

type Mission = { id: string; status: string };

export function GatewayRegistration({ mission }: { mission: Mission }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['gateways', mission.id],
    queryFn: async () => {
      const r = await fetch(`/api/missions/${mission.id}/gateways`);
      if (!r.ok) throw new Error('failed');
      return r.json() as Promise<{ gateways: GatewayRow[] }>;
    },
  });

  const gateways = data?.gateways || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Registered gateways</CardTitle>
            {mission.status === 'active' && (
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Register gateway
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {gateways.length === 0 ? (
            <p className="text-sm text-muted-foreground">No gateways registered yet.</p>
          ) : (
            <div className="space-y-2">
              {gateways.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div>
                    <div className="font-medium">{g.gatewayId}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.latitude ? `${g.latitude.toFixed(5)}, ${g.longitude?.toFixed(5)}` : 'coords as photo'} · {g.registeredBy.displayName} · {format(new Date(g.registeredAt), 'MMM d, HH:mm')}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {g.korekRating && <Badge variant="muted">K: {g.korekRating}</Badge>}
                    {g.zainRating && <Badge variant="muted">Z: {g.zainRating}</Badge>}
                    {g.asiacellRating && <Badge variant="muted">A: {g.asiacellRating}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <GatewayDialog
        open={open}
        onClose={() => setOpen(false)}
        missionId={mission.id}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['gateways', mission.id] });
          refetch();
          toast({ title: 'Gateway registered', variant: 'success' });
        }}
      />
    </>
  );
}

type GatewayRow = {
  id: string;
  gatewayId: string;
  latitude: number | null;
  longitude: number | null;
  korekRating: string | null;
  zainRating: string | null;
  asiacellRating: string | null;
  registeredAt: string;
  registeredBy: { displayName: string };
};

function GatewayDialog({ open, onClose, missionId, onCreated }: { open: boolean; onClose: () => void; missionId: string; onCreated: () => void }) {
  const [gatewayId, setGatewayId] = useState('');
  const [coordsText, setCoordsText] = useState('');
  const [korek, setKorek] = useState<string>('');
  const [zain, setZain] = useState<string>('');
  const [asia, setAsia] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const polePhotoRef = useRef<HTMLInputElement>(null);
  const areaVideoRef = useRef<HTMLInputElement>(null);
  const korekRef = useRef<HTMLInputElement>(null);
  const zainRef = useRef<HTMLInputElement>(null);
  const asiaRef = useRef<HTMLInputElement>(null);
  const coordsRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function reset() {
    setGatewayId(''); setCoordsText(''); setKorek(''); setZain(''); setAsia('');
    [polePhotoRef, areaVideoRef, korekRef, zainRef, asiaRef, coordsRef].forEach((r) => {
      if (r.current) r.current.value = '';
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('gatewayId', gatewayId);
      if (coordsText) fd.append('coordinatesText', coordsText);
      if (korek) fd.append('korekRating', korek);
      if (zain) fd.append('zainRating', zain);
      if (asia) fd.append('asiacellRating', asia);
      if (polePhotoRef.current?.files?.[0]) fd.append('polePhoto', polePhotoRef.current.files[0]);
      if (areaVideoRef.current?.files?.[0]) fd.append('areaVideo', areaVideoRef.current.files[0]);
      if (korekRef.current?.files?.[0]) fd.append('korekSignalPhoto', korekRef.current.files[0]);
      if (zainRef.current?.files?.[0]) fd.append('zainSignalPhoto', zainRef.current.files[0]);
      if (asiaRef.current?.files?.[0]) fd.append('asiacellSignalPhoto', asiaRef.current.files[0]);
      if (coordsRef.current?.files?.[0]) fd.append('coordinatesProof', coordsRef.current.files[0]);

      const r = await fetch(`/api/missions/${missionId}/gateways`, { method: 'POST', body: fd });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        toast({ title: 'Could not register gateway', description: data.error, variant: 'danger' });
      } else {
        onCreated();
        reset();
        onClose();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Register gateway</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gid">Gateway ID</Label>
              <Input id="gid" value={gatewayId} onChange={(e) => setGatewayId(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coords">Coordinates (lat, lng)</Label>
              <Input id="coords" value={coordsText} onChange={(e) => setCoordsText(e.target.value)} placeholder="00.00000000, 11.11111111" />
            </div>
          </div>
          <FilePicker label="Pole photo" inputRef={polePhotoRef} accept="image/*" required icon={<ImageIcon className="h-4 w-4" />} />
          <FilePicker label="Area video" inputRef={areaVideoRef} accept="video/*" required icon={<Video className="h-4 w-4" />} />
          <FilePicker label="Korek signal screenshot" inputRef={korekRef} accept="image/*" required icon={<Camera className="h-4 w-4" />} />
          <FilePicker label="Zain signal screenshot" inputRef={zainRef} accept="image/*" required icon={<Camera className="h-4 w-4" />} />
          <FilePicker label="Asiacell signal screenshot (optional)" inputRef={asiaRef} accept="image/*" icon={<Camera className="h-4 w-4" />} />
          <FilePicker label="Coordinates proof photo (if not text)" inputRef={coordsRef} accept="image/*" icon={<Camera className="h-4 w-4" />} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <RatingField label="Korek" value={korek} onChange={setKorek} />
            <RatingField label="Zain" value={zain} onChange={setZain} />
            <RatingField label="Asiacell" value={asia} onChange={setAsia} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Finish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FilePicker({ label, inputRef, accept, required, icon }: { label: string; inputRef: React.RefObject<HTMLInputElement>; accept: string; required?: boolean; icon?: React.ReactNode }) {
  const [filename, setFilename] = useState('');
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-danger ml-0.5">*</span>}</Label>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          {icon} Choose file
        </Button>
        <input ref={inputRef} type="file" accept={accept} required={required} className="hidden" onChange={(e) => setFilename(e.target.files?.[0]?.name || '')} />
        <span className="text-xs text-muted-foreground truncate">{filename}</span>
        {filename && <button type="button" onClick={() => { if (inputRef.current) inputRef.current.value = ''; setFilename(''); }} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}
      </div>
    </div>
  );
}

function RatingField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-3">
        {['bad', 'good', 'perfect'].map((v) => (
          <label key={v} className="inline-flex items-center gap-1.5 text-xs capitalize cursor-pointer">
            <RadioGroupItem value={v} />{v}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
