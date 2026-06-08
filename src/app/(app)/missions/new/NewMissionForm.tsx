'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import type { Role } from '@prisma/client';

type Candidate = { id: string; displayName: string; username: string; role: Role };

const TYPES = [
  { value: 'rf_site_survey', label: 'RF Site Survey' },
  { value: 'site_maintenance', label: 'Site Maintenance' },
  { value: 'installation_supervising', label: 'Installation Supervising' },
];
const DISTRICTS = [
  { value: 'sulaymaniyah', label: 'Sulaymaniyah' },
  { value: 'duhok', label: 'Duhok' },
  { value: 'erbil', label: 'Erbil' },
];
const CONTRACTORS = [
  { value: 'bim', label: 'BIM' },
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'shandez', label: 'Shandez' },
];
const METER_TYPES = ['me516', 'me513', 'mt880', 'am550dc', 'am550ct', 'gateway'] as const;

type Props = {
  candidates: Candidate[];
  isAdmin: boolean;
  currentUser: { id: string; displayName: string; role: Role };
};

export function NewMissionForm({ candidates, isAdmin, currentUser }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [zoneName, setZoneName] = useState('');
  const [contractor, setContractor] = useState<string>('');
  const [meterTypes, setMeterTypes] = useState<string[]>([]);
  const [scheduledStart, setScheduledStart] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          district,
          zoneName,
          contractor: type === 'installation_supervising' ? contractor : undefined,
          meterTypes: type === 'site_maintenance' ? meterTypes : undefined,
          scheduledStartAt: new Date(scheduledStart).toISOString(),
          memberIds: members,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        toast({ title: 'Could not create mission', description: data.error, variant: 'danger' });
        setLoading(false);
        return;
      }
      const data = await r.json();
      toast({ title: 'Mission created', variant: 'success' });
      router.push(`/missions/${data.mission.id}`);
    } catch {
      toast({ title: 'Network error', variant: 'danger' });
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Mission type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Pick a type..." /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Mission name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger><SelectValue placeholder="Pick a district..." /></SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">Zone name</Label>
              <Input id="zone" value={zoneName} onChange={(e) => setZoneName(e.target.value)} required />
            </div>
          </div>
          {type === 'installation_supervising' && (
            <div className="space-y-2">
              <Label>Contractor</Label>
              <Select value={contractor} onValueChange={setContractor}>
                <SelectTrigger><SelectValue placeholder="Pick a contractor..." /></SelectTrigger>
                <SelectContent>
                  {CONTRACTORS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {type === 'site_maintenance' && (
            <div className="space-y-2">
              <Label>Meter types</Label>
              <div className="grid grid-cols-2 gap-2">
                {METER_TYPES.map((mt) => (
                  <label key={mt} className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted/30">
                    <Checkbox checked={meterTypes.includes(mt)} onCheckedChange={() => setMeterTypes(toggle(meterTypes, mt))} />
                    <span className="text-sm uppercase">{mt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="start">Scheduled start</Label>
            <Input id="start" type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} required />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Team members</Label>
            <Badge variant="muted">{members.length} selected</Badge>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {isAdmin ? 'As admin, members are added directly.' : 'Members will receive an invitation they can accept or decline.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {candidates.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted/30">
                <Checkbox checked={members.includes(c.id)} onCheckedChange={() => setMembers(toggle(members, c.id))} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.displayName}</div>
                  <div className="text-xs text-muted-foreground capitalize">{c.role}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
        <Button type="submit" disabled={loading || !type || !district || !zoneName}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create mission
        </Button>
      </div>
    </form>
  );
}
