'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Bell, Menu, Search, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/brand/Wordmark';
import { MobileNavSheet } from './MobileNavSheet';
import type { Role } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';

export function TopBar({ user }: { user: { displayName: string; role: Role; username: string; id: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = titleFromPath(pathname);
  const { data: notifs } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const r = await fetch('/api/notifications?unread=true');
      if (!r.ok) return { count: 0 };
      return r.json();
    },
    refetchInterval: 60_000,
  });
  const unreadCount = notifs?.count ?? 0;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-nav px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground p-1"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Wordmark size="md" />
          </div>
          <h1 className="hidden lg:block text-base font-semibold truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
        </div>
      </header>
      <MobileNavSheet open={open} onClose={() => setOpen(false)} user={user} />
    </>
  );
}

function titleFromPath(path: string): string {
  const segs = path.split('/').filter(Boolean);
  if (segs.length === 0) return 'BrightArrow';
  const last = segs[segs.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
}
