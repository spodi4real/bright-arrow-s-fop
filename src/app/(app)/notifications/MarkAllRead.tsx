'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

export function MarkAllRead() {
  const router = useRouter();
  async function go() {
    await fetch('/api/notifications', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'mark_all_read' }) });
    router.refresh();
  }
  return <Button variant="outline" size="sm" onClick={go}><Check className="h-3.5 w-3.5" /> Mark all read</Button>;
}
