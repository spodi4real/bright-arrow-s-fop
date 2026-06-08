'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

type Props = {
  mission: { id: string; expectedGatewayCount: number | null; referenceFile: { id: string; originalName: string } | null };
};

export function ReferenceFileUpload({ mission }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch(`/api/missions/${mission.id}/reference-file`, { method: 'POST', body: fd });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        toast({ title: 'Could not parse file', description: data.error, variant: 'danger' });
      } else {
        toast({ title: 'Reference file uploaded', variant: 'success' });
        router.refresh();
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Reference file
          {mission.referenceFile && (
            <span className="text-xs text-success flex items-center gap-1 font-normal"><FileCheck className="h-3.5 w-3.5" /> Loaded</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mission.referenceFile ? (
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{mission.referenceFile.originalName}</span>
            <span className="text-muted-foreground text-xs whitespace-nowrap ml-3">{mission.expectedGatewayCount ?? 0} gateways expected</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">Upload a KML, KMZ, CSV, or XLSX to set the expected gateway count.</p>
        )}
        <input ref={inputRef} type="file" accept=".kml,.kmz,.csv,.xlsx,.xls" className="hidden" onChange={onPick} />
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {mission.referenceFile ? 'Replace' : 'Upload reference'}
        </Button>
      </CardContent>
    </Card>
  );
}
