'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { navForRole } from './nav-config';
import type { Role } from '@prisma/client';

type Props = {
  open: boolean;
  onClose: () => void;
  user: { displayName: string; role: Role; username: string };
};

export function MobileNavSheet({ open, onClose, user }: Props) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const items = navForRole(user.role);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close menu"
      />
      <aside className="absolute left-0 top-0 h-dvh w-72 bg-nav border-r flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-4 h-16 border-b">
          <Wordmark size="md" />
          <button onClick={onClose} className="text-muted-foreground p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3 space-y-2">
          <div className="flex gap-1">
            <Button
              variant={theme === 'light' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={theme === 'dark' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={theme === 'system' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setTheme('system')}
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
              {user.displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.displayName}</div>
              <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" type="submit">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
        </div>
      </aside>
    </div>
  );
}
