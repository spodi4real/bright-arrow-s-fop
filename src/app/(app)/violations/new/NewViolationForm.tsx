'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { useToast } from '@/components/ui/Toast';

export function NewViolationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contractor, setContractor] = useState('');
  const [district, setDistrict] = useState('');
  const [place, setPlace] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...picked]);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) { toast({ title: 'Add at least one proof file', variant: 'danger' }); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', description);
    fd.append('contractor', contractor);
    fd.append('district', district);
    fd.append('place', place);
    fd.append('severity', severity);
    for (const f of files) fd.append('files', f);
    const r = await fetch('/api/violations', { method: 'POST', body: fd });
    setBusy(false);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      toast({ title: 'Failed to submit', description: data.error, variant: 'danger' });
    } else {
      toast({ title: 'Violation reported', variant: 'success' });
      router.push('/violations');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Contractor</Label>
              <Select value={contractor} onValueChange={setContractor}>
                <SelectTrigger><SelectValue placeholder="Pick..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bim">BIM</SelectItem>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                  <SelectItem value="shandez">Shandez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger><SelectValue placeholder="Pick..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sulaymaniyah">Sulaymaniyah</SelectItem>
                  <SelectItem value="duhok">Duhok</SelectItem>
                  <SelectItem value="erbil">Erbil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Place</Label><Input value={place} onChange={(e) => setPlace(e.target.value)} required /></div>
          <div className="space-y-1.5">
            <Label>Severity</Label>
            <RadioGroup value={severity} onValueChange={setSeverity} className="flex gap-3">
              <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer"><RadioGroupItem value="low" />Low</label>
              <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer"><RadioGroupItem value="medium" />Medium</label>
              <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer"><RadioGroupItem value="high" />High</label>
            </RadioGroup>
          </div>
          <div className="space-y-1.5">
            <Label>Proof (photos / videos)</Label>
            <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={onPickFiles} />
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}><Upload className="h-3.5 w-3.5" /> Add files</Button>
            {files.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                  </li>
                ))}
              </ul>
            )}
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
