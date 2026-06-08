'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Plus, Calendar, User } from 'lucide-react';
import { useState } from 'react';
import type { Role } from '@prisma/client';
import { cn } from '@/lib/utils';
import { QuickActionsSheet } from './QuickActionsSheet';

export function MobileBottomNav({ user }: { user: { role: Role } }) {
  const pathname = usePathname();
  const [showActions, setShowActions] = useState(false);
  const showMissions = ['admin', 'supervisor', 'iskra', 'engineer'].includes(user.role);

  const items = [
    { label: 'Home', href: '/dashboard', icon: Home },
    showMissions ? { label: 'Missions', href: '/missions', icon: Briefcase } : { label: 'Expenses', href: '/expenses', icon: Briefcase },
    null,
    { label: 'Agenda', href: '/agenda', icon: Calendar },
    { label: 'Me', href: '/settings', icon: User },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-nav h-16 flex items-stretch justify-around px-1 safe-area-bottom">
        {items.map((item, i) => {
          if (item === null) {
            return (
              <button
                key="fab"
                onClick={() => setShowActions(true)}
                className="flex items-center justify-center -mt-5"
                aria-label="Quick actions"
              >
                <span className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                  <Plus className="h-6 w-6" />
                </span>
              </button>
            );
          }
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-1 text-[10px] font-medium',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <QuickActionsSheet open={showActions} onClose={() => setShowActions(false)} role={user.role} />
    </>
  );
}
