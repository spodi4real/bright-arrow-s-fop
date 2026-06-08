'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

type EventRow = { id: string; title: string; location: string | null; startAt: string; endAt: string; attendees: { user: { displayName: string } }[] };
type MissionRow = { id: string; name: string; scheduledStartAt: string; status: string; type: string; endedAt: string | null };
type HolidayRow = { id: string; name: string; startDate: string; endDate: string };
type Candidate = { id: string; displayName: string; role: string };

export function AgendaView({ events, missions, holidays, users, canManageEvents, canManageHolidays }: { events: EventRow[]; missions: MissionRow[]; holidays: HolidayRow[]; users: Candidate[]; canManageEvents: boolean; canManageHolidays: boolean }) {
  const router = useRouter();
  const [cursor, setCursor] = useState(new Date());
  const [evOpen, setEvOpen] = useState(false);
  const [holOpen, setHolOpen] = useState(false);
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  const items = (date: Date) => {
    const ev = events.filter((e) => isSameDay(new Date(e.startAt), date));
    const ms = missions.filter((m) => isSameDay(new Date(m.scheduledStartAt), date));
    const hd = holidays.filter((h) => date >= new Date(h.startDate) && date <= new Date(h.endDate));
    return { ev, ms, hd };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(subMonths(cursor, 1))}>‹</Button>
          <div className="font-semibold text-base">{format(cursor, 'MMMM yyyy')}</div>
          <Button variant="outline" size="sm" onClick={() => setCursor(addMonths(cursor, 1))}>›</Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
        </div>
        <div className="flex gap-2">
          {canManageEvents && <Button size="sm" onClick={() => setEvOpen(true)}><Plus className="h-3.5 w-3.5" /> Event</Button>}
          {canManageHolidays && <Button size="sm" variant="outline" onClick={() => setHolOpen(true)}><Plus className="h-3.5 w-3.5" /> Holiday</Button>}
        </div>
      </div>

      <Tabs defaultValue="month">
        <TabsList><TabsTrigger value="month">Month</TabsTrigger><TabsTrigger value="list">List</TabsTrigger></TabsList>
        <TabsContent value="month">
          <Card><CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-7 gap-px text-xs text-muted-foreground border-b pb-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="text-center">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {days.map((d, i) => {
                const inMonth = isSameMonth(d, cursor);
                const i2 = items(d);
                const isToday = isSameDay(d, new Date());
                return (
                  <div key={i} className={cn(
                    'border rounded p-1.5 min-h-[80px] text-xs',
                    inMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground',
                    isToday && 'ring-1 ring-primary'
                  )}>
                    <div className="font-medium mb-1">{format(d, 'd')}</div>
                    <div className="space-y-0.5">
                      {i2.hd.map((h) => <div key={h.id} className="bg-success/15 text-success rounded px-1 truncate">{h.name}</div>)}
                      {i2.ms.map((m) => <Link key={m.id} href={`/missions/${m.id}`} className="block bg-primary/10 text-primary rounded px-1 truncate hover:bg-primary/20" title={m.name}>{m.name}</Link>)}
                      {i2.ev.map((e) => <div key={e.id} className="bg-warning/15 text-warning rounded px-1 truncate" title={e.title}>{e.title}</div>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="list">
          <Card><CardContent className="p-4 space-y-2">
            {[...missions.map((m) => ({ kind: 'mission' as const, date: new Date(m.scheduledStartAt), data: m })),
              ...events.map((e) => ({ kind: 'event' as const, date: new Date(e.startAt), data: e })),
              ...holidays.map((h) => ({ kind: 'holiday' as const, date: new Date(h.startDate), data: h }))]
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((it, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{it.kind === 'mission' ? it.data.name : it.kind === 'event' ? it.data.title : it.data.name}</div>
                      <div className="text-xs text-muted-foreground">{format(it.date, 'PPpp')}</div>
                    </div>
                  </div>
                  <Badge variant={it.kind === 'mission' ? 'primary' : it.kind === 'event' ? 'warning' : 'success'}>{it.kind}</Badge>
                </div>
              ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <EventDialog open={evOpen} onClose={() => setEvOpen(false)} users={users} onCreated={() => router.refresh()} />
      <HolidayDialog open={holOpen} onClose={() => setHolOpen(false)} onCreated={() => router.refresh()} />
    </div>
  );
}

function EventDialog({ open, onClose, users, onCreated }: { open: boolean; onClose: () => void; users: Candidate[]; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  async function submit() {
    setBusy(true);
    const r = await fetch('/api/agenda/events', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, location, note, startAt, endAt, attendeeIds: attendees }),
    });
    setBusy(false);
    if (r.ok) { toast({ title: 'Event created', variant: 'success' }); onCreated(); onClose(); }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New event</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Start</Label><Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>End</Label><Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Note</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} /></div>
          <div className="space-y-1.5">
            <Label>Attendees</Label>
            <div className="max-h-40 overflow-y-auto space-y-1 border rounded p-2">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={attendees.includes(u.id)} onCheckedChange={() => setAttendees((a) => a.includes(u.id) ? a.filter((x) => x !== u.id) : [...a, u.id])} />{u.displayName}</label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!title || !startAt || !endAt || busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HolidayDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  async function submit() {
    setBusy(true);
    const r = await fetch('/api/agenda/holidays', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate }),
    });
    setBusy(false);
    if (r.ok) { toast({ title: 'Holiday added', variant: 'success' }); onCreated(); onClose(); }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New holiday</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Start</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>End</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!name || !startDate || !endDate || busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Add</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
