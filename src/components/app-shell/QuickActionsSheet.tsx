'use client';
import Link from 'next/link';
import { X, Briefcase, AlertTriangle, Wallet } from 'lucide-react';
import type { Role } from '@prisma/client';
import { cn } from '@/lib/utils';

type Props = { open: boolean; onClose: () => void; role: Role };

export function QuickActionsSheet({ open, onClose, role }: Props) {
  if (!open) return null;
  const canCreateMission = ['admin', 'supervisor', 'iskra', 'engineer'].includes(role);
  const canExpense = role !== 'accountant';

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      <div className="absolute bottom-0 inset-x-0 bg-card border-t rounded-t-2xl p-4 pb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Quick actions</div>
          <button onClick={onClose} className="text-muted-foreground p-1"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {canCreateMission && (
            <Link
              href="/missions/new"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-md border bg-background hover:bg-muted/40"
            >
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">New Mission</span>
            </Link>
          )}
          {canExpense && (
            <Link
              href="/expenses/new"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-md border bg-background hover:bg-muted/40"
            >
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Add Expense</span>
            </Link>
          )}
          {role !== 'accountant' && (
            <Link
              href="/violations/new"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-md border bg-background hover:bg-muted/40"
            >
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="font-medium text-sm">Report Violation</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
