'use client';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type Props = {
  user: { id: string; username: string; displayName: string; role: string; email: string | null };
  canEditRate: boolean;
  currentRate: number;
};

export function SettingsView({ user, canEditRate, currentRate }: Props) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [rate, setRate] = useState(String(currentRate));
  const [busy, setBusy] = useState(false);

  async function saveRate() {
    setBusy(true);
    const r = await fetch('/api/settings/exchange-rate', {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: parseFloat(rate) }),
    });
    setBusy(false);
    if (r.ok) toast({ title: 'Exchange rate updated', variant: 'success' });
    else toast({ title: 'Failed to update', variant: 'danger' });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Username" value={user.username} />
          <Field label="Display name" value={user.displayName} />
          <Field label="Role" value={user.role} capitalize />
          {user.email && <Field label="Email" value={user.email} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { v: 'light', label: 'Light', Icon: Sun },
              { v: 'dark', label: 'Dark', Icon: Moon },
              { v: 'system', label: 'System', Icon: Monitor },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setTheme(opt.v)}
                className={cn(
                  'flex-1 border rounded p-3 flex flex-col items-center gap-1 text-xs font-medium',
                  theme === opt.v ? 'border-primary bg-primary/5 text-primary' : 'border-input text-muted-foreground hover:text-foreground'
                )}
              >
                <opt.Icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {canEditRate && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Exchange rate</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Label>IQD per 1 USD</Label>
            <div className="flex gap-2">
              <Input type="number" step="1" value={rate} onChange={(e) => setRate(e.target.value)} className="flex-1" />
              <Button onClick={saveRate} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
            </div>
            <p className="text-xs text-muted-foreground">Historic expenses keep their original conversion rate.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium', capitalize && 'capitalize')}>{value}</span>
    </div>
  );
}
