'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { navForRole } from './nav-config';
import type { Role } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

export function Sidebar({ user }: { user: { displayName: string; role: Role; username: string } }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = navForRole(user.role);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-nav h-dvh sticky top-0 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 h-16 border-b">
        {!collapsed && <Wordmark size="md" />}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-muted-foreground hover:text-foreground p-1 rounded"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn('w-full justify-start', collapsed && 'justify-center')}>
              {mounted ? (
                theme === 'dark' ? <Moon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
              {!collapsed && <span className="ml-2">Theme</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className={cn('flex items-center gap-3 px-2', collapsed && 'justify-center px-0')}>
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            {user.displayName.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user.displayName}</div>
              <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
            </div>
          )}
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" className={cn('w-full justify-start text-muted-foreground', collapsed && 'justify-center')} type="submit">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </form>
      </div>
    </aside>
  );
}
