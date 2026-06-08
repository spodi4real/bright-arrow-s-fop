'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

type UserRow = { id: string; username: string; displayName: string; role: string; email: string | null; active: boolean };

export function UsersManager({ initial, currentUserId }: { initial: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  async function remove(id: string) {
    if (!confirm('Deactivate this user?')) return;
    const r = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (r.ok) { toast({ title: 'Deactivated', variant: 'success' }); router.refresh(); }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-3.5 w-3.5" />New user</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initial.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.displayName}</TableCell>
                <TableCell className="text-muted-foreground">{u.username}</TableCell>
                <TableCell><Badge variant="muted" className="capitalize">{u.role}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{u.email || '—'}</TableCell>
                <TableCell>{u.active ? <Badge variant="success">active</Badge> : <Badge variant="muted">inactive</Badge>}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(u); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  {u.id !== currentUserId && u.active && <Button size="icon" variant="ghost" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      <UserDialog open={open} onClose={() => setOpen(false)} editing={editing} onSaved={() => router.refresh()} />
    </>
  );
}

function UserDialog({ open, onClose, editing, onSaved }: { open: boolean; onClose: () => void; editing: UserRow | null; onSaved: () => void }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setUsername(editing?.username || '');
      setDisplayName(editing?.displayName || '');
      setRole(editing?.role || '');
      setEmail(editing?.email || '');
      setPassword('');
    }
  }, [open, editing]);

  async function submit() {
    setBusy(true);
    const body = editing
      ? { username, displayName, role, email: email || null, ...(password ? { password } : {}) }
      : { username, displayName, role, email: email || null, password };
    const r = editing
      ? await fetch(`/api/users/${editing.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false);
    if (r.ok) { toast({ title: editing ? 'User updated' : 'User created', variant: 'success' }); onSaved(); onClose(); }
    else { const d = await r.json().catch(() => ({})); toast({ title: d.error || 'Failed', variant: 'danger' }); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? `Edit ${editing.displayName}` : 'New user'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Pick..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="iskra">Iskra</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Email (optional)</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>{editing ? 'New password (leave blank to keep)' : 'Password'}</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Save' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
